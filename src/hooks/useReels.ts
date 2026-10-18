import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { instagramReels } from '../data/reels';
import { getInstagramType, isValidInstagramUrl, parseInstagramUrl } from '../utils/instagram';
import {
  HOMEPAGE_REEL_LIMIT,
  REEL_THUMBNAIL_BUCKET,
  REEL_VIDEO_BUCKET,
  hasPlayableMedia,
  isDirectVideoUrl,
  isTemporaryUrl,
} from '../utils/reelMedia';
import { getStoragePathFromPublicUrl } from './useStorage';
import { parseYouTubeUrl } from '../utils/youtube';
import { FriendlyError, isMissingSchemaError, logTechnicalError, toFriendly } from '../lib/adminErrors';
import type { InstagramReel, ReelMediaType } from '../types';

export function mapDatabaseRowToReel(row: any): InstagramReel {
  const isFeatured = Boolean(row.is_featured ?? row.featured ?? false);
  const displayOrder = Number(row.display_order ?? row.sort_order ?? 0);
  let instagramUrl: string = row.instagram_url || row.url || '';
  let videoUrl: string = row.video_url || '';
  let youtubeUrl: string = row.youtube_url || '';
  const thumbnail = row.thumbnail_url || row.thumbnail || '';
  const status = (row.status as 'configured' | 'incomplete') || 'configured';

  // Records saved before migration 008 kept uploaded videos in instagram_url.
  if (!videoUrl && instagramUrl && !isValidInstagramUrl(instagramUrl) && isDirectVideoUrl(instagramUrl)) {
    videoUrl = instagramUrl;
    instagramUrl = '';
  }
  // Before migration 012, YouTube links were saved in video_url (or instagram_url before 008).
  if (!youtubeUrl && videoUrl && parseYouTubeUrl(videoUrl)) {
    youtubeUrl = videoUrl;
    videoUrl = '';
  }
  if (!youtubeUrl && instagramUrl && parseYouTubeUrl(instagramUrl)) {
    youtubeUrl = instagramUrl;
    instagramUrl = '';
  }
  if (isTemporaryUrl(videoUrl)) videoUrl = '';
  if (isTemporaryUrl(instagramUrl)) instagramUrl = '';

  let mediaType: ReelMediaType =
    row.media_type === 'video' || row.media_type === 'instagram' || row.media_type === 'youtube'
      ? row.media_type
      : videoUrl ? 'video' : 'instagram';
  if (youtubeUrl && !videoUrl) mediaType = 'youtube';

  return {
    id: String(row.id),
    title: row.title || '',
    thumbnail,
    thumbnail_url: thumbnail,
    url: instagramUrl,
    instagram_url: instagramUrl,
    video_url: videoUrl || undefined,
    youtube_url: youtubeUrl || undefined,
    media_type: mediaType,
    description: row.description || '',
    featured: isFeatured,
    is_featured: isFeatured,
    is_published: status === 'configured',
    display_order: displayOrder,
    content_type: row.content_type || 'reel',
    status,
    video_width: row.video_width ? Number(row.video_width) : undefined,
    video_height: row.video_height ? Number(row.video_height) : undefined,
    aspect_ratio: row.aspect_ratio ? Number(row.aspect_ratio) : undefined,
    orientation: row.orientation || (row.content_type === 'reel' ? 'portrait' : undefined),
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
  };
}

function assertPersistableUrl(url: string, label: string) {
  if (isTemporaryUrl(url)) {
    throw new FriendlyError(`${label} is a temporary browser preview link and cannot be saved. Wait for the upload to finish.`);
  }
}

/**
 * Converts form/admin input into a database payload.
 * Only fields that are present in `input` are written, so partial updates
 * (e.g. toggling the Featured flag) never touch publication status.
 */
