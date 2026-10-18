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
import type { InstagramReel, ReelMediaType } from '../types';

export function mapDatabaseRowToReel(row: any): InstagramReel {
  const isFeatured = Boolean(row.is_featured ?? row.featured ?? false);
  const displayOrder = Number(row.display_order ?? row.sort_order ?? 0);
  let instagramUrl: string = row.instagram_url || row.url || '';
  let videoUrl: string = row.video_url || '';
  const thumbnail = row.thumbnail_url || row.thumbnail || '';
  const status = (row.status as 'configured' | 'incomplete') || 'configured';

  // Records saved before migration 008 kept uploaded videos in instagram_url.
  if (!videoUrl && instagramUrl && !isValidInstagramUrl(instagramUrl) && isDirectVideoUrl(instagramUrl)) {
    videoUrl = instagramUrl;
    instagramUrl = '';
  }
  if (isTemporaryUrl(videoUrl)) videoUrl = '';
  if (isTemporaryUrl(instagramUrl)) instagramUrl = '';

  const mediaType: ReelMediaType =
    row.media_type === 'video' || row.media_type === 'instagram'
      ? row.media_type
      : videoUrl ? 'video' : 'instagram';

  return {
    id: String(row.id),
    title: row.title || '',
    thumbnail,
    thumbnail_url: thumbnail,
    url: instagramUrl,
    instagram_url: instagramUrl,
    video_url: videoUrl || undefined,
    media_type: mediaType,
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
    throw new Error(`${label} is a temporary browser preview link and cannot be saved. Wait for the upload to finish.`);
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
        throw new Error('Please enter a valid Instagram post or reel URL (e.g. https://www.instagram.com/reel/...).');
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

  if (input.media_type !== undefined) {
    if (input.media_type !== 'instagram' && input.media_type !== 'video') {
      throw new Error(`Unknown media type "${input.media_type}".`);
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

/** Turns Supabase/Postgres errors into messages an admin can act on. */
function describeDbError(error: any): Error {
  const code = error?.code as string | undefined;
  const message = (error?.message as string | undefined) || 'Database request failed.';
  if (code === '23505') {
    return new Error('This Instagram URL has already been added. Edit the existing entry instead.');
  }
  if (code === '42703' || code === 'PGRST204' || /column .* does not exist|could not find the .* column/i.test(message)) {
    return new Error('The database is missing the new reel columns. Run migration 008_reels_video_storage_and_publishing.sql in Supabase.');
  }
  if (code === '42501' || /row-level security/i.test(message)) {
    return new Error('Permission denied. Sign in with an active admin account.');
  }
  if (code === '23514') {
    return new Error('A published entry needs an Instagram URL or an uploaded video, and links must not be temporary previews.');
  }
  return new Error(message);
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
        setError('Instagram highlights are temporarily unavailable.');
        setReels([]);
      } else {
        setError(null);
        setReels(((data || []) as any[]).map(mapDatabaseRowToReel).filter(hasPlayableMedia));
      }
    } catch (err) {
      console.error('Instagram reels network error:', err);
      setError('Instagram highlights are temporarily unavailable.');
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
      console.error('Reels admin fetch error:', queryError);
      setError(describeDbError(queryError).message);
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
    const { data, error: insertError } = await (supabase.from('instagram_reels').insert as any)([payload]).select();
    if (insertError) throw describeDbError(insertError);
    await load();
    return data;
  };

  const update = async (id: string, updates: any) => {
    const payload = formatReelPayload(updates);
    delete payload.id; // Do not update primary key
    if (Object.keys(payload).length === 0) return null;
    const { data, error: updateError } = await (supabase.from('instagram_reels').update as any)(payload).eq('id', id).select();
    if (updateError) throw describeDbError(updateError);
    if (!data || data.length === 0) {
      throw new Error('No reel was updated. It may have been deleted, or you lack admin permission.');
    }
    await load();
    return data;
  };

  /** Deletes the row, then removes its uploaded files if no other reel uses them. */
  const remove = async (id: string) => {
    const target = reels.find(r => r.id === id);
    const { error: deleteError } = await supabase.from('instagram_reels').delete().eq('id', id);
    if (deleteError) throw describeDbError(deleteError);
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
    if (failed?.error) throw describeDbError(failed.error);
  };

  return { reels, loading, error, create, update, remove, move, refetch: load };
}
