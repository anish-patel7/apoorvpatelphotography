import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface Project {
  id: string;
  title: string;
  slug: string;
  category: string;
  cover_image: string;
  images: string[];
  video_url: string | null;
  reel_url: string | null;
  description: string;
  date: string;
  location: string;
  featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function usePortfolio(category?: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('portfolio_projects')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) console.error('Portfolio fetch error:', error);
    setProjects((data as Project[]) ?? []);
    setLoading(false);
  }, [category]);

  useEffect(() => { fetch(); }, [fetch]);

  return { projects, loading, refetch: fetch };
}

export function usePortfolioProject(slug: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('portfolio_projects')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(({ data, error }) => {
        if (error) console.error('Project fetch error:', error);
        setProject(data as Project | null);
        setLoading(false);
      });
  }, [slug]);

  return { project, loading };
}

export function useFeaturedPortfolio() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('portfolio_projects')
      .select('*')
      .eq('featured', true)
      .order('sort_order')
      .limit(6)
      .then(({ data, error }) => {
        if (error) console.error('Featured fetch error:', error);
        setProjects((data as Project[]) ?? []);
        setLoading(false);
      });
  }, []);

  return { projects, loading };
}

export function usePortfolioAdmin() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('portfolio_projects')
      .select('*')
      .order('sort_order')
      .order('created_at', { ascending: false });

    if (error) console.error('Portfolio admin fetch error:', error);
    setProjects((data as Project[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (project: Partial<Project>) => {
    const { error } = await (supabase.from('portfolio_projects').insert as any)([project]);
    if (error) throw error;
    await fetch();
  };

  const update = async (id: string, updates: Partial<Project>) => {
    const { error } = await (supabase
      .from('portfolio_projects')
      .update as any)(updates)
      .eq('id', id);
    if (error) throw error;
    await fetch();
  };

  const remove = async (id: string) => {
    const { error } = await supabase
      .from('portfolio_projects')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await fetch();
  };

  return { projects, loading, create, update, remove, refetch: fetch };
}
