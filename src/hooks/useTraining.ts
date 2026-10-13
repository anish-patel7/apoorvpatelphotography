import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { trainingCourses } from '../data/training';

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
  fee: string;
  price_label?: string;
  mode: string;
  image: string;
  is_active?: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

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
  sort_order: idx + 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

export function useTraining() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    if (!isSupabaseConfigured) {
      setCourses(fallbackCourses);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('training_courses')
        .select('*')
        .order('sort_order');

      if (error || !data || data.length === 0) {
        setCourses(fallbackCourses);
      } else {
        setCourses((data as Course[]) ?? []);
      }
    } catch {
      setCourses(fallbackCourses);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { courses, loading, refetch: fetch };
}

export function useTrainingAdmin() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('training_courses')
      .select('*')
      .order('sort_order');

    if (error) console.error('Training admin fetch error:', error);
    setCourses((data as Course[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (course: Partial<Course>) => {
    const { error } = await (supabase.from('training_courses').insert as any)([course]);
    if (error) throw error;
    await fetch();
  };

  const update = async (id: string, updates: Partial<Course>) => {
    const { error } = await (supabase.from('training_courses').update as any)(updates).eq('id', id);
    if (error) throw error;
    await fetch();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('training_courses').delete().eq('id', id);
    if (error) throw error;
    await fetch();
  };

  return { courses, loading, create, update, remove, refetch: fetch };
}
