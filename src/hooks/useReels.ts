import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Reel = Database['public']['Tables']['instagram_reels']['Row'];
type ReelInsert = Database['public']['Tables']['instagram_reels']['Insert'];
type ReelUpdate = Database['public']['Tables']['instagram_reels']['Update'];

export function useReels() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('instagram_reels')
      .select('*')
      .eq('featured', true)
      .order('sort_order')
      .limit(6)
      .then(({ data, error }) => {
        if (error) console.error('Reels fetch error:', error);
        setReels(data ?? []);
        setLoading(false);
      });
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
    setReels(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (reel: ReelInsert) => {
    const { error } = await supabase.from('instagram_reels').insert(reel);
    if (error) throw error;
    await fetch();
  };

  const update = async (id: string, updates: ReelUpdate) => {
    const { error } = await supabase.from('instagram_reels').update(updates).eq('id', id);
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