export function formatReelPayload(input: any) {
  const payload: Record<string, any> = {};

  if (input.id !== undefined && input.id !== null) {
    payload.id = String(input.id);
  }
  if (input.title !== undefined) {
    payload.title = String(input.title).trim();
  }

  // Database column: instagram_url (accepts input.instagram_url or input.url)
  const igUrl = input.instagram_url !== undefined ? input.instagram_url : input.url;
  if (igUrl !== undefined) {
    const trimmed = igUrl === null ? '' : String(igUrl).trim();
    assertPersistableUrl(trimmed, 'Instagram URL');
    if (!trimmed) {
      payload.instagram_url = null;
    } else {
      const parsed = parseInstagramUrl(trimmed);
      if (!parsed.isValid || !parsed.canonicalUrl) {
        throw new FriendlyError('Please enter a valid Instagram post or reel URL (e.g. https://www.instagram.com/reel/...).');
      }
      payload.instagram_url = parsed.canonicalUrl;
      if (input.content_type === undefined) {
        payload.content_type = getInstagramType(parsed.canonicalUrl) === 'post' ? 'post' : 'reel';
      }
    }
  }

  if (input.video_url !== undefined) {
    const trimmed = input.video_url === null ? '' : String(input.video_url).trim();
    assertPersistableUrl(trimmed, 'Video URL');
    payload.video_url = trimmed || null;
  }

  if (input.youtube_url !== undefined) {
    const trimmed = input.youtube_url === null ? '' : String(input.youtube_url).trim();
    if (!trimmed) {
      payload.youtube_url = null;
    } else {
      const parsed = parseYouTubeUrl(trimmed);
      if (!parsed) throw new FriendlyError('Please enter a valid YouTube link (e.g. https://www.youtube.com/shorts/...).');
      payload.youtube_url = parsed.canonicalUrl;
    }
  }

  if (input.description !== undefined) {
    payload.description = input.description === null ? '' : String(input.description).trim().slice(0, 500);
  }

  if (input.media_type !== undefined) {
    if (input.media_type !== 'instagram' && input.media_type !== 'video' && input.media_type !== 'youtube') {
      throw new FriendlyError(`Unknown media type "${input.media_type}".`);
    }
    payload.media_type = input.media_type;
  }

  // Database column: thumbnail_url (accepts input.thumbnail_url or input.thumbnail)
  const thumbUrl = input.thumbnail_url ?? input.thumbnail;
  if (thumbUrl !== undefined) {
    const trimmed = thumbUrl === null ? '' : String(thumbUrl).trim();
    assertPersistableUrl(trimmed, 'Thumbnail URL');
    payload.thumbnail_url = trimmed;
  }

  // Database column: is_featured (accepts input.is_featured or input.featured)
  const featuredVal = input.is_featured ?? input.featured;
  if (featuredVal !== undefined) {
    payload.is_featured = Boolean(featuredVal);
  }

  // Database column: display_order (accepts input.display_order or input.sort_order)
  const orderVal = input.display_order ?? input.sort_order;
  if (orderVal !== undefined) {
    const n = Number(orderVal);
    payload.display_order = Number.isFinite(n) ? Math.round(n) : 0;
  }

  if (input.content_type !== undefined) {
    payload.content_type = input.content_type;
  }

  // Video orientation & dimension metadata
  if (input.video_width !== undefined) {
    payload.video_width = input.video_width ? Number(input.video_width) : null;
  }
  if (input.video_height !== undefined) {
    payload.video_height = input.video_height ? Number(input.video_height) : null;
  }
  if (input.aspect_ratio !== undefined) {
    payload.aspect_ratio = input.aspect_ratio ? Number(input.aspect_ratio) : null;
  }
  if (input.orientation !== undefined) {
    payload.orientation = input.orientation;
  }

  // Database column: status ('configured' = published, 'incomplete' = draft).
  // Written only when explicitly provided — never defaulted here.
  if (input.status !== undefined) {
    payload.status = input.status === 'configured' ? 'configured' : 'incomplete';
  } else if (input.is_published !== undefined) {
    payload.status = input.is_published ? 'configured' : 'incomplete';
  }

  return payload;
}

