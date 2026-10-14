import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Testimonial } from '../types';

export function mapDatabaseRowToTestimonial(row: any): Testimonial {
  const isApproved = Boolean(row.is_approved ?? row.approved ?? false);
  const clientName = row.client_name || row.name || 'Anonymous Client';
  const reviewText = row.testimonial || row.review || '';
  const displayOrder = Number(row.display_order ?? row.sort_order ?? 0);

  return {
    id: String(row.id),
    client_name: clientName,
    name: clientName,
    client_location: row.client_location || '',
    testimonial: reviewText,
    review: reviewText,
    service: row.service || 'Photography',
    date: row.date || '',
    rating: Number(row.rating || 5),
    image_url: row.image_url || null,
    is_approved: isApproved,
    approved: isApproved,
    is_featured: Boolean(row.is_featured ?? false),
    display_order: displayOrder,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
  };
}

export function formatTestimonialPayload(input: any) {
  const payload: Record<string, any> = {};

  if (input.id !== undefined && input.id !== null) {
    payload.id = String(input.id);
  }

  // Database column: client_name (accepts client_name or name)
  const nameVal = input.client_name ?? input.name;
  if (nameVal !== undefined) {
    payload.client_name = String(nameVal).trim();
  }

  if (input.client_location !== undefined) {
    payload.client_location = String(input.client_location).trim();
  }

  // Database column: testimonial (accepts testimonial or review)
  const textVal = input.testimonial ?? input.review;
  if (textVal !== undefined) {
    payload.testimonial = String(textVal).trim();
  }

  if (input.service !== undefined) {
    payload.service = String(input.service).trim();
  }

  if (input.date !== undefined) {
    payload.date = String(input.date).trim();
  }

  if (input.rating !== undefined) {
    payload.rating = Math.max(1, Math.min(5, Number(input.rating) || 5));
  }

  if (input.image_url !== undefined) {
    payload.image_url = input.image_url;
  }

  // Database column: is_approved (accepts is_approved or approved)
  const approvedVal = input.is_approved ?? input.approved;
  if (approvedVal !== undefined) {
    payload.is_approved = Boolean(approvedVal);
  }

  if (input.is_featured !== undefined) {
    payload.is_featured = Boolean(input.is_featured);
  }

  // Database column: display_order (accepts display_order or sort_order)
  const orderVal = input.display_order ?? input.sort_order;
  if (orderVal !== undefined) {
    payload.display_order = Number(orderVal);
  }

  return payload;
}

export function useTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setTestimonials([]);
      setLoading(false);
      return;
    }

    supabase
      .from('testimonials')
      .select('*')
      .eq('is_approved', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .then(
        ({ data, error: queryError }) => {
          if (queryError) {
            console.error('Error fetching testimonials:', queryError);
            setError(queryError.message);
            setTestimonials([]);
          } else {
            setTestimonials((data || []).map(mapDatabaseRowToTestimonial));
          }
          setLoading(false);
        },
        (err) => {
          console.error('Network error fetching testimonials:', err);
          setError(err?.message || 'Failed to load testimonials');
          setTestimonials([]);
          setLoading(false);
        }
      );
  }, []);

  return { testimonials, loading, error };
}

export function useTestimonialsAdmin() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) console.error('Testimonials admin fetch error:', error);
    setTestimonials(((data || []) as any[]).map(mapDatabaseRowToTestimonial));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (item: Partial<Testimonial>) => {
    const payload = formatTestimonialPayload(item);
    const { data, error } = await (supabase.from('testimonials').insert as any)([payload]).select();
    if (error) throw error;
    await fetch();
    return data;
  };

  const update = async (id: string, updates: Partial<Testimonial>) => {
    const payload = formatTestimonialPayload(updates);
    delete payload.id; // Do not update primary key
    const { data, error } = await (supabase.from('testimonials').update as any)(payload).eq('id', id).select();
    if (error) throw error;
    await fetch();
    return data;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('testimonials').delete().eq('id', id);
    if (error) throw error;
    await fetch();
  };

  return { testimonials, loading, create, update, remove, refetch: fetch };
}
