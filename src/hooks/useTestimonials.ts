import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { testimonials as defaultTestimonials } from '../data/testimonials';

export interface Testimonial {
  id: string;
  name: string;
  client_name?: string;
  review: string;
  testimonial?: string;
  service: string;
  date: string;
  rating: number;
  approved: boolean;
  is_approved?: boolean;
  sort_order: number;
  created_at: string;
}

const fallbackTestimonials: Testimonial[] = defaultTestimonials.map((t, idx) => ({
  id: t.id,
  name: t.name,
  review: t.review,
  service: t.service,
  date: t.date,
  rating: t.rating,
  approved: true,
  sort_order: idx + 1,
  created_at: new Date().toISOString(),
}));

export function useTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setTestimonials(fallbackTestimonials);
      setLoading(false);
      return;
    }

    supabase
      .from('testimonials')
      .select('*')
      .eq('approved', true)
      .order('sort_order')
      .then(
        ({ data, error }) => {
          if (error || !data || data.length === 0) {
            setTestimonials(fallbackTestimonials);
          } else {
            setTestimonials((data as Testimonial[]) ?? []);
          }
          setLoading(false);
        },
        () => {
          setTestimonials(fallbackTestimonials);
          setLoading(false);
        }
      );
  }, []);

  return { testimonials, loading };
}

export function useTestimonialsAdmin() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('sort_order');

    if (error) console.error('Testimonials admin fetch error:', error);
    setTestimonials((data as Testimonial[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (testimonial: Partial<Testimonial>) => {
    const { error } = await (supabase.from('testimonials').insert as any)([testimonial]);
    if (error) throw error;
    await fetch();
  };

  const update = async (id: string, updates: Partial<Testimonial>) => {
    const { error } = await (supabase.from('testimonials').update as any)(updates).eq('id', id);
    if (error) throw error;
    await fetch();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('testimonials').delete().eq('id', id);
    if (error) throw error;
    await fetch();
  };

  return { testimonials, loading, create, update, remove, refetch: fetch };
}
