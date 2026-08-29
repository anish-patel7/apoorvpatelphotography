import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Testimonial = Database['public']['Tables']['testimonials']['Row'];
type TestimonialInsert = Database['public']['Tables']['testimonials']['Insert'];
type TestimonialUpdate = Database['public']['Tables']['testimonials']['Update'];

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
        setTestimonials(data ?? []);
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
    setTestimonials(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (testimonial: TestimonialInsert) => {
    const { error } = await supabase.from('testimonials').insert(testimonial);
    if (error) throw error;
    await fetch();
  };

  const update = async (id: string, updates: TestimonialUpdate) => {
    const { error } = await supabase.from('testimonials').update(updates).eq('id', id);
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