/**
 * Columns added by migration 008. If the one-time setup has not been run yet, saves are
 * retried in the pre-008 format (uploaded video URL kept in instagram_url, which
 * mapDatabaseRowToReel understands) so the owner can keep working; the gap is logged.
 */
function toLegacyReelPayload(payload: Record<string, any>): Record<string, any> {
  const legacy = { ...payload };
  if (legacy.media_type === 'video' && legacy.video_url) legacy.instagram_url = legacy.video_url;
  delete legacy.video_url;
  delete legacy.media_type;
  return legacy;
}

/**
 * Columns/values added by migration 012. Without it, YouTube entries are kept in
 * video_url (mapDatabaseRowToReel recognises YouTube links there) and the optional
 * description is skipped, so nothing the owner adds is lost.
 */
function toPre012ReelPayload(payload: Record<string, any>): Record<string, any> {
  const compat = { ...payload };
  delete compat.description;
  if (compat.media_type === 'youtube') {
    compat.media_type = 'video';
    compat.video_url = compat.youtube_url ?? compat.video_url;
  }
  delete compat.youtube_url;
  return compat;
}

const is012Missing = (error: any, payload: Record<string, any>) =>
  ('youtube_url' in payload || 'description' in payload || payload.media_type === 'youtube') &&
  (isMissingSchemaError(error) || (error?.code === '23514' && /media_type_check/i.test(error?.message || '')));

async function writeWithSchemaFallback<T>(
  payload: Record<string, any>,
  write: (body: Record<string, any>) => PromiseLike<{ data: T; error: any }>,
  context: string
): Promise<T> {
  let { data, error } = await write(payload);
  if (error && is012Missing(error, payload)) {
    logTechnicalError(`${context} (database setup 012 not applied; saved in compatibility format)`, error);
    payload = toPre012ReelPayload(payload);
    ({ data, error } = await write(payload));
  }
  if (error && isMissingSchemaError(error) && ('video_url' in payload || 'media_type' in payload)) {
    logTechnicalError(`${context} (database setup 008 not applied; saved in compatibility format)`, error);
    ({ data, error } = await write(toLegacyReelPayload(payload)));
  }
  if (error) {
    if (error.code === '23505') throw new FriendlyError('This Instagram link has already been added.');
    if (error.code === '23514') throw new FriendlyError('Please add a video, a YouTube link or an Instagram link before publishing.');
    throw toFriendly(error, context);
  }
  return data;
}

