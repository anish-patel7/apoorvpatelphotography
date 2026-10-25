import { useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useStorage } from './useStorage';
import { logTechnicalError } from '../lib/adminErrors';
import { REEL_THUMBNAIL_BUCKET, getReelMediaType } from '../utils/reelMedia';
import { isValidInstagramUrl } from '../utils/instagram';
import { captureVideoFrame } from '../utils/videoOrientation';
import { renderReelPosterJpeg } from '../utils/reelPoster';
import type { InstagramReel } from '../types';

/**
 * Makes sure every reel has a cover image, without ever replacing a hand-picked one.
 *
 * Priority: 1. manual thumbnail (kept)  2. original Instagram cover (via /api/reel-thumbnail,
 * official Meta APIs, server side)  3. uploaded video: a frame of the video  4. branded poster.
 * Generated files use a fixed path per reel and are upserted, so retrying never duplicates
 * files or rows. Every write only replaces the exact value that was inspected.
 */

export type ThumbnailOutcome = 'original' | 'frame' | 'branded' | 'kept' | 'failed';

export interface ThumbnailSummary {
  original: number;
  frame: number;
  branded: number;
  kept: number;
  failed: number;
  /** True when the server has no Meta credentials (or is unreachable), so originals can't be fetched. */
  originalsUnavailable: boolean;
}

/** manual = uploaded/pasted by the admin; instagram = retrieved original; generated = automatic. */
export function thumbnailKind(url: string | null | undefined): 'missing' | 'manual' | 'instagram' | 'generated' {
  const u = String(url || '').trim();
  if (!u || /^(blob|data):/i.test(u)) return 'missing';
  if (u.includes(`/${REEL_THUMBNAIL_BUCKET}/instagram/`)) return 'instagram';
  if (u.includes(`/${REEL_THUMBNAIL_BUCKET}/generated/`)) return 'generated';
  return 'manual';
}

/** Loads an image to check the stored URL still works. */
function isImageReachable(url: string, timeoutMs = 8000): Promise<boolean> {
  return new Promise(resolve => {
    const img = new Image();
    const timer = setTimeout(() => done(false), timeoutMs);
    function done(ok: boolean) {
      clearTimeout(timer);
      img.onload = img.onerror = null;
      resolve(ok);
    }
    img.onload = () => done(img.naturalWidth > 0);
    img.onerror = () => done(false);
    img.src = url;
  });
}

type ServerResult = { id: string; status: 'instagram' | 'unavailable' | 'skipped' | 'error'; reason?: string; thumbnail_url?: string };

async function requestOriginalCovers(ids: string[], broken: string[]): Promise<{ results: Map<string, ServerResult>; available: boolean }> {
  const results = new Map<string, ServerResult>();
  if (ids.length === 0) return { results, available: true };
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { results, available: false };
  let available = true;
  for (let i = 0; i < ids.length; i += 25) {
    const chunk = ids.slice(i, i + 25);
    try {
      const res = await fetch('/api/reel-thumbnail', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: chunk, broken: broken.filter(id => chunk.includes(id)) }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        available = false;
        logTechnicalError('Reel thumbnail endpoint', new Error(body?.error || `HTTP ${res.status}`));
        continue;
      }
      if (body.configured === false) available = false;
      for (const r of body.results as ServerResult[]) results.set(r.id, r);
    } catch (err) {
      // Local preview without serverless functions, or offline.
      available = false;
      logTechnicalError('Reel thumbnail endpoint', err);
    }
  }
  return { results, available };
}

export type InstagramConnection =
  | { state: 'checking' | 'unreachable' | 'not_configured' | 'token_expired' | 'api_error' }
  | { state: 'connected'; username: string };

/** Asks the server whether original Instagram covers can be fetched (no secrets are returned). */
export async function checkInstagramConnection(): Promise<InstagramConnection> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { state: 'unreachable' };
  try {
    const res = await fetch('/api/reel-thumbnail', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ check: true }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.success) return { state: 'unreachable' };
    if (body.instagram === 'connected') return { state: 'connected', username: String(body.username || '') };
    if (body.instagram === 'token_expired' || body.instagram === 'api_error') return { state: body.instagram };
    return { state: 'not_configured' };
  } catch {
    return { state: 'unreachable' };
  }
}

const safeId = (id: string) => id.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80) || 'reel';

