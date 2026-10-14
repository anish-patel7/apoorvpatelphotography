import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { instagramReels } from '../data/reels';
import { cleanInstagramUrl } from '../utils/instagram';
import type { InstagramReel } from '../types';

export function mapDatabaseRowToReel(row: any): InstagramReel {
  const isFeatured = Boolean(row.is_featured ?? row.featured ?? false);
  const displayOrder = Number(row.display_order ?? row.sort_order ?? 0);
  const url = row.instagram_url || row.url || '';
  const thumbnail = row.thumbnail_url || row.thumbnail || '';
  const status = (row.status as 'configured' | 'incomplete') || 'configured';
  const isPublished = status === 'configured';

  return {
    id: String(row.id),
    title: row.title || '',
    thumbnail,
    thumbnail_url: thumbnail,
    url,
    instagram_url: url,
    featured: isFeatured,
    is_featured: isFeatured,
    is_published: isPublished,
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

export function formatReelPayload(input: any) {
  const payload: Record<string, any> = {};

  if (input.id !== undefined && input.id !== null) {
    payload.id = String(input.id);
  }
  if (input.title !== undefined) {
    payload.title = String(input.title).trim();
  }

  // Database column: instagram_url (accepts input.instagram_url or input.url)
  const igUrl = input.instagram_url ?? input.url;
  if (igUrl !== undefined) {
    payload.instagram_url = cleanInstagramUrl(String(igUrl).trim());
  }

  // Database column: thumbnail_url (accepts input.thumbnail_url or input.thumbnail)
  const thumbUrl = input.thumbnail_url ?? input.thumbnail;
  if (thumbUrl !== undefined) {
    payload.thumbnail_url = String(thumbUrl).trim();
  }

  // Database column: is_featured (accepts input.is_featured or input.featured)
  const featuredVal = input.is_featured ?? input.featured;
  if (featuredVal !== undefined) {
    payload.is_featured = Boolean(featuredVal);
  }

  // Database column: display_order (accepts input.display_order or input.sort_order)
  const orderVal = input.display_order ?? input.sort_order;
  if (orderVal !== undefined) {
    payload.display_order = Number(orderVal);
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

  // Database column: status ('configured' = published, 'incomplete' = draft)
  if (input.status !== undefined) {
    payload.status = input.status;
  } else if (input.is_published !== undefined) {
    payload.status = input.is_published ? 'configured' : 'incomplete';
  } else {
    payload.status = 'configured'; // Default to published when created
  }

  return payload;
}

const fallbackReels: InstagramReel[] = instagramReels.map((r, idx) => ({
  id: r.id,
  thumbnail: r.thumbnail,
  thumbnail_url: r.thumbnail,
  url: r.url,
  instagram_url: r.url,
  title: r.title,
  featured: r.featured ?? true,
  is_featured: r.featured ?? true,
  is_published: true,
  display_order: idx + 1,
  status: r.status || 'configured',
  content_type: 'reel',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

export function useReels() {
  const [reels, setReels] = useState<InstagramReel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReels = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setReels(fallbackReels);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('instagram_reels')
        .select('*')
        .eq('status', 'configured')
        .order('is_featured', { ascending: false })
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.warn('useReels fetch warning:', error.message);
        setReels(fallbackReels);
      } else if (!data || data.length === 0) {
        setReels(fallbackReels);
      } else {
        setReels(data.map(mapDatabaseRowToReel));
      }
    } catch (err) {
      console.warn('useReels network error:', err);
      setReels(fallbackReels);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReels();
  }, [fetchReels]);

  return { reels, loading, refetch: fetchReels };
}

export function useReelsAdmin() {
  const [reels, setReels] = useState<InstagramReel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('instagram_reels')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) console.error('Reels admin fetch error:', error);
    setReels(((data || []) as any[]).map(mapDatabaseRowToReel));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (reelData: any) => {
    const payload = formatReelPayload(reelData);
    const { data, error } = await (supabase.from('instagram_reels').insert as any)([payload]).select();
    if (error) throw error;
    await fetch();
    return data;
  };

  const update = async (id: string, updates: any) => {
    const payload = formatReelPayload(updates);
    delete payload.id; // Do not update primary key
    const { data, error } = await (supabase.from('instagram_reels').update as any)(payload).eq('id', id).select();
    if (error) throw error;
    await fetch();
    return data;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('instagram_reels').delete().eq('id', id);
    if (error) throw error;
    await fetch();
  };

  return { reels, loading, create, update, remove, refetch: fetch };
}
