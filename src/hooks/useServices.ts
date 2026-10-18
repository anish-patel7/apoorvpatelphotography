import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { services as defaultServices } from '../data/services';
import { FriendlyError, logTechnicalError, toFriendly } from '../lib/adminErrors';

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
  /** Mirrors the database column display_order. */
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Built-in services, used ONLY when Supabase is not configured (local preview).
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

/** The services table orders by display_order (migration 003), not sort_order. */
function mapServiceRow(row: any): Service {
  return {
    id: String(row.id),
    title: row.title || '',
    slug: row.slug || undefined,
    category: row.category === 'graphic_design' ? 'design' : row.category,
    description: row.description || '',
    icon: row.icon || 'Camera',
    features: Array.isArray(row.features) ? row.features : [],
    price_label: row.price_label || undefined,
    is_active: row.is_active ?? true,
    sort_order: Number(row.display_order ?? row.sort_order ?? 0),
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
  };
}

/** Converts admin form data to database columns (never sends columns that don't exist). */
function toServiceRow(s: Partial<Service>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (s.title !== undefined) row.title = s.title;
  if (s.slug !== undefined) row.slug = s.slug;
  if (s.category !== undefined) row.category = s.category;
  if (s.description !== undefined) row.description = s.description;
  if (s.icon !== undefined) row.icon = s.icon;
  if (s.features !== undefined) row.features = s.features;
  if (s.price_label !== undefined) row.price_label = s.price_label || 'Contact for Quote';
  if (s.is_active !== undefined) row.is_active = s.is_active;
  if (s.sort_order !== undefined) row.display_order = s.sort_order;
  return row;
}

export function useServices(category?: string) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!isSupabaseConfigured) {
      await Promise.resolve();
      setServices(category ? fallbackServices.filter(s => s.category === category) : fallbackServices);
      setLoading(false);
      return;
    }

    let query = supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('title', { ascending: true });
    if (category) {
      query = category === 'design' ? query.in('category', ['design', 'graphic_design']) : query.eq('category', category);
    }

    const { data, error: queryError } = await query;
    if (queryError) {
      logTechnicalError('Services fetch', queryError);
      setError('Our services could not be loaded. Please refresh the page or contact us directly.');
      setServices([]);
    } else {
      setError(null);
      setServices((data || []).map(mapServiceRow));
    }
    setLoading(false);
  }, [category]);

  useEffect(() => { void fetch(); }, [fetch]);

  return { services, loading, error, refetch: fetch };
}

export function useServicesAdmin() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!isSupabaseConfigured) {
      await Promise.resolve();
      setServices(fallbackServices);
      setLoading(false);
      return;
    }
    const { data, error: queryError } = await supabase
      .from('services')
      .select('*')
      .order('display_order', { ascending: true })
      .order('title', { ascending: true });

    if (queryError) setError(toFriendly(queryError, 'Load services', 'Your services could not be loaded. Please refresh the page.').message);
    else {
      setError(null);
      setServices((data || []).map(mapServiceRow));
    }
    setLoading(false);
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  const guard = () => {
    if (!isSupabaseConfigured) throw new FriendlyError('Saving is not available in this preview.');
  };

  const create = async (service: Partial<Service>) => {
    guard();
    const { error: e } = await (supabase.from('services').insert as any)([toServiceRow(service)]);
    if (e) throw e.code === '23505' ? new FriendlyError('A service with this name already exists.') : toFriendly(e, 'Create service');
    await fetch();
  };

  const update = async (id: string, updates: Partial<Service>) => {
    guard();
    const { data, error: e } = await (supabase.from('services').update as any)(toServiceRow(updates)).eq('id', id).select('id');
    if (e) throw toFriendly(e, 'Update service');
    if (!data || data.length === 0) throw new FriendlyError('This service could not be updated. Please refresh the page and try again.');
    await fetch();
  };

  const remove = async (id: string) => {
    guard();
    const { error: e } = await supabase.from('services').delete().eq('id', id);
    if (e) throw toFriendly(e, 'Delete service');
    await fetch();
  };

  /** Swap with the neighbour and renumber display_order 1..n. */
  const move = async (id: string, direction: -1 | 1) => {
    guard();
    const ordered = [...services];
    const i = ordered.findIndex(s => s.id === id);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= ordered.length) return;
    [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
    const results = await Promise.all(
      ordered
        .map((s, idx) => ({ s, order: idx + 1 }))
        .filter(({ s, order }) => s.sort_order !== order)
        .map(({ s, order }) => (supabase.from('services').update as any)({ display_order: order }).eq('id', s.id))
    );
    await fetch();
    const failed = results.find((r: any) => r.error);
    if (failed) throw toFriendly((failed as any).error, 'Reorder services');
  };

  return { services, loading, error, create, update, remove, move, refetch: fetch };
}
