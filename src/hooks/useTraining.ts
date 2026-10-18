import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { trainingCourses } from '../data/training';
import { FriendlyError, logTechnicalError, toFriendly } from '../lib/adminErrors';

export interface Course {
  id: string;
  title: string;
  slug?: string;
  description: string;
  duration: string;
  level: string;
  curriculum: string[];
  syllabus?: string[];
  tools: string[];
  /** Database column price_label. */
  fee: string;
  price_label?: string;
  mode: string;
  /** Database column image_url. */
  image: string;
  is_active?: boolean;
  /** Database column display_order. */
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Built-in courses, used ONLY when Supabase is not configured (local preview).
const fallbackCourses: Course[] = trainingCourses.map((c, idx) => ({
  id: c.id,
  title: c.title,
  description: c.description,
  duration: c.duration,
  level: c.level,
  curriculum: c.curriculum,
  tools: c.tools,
  fee: c.fee,
  mode: c.mode,
  image: c.image,
  is_active: true,
  sort_order: idx + 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

/** training_courses uses image_url, price_label and display_order (migration 003). */
function mapCourseRow(row: any): Course {
  const fee = row.price_label || row.fee || 'Contact for details';
  return {
    id: String(row.id),
    title: row.title || '',
    slug: row.slug || undefined,
    description: row.description || '',
    duration: row.duration || '',
    level: row.level || '',
    curriculum: Array.isArray(row.curriculum) ? row.curriculum : [],
    tools: Array.isArray(row.tools) ? row.tools : [],
    fee,
    price_label: fee,
    mode: row.mode || '',
    image: row.image_url || row.image || '',
    is_active: row.is_active ?? true,
    sort_order: Number(row.display_order ?? row.sort_order ?? 0),
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
  };
}

function toCourseRow(c: Partial<Course>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (c.title !== undefined) row.title = c.title;
  if (c.slug !== undefined) row.slug = c.slug;
  if (c.description !== undefined) row.description = c.description;
  if (c.duration !== undefined) row.duration = c.duration;
  if (c.level !== undefined) row.level = c.level;
  if (c.curriculum !== undefined) row.curriculum = c.curriculum;
  if (c.tools !== undefined) row.tools = c.tools;
  if (c.fee !== undefined || c.price_label !== undefined) row.price_label = (c.price_label ?? c.fee) || 'Contact for details';
  if (c.mode !== undefined) row.mode = c.mode;
  if (c.image !== undefined) row.image_url = c.image;
  if (c.is_active !== undefined) row.is_active = c.is_active;
  if (c.sort_order !== undefined) row.display_order = c.sort_order;
  return row;
}

export function useTraining() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!isSupabaseConfigured) {
      await Promise.resolve();
      setCourses(fallbackCourses);
      setLoading(false);
      return;
    }
    const { data, error: queryError } = await supabase
      .from('training_courses')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('title', { ascending: true });

    if (queryError) {
      logTechnicalError('Training fetch', queryError);
      setError('Our courses could not be loaded. Please refresh the page or contact us directly.');
      setCourses([]);
    } else {
      setError(null);
      setCourses((data || []).map(mapCourseRow));
    }
    setLoading(false);
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  return { courses, loading, error, refetch: fetch };
}

export function useTrainingAdmin() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!isSupabaseConfigured) {
      await Promise.resolve();
      setCourses(fallbackCourses);
      setLoading(false);
      return;
    }
    const { data, error: queryError } = await supabase
      .from('training_courses')
      .select('*')
      .order('display_order', { ascending: true })
      .order('title', { ascending: true });

    if (queryError) setError(toFriendly(queryError, 'Load courses', 'Your courses could not be loaded. Please refresh the page.').message);
    else {
      setError(null);
      setCourses((data || []).map(mapCourseRow));
    }
    setLoading(false);
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  const guard = () => {
    if (!isSupabaseConfigured) throw new FriendlyError('Saving is not available in this preview.');
  };

  const create = async (course: Partial<Course>) => {
    guard();
    const { error: e } = await (supabase.from('training_courses').insert as any)([toCourseRow(course)]);
    if (e) throw e.code === '23505' ? new FriendlyError('A course with this name already exists.') : toFriendly(e, 'Create course');
    await fetch();
  };

  const update = async (id: string, updates: Partial<Course>) => {
    guard();
    const { data, error: e } = await (supabase.from('training_courses').update as any)(toCourseRow(updates)).eq('id', id).select('id');
    if (e) throw toFriendly(e, 'Update course');
    if (!data || data.length === 0) throw new FriendlyError('This course could not be updated. Please refresh the page and try again.');
    await fetch();
  };

  const remove = async (id: string) => {
    guard();
    const { error: e } = await supabase.from('training_courses').delete().eq('id', id);
    if (e) throw toFriendly(e, 'Delete course');
    await fetch();
  };

  const move = async (id: string, direction: -1 | 1) => {
    guard();
    const ordered = [...courses];
    const i = ordered.findIndex(c => c.id === id);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= ordered.length) return;
    [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
    const results = await Promise.all(
      ordered
        .map((c, idx) => ({ c, order: idx + 1 }))
        .filter(({ c, order }) => c.sort_order !== order)
        .map(({ c, order }) => (supabase.from('training_courses').update as any)({ display_order: order }).eq('id', c.id))
    );
    await fetch();
    const failed = results.find((r: any) => r.error);
    if (failed) throw toFriendly((failed as any).error, 'Reorder courses');
  };

  return { courses, loading, error, create, update, remove, move, refetch: fetch };
}
