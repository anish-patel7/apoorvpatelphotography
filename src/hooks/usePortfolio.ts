import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { portfolioProjects } from '../data/portfolio';

export interface Project {
  id: string;
  title: string;
  slug: string;
  category: string;
  cover_image: string;
  cover_image_url?: string;
  images: string[];
  video_url: string | null;
  reel_url: string | null;
  instagram_url?: string | null;
  content_type?: string | null;
  description: string;
  date: string;
  event_date?: string;
  location: string;
  featured: boolean;
  is_featured?: boolean;
  is_real_work?: boolean;
  is_published?: boolean;
  display_order?: number;
  sort_order: number;
  video_width?: number;
  video_height?: number;
  aspect_ratio?: number;
  orientation?: 'portrait' | 'landscape' | 'square';
  created_at: string;
  updated_at: string;
}

// Authentic fallback projects for offline/unconfigured environments
const fallbackProjects: Project[] = portfolioProjects.map((p, idx) => ({
  id: p.id,
  title: p.title,
  slug: p.id,
  category: p.category,
  cover_image: p.coverImage,
  cover_image_url: p.coverImage,
  images: p.images,
  video_url: p.videoUrl ?? null,
  reel_url: p.reelUrl ?? null,
  instagram_url: p.instagramUrl ?? p.videoUrl ?? p.reelUrl ?? null,
  content_type: p.contentType ?? (p.reelUrl ? 'reel' : p.instagramUrl ? 'post' : 'photo'),
  description: p.description,
  date: p.date,
  event_date: p.date,
  location: p.location,
  featured: p.featured,
  is_featured: p.featured,
  is_real_work: !!p.isRealWork,
  is_published: true,
  display_order: idx + 1,
  sort_order: idx + 1,
  orientation: p.reelUrl ? 'portrait' : 'landscape',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

function mapDbProject(row: any): Project {
  const cover = row.cover_image_url || row.cover_image || '';
  return {
    id: row.id,
    title: row.title,
    slug: row.slug || row.id,
    category: row.category,
    cover_image: cover,
    cover_image_url: cover,
    images: Array.isArray(row.images) ? row.images : [cover],
    video_url: row.video_url || null,
    reel_url: row.reel_url || null,
    instagram_url: row.instagram_url || row.video_url || row.reel_url || null,
    content_type: row.content_type || 'post',
    description: row.description || '',
    date: row.event_date || row.date || '',
    event_date: row.event_date || row.date || '',
    location: row.location || '',
    featured: Boolean(row.is_featured ?? row.featured),
    is_featured: Boolean(row.is_featured ?? row.featured),
    is_real_work: Boolean(row.is_real_work ?? true),
    is_published: Boolean(row.is_published ?? true),
    display_order: row.display_order ?? row.sort_order ?? 0,
    sort_order: row.display_order ?? row.sort_order ?? 0,
    video_width: row.video_width ? Number(row.video_width) : undefined,
    video_height: row.video_height ? Number(row.video_height) : undefined,
    aspect_ratio: row.aspect_ratio ? Number(row.aspect_ratio) : undefined,
    orientation: row.orientation || undefined,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
  };
}

export function usePortfolio(category?: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    if (!isSupabaseConfigured) {
      let filtered = fallbackProjects;
      if (category && category !== 'All') {
        filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
      }
      setProjects(filtered);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('portfolio_projects')
        .select('*')
        .eq('is_published', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (category && category !== 'All') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Portfolio query notice:', error.message);
        setProjects(fallbackProjects.filter(p => !category || category === 'All' || p.category.toLowerCase() === category.toLowerCase()));
      } else {
        setProjects((data || []).map(mapDbProject));
      }
    } catch {
      setProjects(fallbackProjects);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { fetch(); }, [fetch]);

  return { projects, loading, refetch: fetch };
}

export function usePortfolioProject(slug: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const match = fallbackProjects.find(p => p.slug === slug || p.id === slug) ?? null;
      setProject(match);
      setLoading(false);
      return;
    }

    supabase
      .from('portfolio_projects')
      .select('*')
      .or(`slug.eq.${slug},id.eq.${slug}`)
      .single()
      .then(
        ({ data, error }) => {
          if (error || !data) {
            const match = fallbackProjects.find(p => p.slug === slug || p.id === slug) ?? null;
            setProject(match);
          } else {
            setProject(mapDbProject(data));
          }
          setLoading(false);
        },
        () => {
          const match = fallbackProjects.find(p => p.slug === slug || p.id === slug) ?? null;
          setProject(match);
          setLoading(false);
        }
      );
  }, [slug]);

  return { project, loading };
}

