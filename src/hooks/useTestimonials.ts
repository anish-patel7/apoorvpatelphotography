import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface Testimonial {
  id: string;
  name: string;
  review: string;
  service: string;
  date: string;
  rating: number;
  approved: boolean;
  sort_order: number;
  created_at: string;
}

export function useTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('testimonials')
      .select('*')
      .eq('approved', true)
      .order('sort_order')
      .then(({ data, error }) => {
        if (error) console.error('Testimonials fetch error:', error);
        setTestimonials((data as Testimonial[]) ?? []);
        setLoading(false);
      });
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
    const { error } = await supabase.from('testimonials').insert([testimonial] as any);
    if (error) throw error;
    await fetch();
  };

  const update = async (id: string, updates: Partial<Testimonial>) => {
    const { error } = await supabase.from('testimonials').update(updates as any).eq('id', id);
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
