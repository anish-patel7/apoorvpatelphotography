import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface Service {
  id: string;
  title: string;
  category: 'photography' | 'videography' | 'editing';
  description: string;
  icon: string;
  features: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useServices(category?: string) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('services')
      .select('*')
      .order('sort_order');

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) console.error('Services fetch error:', error);
    setServices((data as Service[]) ?? []);
    setLoading(false);
  }, [category]);

  useEffect(() => { fetch(); }, [fetch]);

  return { services, loading, refetch: fetch };
}

export function useServicesAdmin() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('category')
      .order('sort_order');

    if (error) console.error('Services admin fetch error:', error);
    setServices((data as Service[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (service: Partial<Service>) => {
    const { error } = await (supabase.from('services').insert as any)([service]);
    if (error) throw error;
    await fetch();
  };

  const update = async (id: string, updates: Partial<Service>) => {
    const { error } = await (supabase.from('services').update as any)(updates).eq('id', id);
    if (error) throw error;
    await fetch();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;
    await fetch();
  };

  return { services, loading, create, update, remove, refetch: fetch };
}
