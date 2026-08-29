import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: string;
  curriculum: string[];
  tools: string[];
  fee: string;
  mode: string;
  image: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useTraining() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('training_courses')
      .select('*')
      .order('sort_order');

    if (error) console.error('Training fetch error:', error);
    setCourses((data as Course[]) ?? []);
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
    const { error } = await supabase.from('training_courses').insert([course] as any);
    if (error) throw error;
    await fetch();
  };

  const update = async (id: string, updates: Partial<Course>) => {
    const { error } = await supabase.from('training_courses').update(updates as any).eq('id', id);
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