export function useReelThumbnails(onSaved?: () => Promise<unknown> | void) {
  const storage = useStorage(REEL_THUMBNAIL_BUCKET);
  const [running, setRunning] = useState(false);
  const busy = useRef(false);

  /** Uploads to a fixed path and swaps the URL in only if the row still holds `expected` ('' = empty or null). */
  const saveGenerated = async (reel: InstagramReel, blob: Blob, name: string, expected: string): Promise<boolean> => {
    const file = new File([blob], `${name}.jpg`, { type: 'image/jpeg' });
    const { publicUrl } = await storage.uploadFile(file, {
      allowedTypes: ['image/jpeg'],
      maxBytes: 5 * 1024 * 1024,
      path: `generated/${name}.jpg`,
      upsert: true,
    });
    const url = `${publicUrl}?v=${Date.now()}`;
    let query = (supabase.from('instagram_reels').update as any)({ thumbnail_url: url }).eq('id', reel.id);
    query = expected ? query.eq('thumbnail_url', expected) : query.or('thumbnail_url.is.null,thumbnail_url.eq.');
    const { data, error } = await query.select('id');
    if (error) throw error;
    return Boolean(data && data.length);
  };

  const fixThumbnails = async (
    reels: InstagramReel[],
    onProgress?: (message: string) => void
  ): Promise<ThumbnailSummary> => {
    const summary: ThumbnailSummary = { original: 0, frame: 0, branded: 0, kept: 0, failed: 0, originalsUnavailable: false };
    if (!isSupabaseConfigured || busy.current) return summary;
    busy.current = true;
    setRunning(true);
    try {
      // 1. Decide what each reel needs (a broken stored URL counts as missing).
      type Plan = { reel: InstagramReel; current: string; kind: ReturnType<typeof thumbnailKind>; wantsOriginal: boolean; broken: boolean };
      const plans: Plan[] = [];
      for (const reel of reels) {
        const type = getReelMediaType(reel);
        if (type === 'youtube') { summary.kept++; continue; } // YouTube supplies its own thumbnail
        const current = reel.thumbnail_url || '';
        let kind = thumbnailKind(current);
        let broken = false;
        if (kind !== 'missing' && !(await isImageReachable(current))) {
          kind = 'missing';
          broken = true;
        }
        if (kind === 'manual' || kind === 'instagram') { summary.kept++; continue; }
        const hasInstagram = isValidInstagramUrl(reel.instagram_url || reel.url || '');
        // A generated poster is only worth revisiting when an original cover could replace it.
        if (kind === 'generated' && !hasInstagram) { summary.kept++; continue; }
        plans.push({ reel, current, kind, wantsOriginal: hasInstagram, broken });
      }
      if (plans.length === 0) return summary;

      // 2. Original Instagram covers, server side.
      onProgress?.('Fetching Reel thumbnail…');
      const wanted = plans.filter(p => p.wantsOriginal);
      const { results, available } = await requestOriginalCovers(wanted.map(p => p.reel.id), wanted.filter(p => p.broken).map(p => p.reel.id));
      summary.originalsUnavailable = !available;

      // 3. Fallbacks for the rest.
      for (const plan of plans) {
        const server = results.get(plan.reel.id);
        if (server?.status === 'instagram') { summary.original++; continue; }
        if (server?.status === 'skipped' && (server.reason === 'manual_thumbnail' || server.reason === 'has_original')) { summary.kept++; continue; }
        if (plan.kind === 'generated') { summary.kept++; continue; } // keep the existing automatic image
        try {
          const name = safeId(plan.reel.id);
          const isVideo = getReelMediaType(plan.reel) === 'video' && plan.reel.video_url;
          const frame = isVideo ? await captureVideoFrame(plan.reel.video_url!) : null;
          if (frame) {
            onProgress?.('Creating thumbnail from the video…');
            if (await saveGenerated(plan.reel, frame, `${name}-frame`, plan.current)) summary.frame++;
            else summary.kept++;
          } else {
            onProgress?.('Original cover unavailable; creating branded thumbnail…');
            const poster = await renderReelPosterJpeg(isVideo ? 'FILM' : 'REEL');
            if (await saveGenerated(plan.reel, poster, name, plan.current)) summary.branded++;
            else summary.kept++;
          }
        } catch (err) {
          logTechnicalError('Generate reel thumbnail', err);
          summary.failed++;
        }
      }
      await onSaved?.();
      return summary;
    } finally {
      busy.current = false;
      setRunning(false);
    }
  };

  return { fixThumbnails, running };
}
