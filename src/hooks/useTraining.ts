import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Course = Database['public']['Tables']['training_courses']['Row'];
type CourseInsert = Database['public']['Tables']['training_courses']['Insert'];
type CourseUpdate = Database['public']['Tables']['training_courses']['Update'];

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
    setCourses(data ?? []);
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
    setCourses(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (course: CourseInsert) => {
    const { error } = await supabase.from('training_courses').insert(course);
    if (error) throw error;
    await fetch();
  };

  const update = async (id: string, updates: CourseUpdate) => {
    const { error } = await supabase.from('training_courses').update(updates).eq('id', id);
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
