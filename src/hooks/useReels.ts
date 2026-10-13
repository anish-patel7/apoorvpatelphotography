import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { instagramReels } from '../data/reels';

interface Reel {
  id: string;
  thumbnail: string;
  url: string;
  title: string;
  featured: boolean;
  sort_order: number;
  created_at: string;
}

const fallbackReels: Reel[] = instagramReels.map((r, idx) => ({
  id: r.id,
  thumbnail: r.thumbnail,
  url: r.url,
  title: r.title,
  featured: r.featured,
  sort_order: idx + 1,
  created_at: new Date().toISOString(),
}));

export function useReels() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setReels(fallbackReels);
      setLoading(false);
      return;
    }

    supabase
      .from('instagram_reels')
      .select('*')
      .eq('featured', true)
      .order('sort_order')
      .limit(6)
      .then(
        ({ data, error }) => {
          if (error || !data || data.length === 0) {
            setReels(fallbackReels);
          } else {
            setReels(data as Reel[]);
          }
          setLoading(false);
        },
        () => {
          setReels(fallbackReels);
          setLoading(false);
        }
      );
  }, []);

  return { reels, loading };
}

export function useReelsAdmin() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('instagram_reels')
      .select('*')
      .order('sort_order');

    if (error) console.error('Reels admin fetch error:', error);
    setReels((data as Reel[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (reel: Partial<Reel>) => {
    const { error } = await (supabase.from('instagram_reels').insert as any)([reel]);
    if (error) throw error;
    await fetch();
  };

  const update = async (id: string, updates: Partial<Reel>) => {
    const { error } = await (supabase.from('instagram_reels').update as any)(updates).eq('id', id);
    if (error) throw error;
    await fetch();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('instagram_reels').delete().eq('id', id);
    if (error) throw error;
    await fetch();
  };

  return { reels, loading, create, update, remove, refetch: fetch };
}