export function useFeaturedPortfolio() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setProjects(fallbackProjects.filter(p => p.featured));
      setLoading(false);
      return;
    }

    supabase
      .from('portfolio_projects')
      .select('*')
      .eq('is_published', true)
      .eq('is_featured', true)
      .order('display_order', { ascending: true })
      .limit(6)
      .then(
        ({ data, error }) => {
          if (error || !data || data.length === 0) {
            setProjects(fallbackProjects.filter(p => p.featured));
          } else {
            setProjects(data.map(mapDbProject));
          }
          setLoading(false);
        },
        () => {
          setProjects(fallbackProjects.filter(p => p.featured));
          setLoading(false);
        }
      );
  }, []);

  return { projects, loading };
}

export function usePortfolioAdmin() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    if (!isSupabaseConfigured) {
      setProjects(fallbackProjects);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('portfolio_projects')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Portfolio admin fetch error:', error.message);
      setProjects(fallbackProjects);
    } else {
      setProjects((data || []).map(mapDbProject));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (projectData: Partial<Project>) => {
    if (!isSupabaseConfigured) {
      const newProj = {
        ...projectData,
        id: `proj-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Project;
      setProjects(prev => [newProj, ...prev]);
      return newProj;
    }

    const dbPayload = {
      slug: projectData.slug || `project-${Date.now()}`,
      title: projectData.title || 'Untitled Project',
      category: projectData.category || 'Wedding',
      description: projectData.description || '',
      location: projectData.location || '',
      event_date: projectData.date || projectData.event_date || '',
      cover_image_url: projectData.cover_image || projectData.cover_image_url || '',
      instagram_url: projectData.instagram_url || null,
      video_url: projectData.video_url || null,
      reel_url: projectData.reel_url || null,
      content_type: projectData.content_type || 'post',
      is_real_work: projectData.is_real_work ?? true,
      is_featured: projectData.is_featured ?? projectData.featured ?? false,
      is_published: projectData.is_published ?? true,
      display_order: projectData.display_order ?? 0,
      video_width: projectData.video_width ? Number(projectData.video_width) : null,
      video_height: projectData.video_height ? Number(projectData.video_height) : null,
      aspect_ratio: projectData.aspect_ratio ? Number(projectData.aspect_ratio) : null,
      orientation: projectData.orientation || null,
    };

    const { data, error } = await supabase
      .from('portfolio_projects')
      .insert([dbPayload as any])
      .select()
      .single();

    if (error) throw error;
    await fetch();
    return data ? mapDbProject(data) : null;
  };

  const update = async (id: string, updates: Partial<Project>) => {
    if (!isSupabaseConfigured) {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      return;
    }

    const dbUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.slug !== undefined) dbUpdates.slug = updates.slug;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.date !== undefined || updates.event_date !== undefined) {
      dbUpdates.event_date = updates.event_date || updates.date;
    }
    if (updates.cover_image !== undefined || updates.cover_image_url !== undefined) {
      dbUpdates.cover_image_url = updates.cover_image_url || updates.cover_image;
    }
    if (updates.instagram_url !== undefined) dbUpdates.instagram_url = updates.instagram_url;
    if (updates.video_url !== undefined) dbUpdates.video_url = updates.video_url;
    if (updates.reel_url !== undefined) dbUpdates.reel_url = updates.reel_url;
    if (updates.content_type !== undefined) dbUpdates.content_type = updates.content_type;
    if (updates.is_real_work !== undefined) dbUpdates.is_real_work = updates.is_real_work;
    if (updates.featured !== undefined || updates.is_featured !== undefined) {
      dbUpdates.is_featured = updates.is_featured ?? updates.featured;
    }
    if (updates.is_published !== undefined) dbUpdates.is_published = updates.is_published;
    if (updates.display_order !== undefined || updates.sort_order !== undefined) {
      dbUpdates.display_order = updates.display_order ?? updates.sort_order;
    }
    if (updates.video_width !== undefined) dbUpdates.video_width = updates.video_width ? Number(updates.video_width) : null;
    if (updates.video_height !== undefined) dbUpdates.video_height = updates.video_height ? Number(updates.video_height) : null;
    if (updates.aspect_ratio !== undefined) dbUpdates.aspect_ratio = updates.aspect_ratio ? Number(updates.aspect_ratio) : null;
    if (updates.orientation !== undefined) dbUpdates.orientation = updates.orientation || null;

    const { error } = await (supabase
      .from('portfolio_projects')
      .update as any)(dbUpdates)
      .eq('id', id);

    if (error) throw error;
    await fetch();
  };

  const remove = async (id: string) => {
    if (!isSupabaseConfigured) {
      setProjects(prev => prev.filter(p => p.id !== id));
      return;
    }

    const { error } = await supabase
      .from('portfolio_projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await fetch();
  };

  return { projects, loading, create, update, remove, refetch: fetch };
}
