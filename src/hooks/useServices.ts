import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { services as defaultServices } from '../data/services';
export interface Service {
  id: string;
  title: string;
  slug?: string;
  category: 'photography' | 'videography' | 'editing' | 'multimedia' | 'design';
  description: string;
  icon: string;
  features: string[];
  price_label?: string;
  is_active?: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const fallbackServices: Service[] = defaultServices.map((s, idx) => ({
  id: s.id,
  title: s.title,
  category: s.category,
  description: s.description,
  icon: s.icon,
  features: s.features,
  is_active: true,
  sort_order: idx + 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

export function useServices(category?: string) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    if (!isSupabaseConfigured) {
      let filtered = fallbackServices.filter(s => s.is_active !== false);
      if (category) {
        filtered = filtered.filter(s => s.category.toLowerCase() === category.toLowerCase());
      }
      setServices(filtered);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        let filtered = fallbackServices;
        if (category) {
          filtered = filtered.filter(s => s.category.toLowerCase() === category.toLowerCase());
        }
        setServices(filtered);
      } else {
        setServices((data as Service[]) ?? []);
      }
    } catch {
      let filtered = fallbackServices;
      if (category) {
        filtered = filtered.filter(s => s.category.toLowerCase() === category.toLowerCase());
      }
      setServices(filtered);
    }
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