function newReelId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `reel_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

// Demo content is only used when Supabase is not configured (local preview / static build).
const fallbackReels: InstagramReel[] = instagramReels.map((r, idx) => ({
  id: r.id,
  thumbnail: r.thumbnail,
  thumbnail_url: r.thumbnail,
  url: r.url,
  instagram_url: r.url,
  media_type: 'instagram',
  title: r.title,
  featured: r.featured ?? true,
  is_featured: r.featured ?? true,
  is_published: r.status !== 'incomplete',
  display_order: idx + 1,
  status: r.status || 'configured',
  content_type: 'reel',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

/** Public homepage hook: Published + Featured reels only. */
export function useReels(limit: number = HOMEPAGE_REEL_LIMIT) {
  const [reels, setReels] = useState<InstagramReel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReels = useCallback(async () => {
    if (!isSupabaseConfigured) {
      await Promise.resolve();
      setReels(fallbackReels.filter(r => r.is_published && r.is_featured).slice(0, limit));
      setLoading(false);
      return;
    }

    try {
      const { data, error: queryError } = await supabase
        .from('instagram_reels')
        .select('*')
        .eq('status', 'configured')
        .eq('is_featured', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (queryError) {
        console.error('Instagram reels fetch error:', queryError.message);
        setError('Our latest films and reels are temporarily unavailable.');
        setReels([]);
      } else {
        setError(null);
        setReels(((data || []) as any[]).map(mapDatabaseRowToReel).filter(hasPlayableMedia));
      }
    } catch (err) {
      console.error('Instagram reels network error:', err);
      setError('Our latest films and reels are temporarily unavailable.');
      setReels([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void fetchReels();
  }, [fetchReels]);

  return { reels, loading, error, refetch: fetchReels };
}

/** Admin hook: every reel (drafts included) plus mutations. */
export function useReelsAdmin() {
  const [reels, setReels] = useState<InstagramReel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<InstagramReel[]> => {
    const { data, error: queryError } = await supabase
      .from('instagram_reels')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (queryError) {
      setError(toFriendly(queryError, 'Load reels', 'Your reels could not be loaded. Please refresh the page.').message);
      setLoading(false);
      return [];
    }
    const mapped = ((data || []) as any[]).map(mapDatabaseRowToReel);
    setError(null);
    setReels(mapped);
    setLoading(false);
    return mapped;
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async (reelData: any) => {
    const payload = formatReelPayload({ ...reelData, id: reelData.id ?? newReelId() });
    // New entries are drafts unless publication was explicitly requested.
    if (payload.status === undefined) payload.status = 'incomplete';
    const data = await writeWithSchemaFallback(
      payload,
      body => (supabase.from('instagram_reels').insert as any)([body]).select(),
      'Create reel'
    );
    await load();
    return data;
  };

  const update = async (id: string, updates: any) => {
    const payload = formatReelPayload(updates);
    delete payload.id; // Do not update primary key
    if (Object.keys(payload).length === 0) return null;
    const data = await writeWithSchemaFallback<any[]>(
      payload,
      body => (supabase.from('instagram_reels').update as any)(body).eq('id', id).select(),
      'Update reel'
    );
    if (!data || data.length === 0) {
      logTechnicalError('Update reel', new Error(`No row updated for id ${id} (deleted, or RLS denied)`));
      throw new FriendlyError('This reel could not be updated. Please refresh the page and try again.');
    }
    await load();
    return data;
  };

  /** Deletes the row, then removes its uploaded files if no other reel uses them. */
  const remove = async (id: string) => {
    const target = reels.find(r => r.id === id);
    const { error: deleteError } = await supabase.from('instagram_reels').delete().eq('id', id);
    if (deleteError) throw toFriendly(deleteError, 'Delete reel');
    const remaining = await load();

    if (target) {
      const stillUsed = (url?: string) => Boolean(url) && remaining.some(r => r.video_url === url || r.thumbnail_url === url);
      const cleanup: Array<[string, string | undefined]> = [
        [REEL_VIDEO_BUCKET, target.video_url],
        [REEL_THUMBNAIL_BUCKET, target.thumbnail_url],
      ];
      for (const [bucket, url] of cleanup) {
        const path = getStoragePathFromPublicUrl(bucket, url);
        if (path && !stillUsed(url)) {
          const { error: storageError } = await supabase.storage.from(bucket).remove([path]);
          if (storageError) console.warn(`Could not remove ${bucket}/${path}:`, storageError.message);
        }
      }
    }
  };

  /** Moves a reel one position up or down and renumbers display_order sequentially. */
  const move = async (id: string, direction: -1 | 1) => {
    const ordered = [...reels];
    const index = ordered.findIndex(r => r.id === id);
    const target = index + direction;
    if (index === -1 || target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];

    const changes = ordered
      .map((r, i) => ({ id: r.id, display_order: i + 1, previous: r.display_order }))
      .filter(c => c.display_order !== c.previous);

    // Optimistic reorder so the grid responds immediately.
    setReels(ordered.map((r, i) => ({ ...r, display_order: i + 1 })));

    const results = await Promise.all(
      changes.map(c => supabase.from('instagram_reels').update({ display_order: c.display_order }).eq('id', c.id))
    );
    const failed = results.find(r => r.error);
    await load();
    if (failed?.error) throw toFriendly(failed.error, 'Reorder reels');
  };

  return { reels, loading, error, create, update, remove, move, refetch: load };
}
