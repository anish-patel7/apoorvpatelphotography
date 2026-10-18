import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

// Supabase/PostgREST returns at most 1000 rows per request by default, so page through results.
const PAGE_SIZE = 1000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function fetchAllPages<T>(buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await buildQuery(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

/** Loads gallery photos from portfolio_images and attaches them to each project (cover first). */
async function attachGalleryImages(rows: any[]): Promise<Project[]> {
  const projects = rows.map(mapDbProject);
  if (projects.length === 0) return projects;

  const ids = projects.map(p => p.id);
  const imageRows = await fetchAllPages<{ project_id: string; image_url: string }>((from, to) =>
    supabase
      .from('portfolio_images')
      .select('project_id, image_url, display_order')
      .in('project_id', ids)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })
      .range(from, to) as any
  );

  const byProject = new Map<string, string[]>();
  for (const row of imageRows) {
    if (!row.image_url) continue;
    const list = byProject.get(row.project_id) ?? [];
    if (!list.includes(row.image_url)) list.push(row.image_url);
    byProject.set(row.project_id, list);
  }

  return projects.map(p => {
    const gallery = byProject.get(p.id) ?? [];
    const images = p.cover_image && !gallery.includes(p.cover_image) ? [p.cover_image, ...gallery] : gallery;
    return { ...p, images: images.length > 0 ? images : [p.cover_image].filter(Boolean) };
  });
}

/** Single source for public portfolio data: every published project with its gallery. */
async function fetchPublishedProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured) return fallbackProjects;
  const rows = await fetchAllPages<any>((from, to) =>
    supabase
      .from('portfolio_projects')
      .select('*')
      .eq('is_published', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(from, to) as any
  );
  return attachGalleryImages(rows);
}

export function filterProjectsByCategory(projects: Project[], category?: string): Project[] {
  if (!category || category === 'All') return projects;
  const wanted = category.trim().toLowerCase();
  return projects.filter(p => (p.category || '').trim().toLowerCase() === wanted);
}

function describeError(err: any): string {
  return err?.message || String(err) || 'Unknown error';
}

/**
 * Public portfolio hook. Fetches ALL published projects once; category views are
 * derived from that same list, so "All" always contains every category's items.
 * Refreshes when the visitor returns to the tab.
 */
export function usePortfolio(category?: string) {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const data = await fetchPublishedProjects();
      if (id !== requestId.current) return; // a newer request superseded this one
      setAllProjects(data);
      setError(null);
    } catch (err) {
      if (id !== requestId.current) return;
      console.error('Portfolio fetch error:', describeError(err));
      setError('The portfolio could not be loaded. Please refresh the page or try again shortly.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);

  const projects = useMemo(() => filterProjectsByCategory(allProjects, category), [allProjects, category]);

  return { projects, allProjects, loading, error, refetch: load };
}

export function usePortfolioProject(slug: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!isSupabaseConfigured) {
        await Promise.resolve();
        if (!cancelled) {
          setProject(fallbackProjects.find(p => p.slug === slug || p.id === slug) ?? null);
          setLoading(false);
        }
        return;
      }

      try {
        // Links use either the uuid id or the slug; only query the id column with a valid uuid.
        const base = supabase.from('portfolio_projects').select('*');
        const { data, error } = await (UUID_RE.test(slug) ? base.eq('id', slug) : base.eq('slug', slug)).maybeSingle();
        if (error) throw error;
        const mapped = data ? (await attachGalleryImages([data]))[0] : null;
        if (!cancelled) setProject(mapped);
      } catch (err) {
        console.error(`Portfolio project fetch error (${slug}):`, describeError(err));
        if (!cancelled) setProject(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [slug]);

  return { project, loading };
}

export function useFeaturedPortfolio() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!isSupabaseConfigured) {
          await Promise.resolve();
          if (!cancelled) setProjects(fallbackProjects.filter(p => p.featured));
          return;
        }
        const { data, error: queryError } = await supabase
          .from('portfolio_projects')
          .select('*')
          .eq('is_published', true)
          .eq('is_featured', true)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false })
          .limit(6);
        if (queryError) throw queryError;
        if (!cancelled) {
          setProjects((data || []).map(mapDbProject));
          setError(null);
        }
      } catch (err) {
        console.error('Featured portfolio fetch error:', describeError(err));
        if (!cancelled) {
          setProjects([]);
          setError('Featured work could not be loaded.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return { projects, loading, error };
}

/** Replaces a project's gallery rows in portfolio_images with `images` (in order). */
async function replaceGalleryImages(projectId: string, images: string[], title: string) {
  const unique = Array.from(new Set(images.map(u => u.trim()).filter(Boolean)));
  const { error: deleteError } = await supabase.from('portfolio_images').delete().eq('project_id', projectId);
  if (deleteError) throw deleteError;
  if (unique.length === 0) return;
  const rows = unique.map((image_url, i) => ({
    project_id: projectId,
    image_url,
    alt_text: `${title} - Photograph ${i + 1}`,
    display_order: i + 1,
  }));
  const { error: insertError } = await supabase.from('portfolio_images').insert(rows as any);
  if (insertError) throw insertError;
}

const NOT_CONFIGURED_ERROR = 'Supabase is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY), so portfolio changes cannot be saved.';

export function usePortfolioAdmin() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!isSupabaseConfigured) {
      await Promise.resolve();
      setProjects(fallbackProjects);
      setLoading(false);
      return;
    }

    try {
      const rows = await fetchAllPages<any>((from, to) =>
        supabase
          .from('portfolio_projects')
          .select('*')
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false })
          .range(from, to) as any
      );
      setProjects(await attachGalleryImages(rows));
      setError(null);
    } catch (err) {
      console.error('Portfolio admin fetch error:', describeError(err));
      setError(`Could not load portfolio projects: ${describeError(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  const create = async (projectData: Partial<Project>) => {
    if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED_ERROR);

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

    let { data, error: insertError } = await supabase
      .from('portfolio_projects')
      .insert([dbPayload as any])
      .select()
      .single();

    // Slug already taken (e.g. two projects with the same title): retry once with a unique suffix.
    if (insertError && (insertError as any).code === '23505' && /slug/i.test(insertError.message)) {
      dbPayload.slug = `${dbPayload.slug}-${Date.now().toString(36)}`;
      ({ data, error: insertError } = await supabase.from('portfolio_projects').insert([dbPayload as any]).select().single());
    }
    if (insertError) throw insertError;

    const created = data as any;
    if (created?.id && projectData.images) {
      await replaceGalleryImages(created.id, projectData.images, dbPayload.title);
    }
    await fetch();
    return created ? mapDbProject(created) : null;
  };

  const update = async (id: string, updates: Partial<Project>) => {
    if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED_ERROR);

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

    if (Object.keys(dbUpdates).length > 0) {
      const { data, error: updateError } = await (supabase
        .from('portfolio_projects')
        .update as any)(dbUpdates)
        .eq('id', id)
        .select('id');

      if (updateError) throw updateError;
      if (!data || data.length === 0) {
        throw new Error('No project was updated. It may have been deleted, or your account lacks admin permission.');
      }
    }
    if (updates.images !== undefined) {
      await replaceGalleryImages(id, updates.images, updates.title || '');
    }
    await fetch();
  };

  const remove = async (id: string) => {
    if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED_ERROR);

    // portfolio_images rows are removed by ON DELETE CASCADE.
    const { error: deleteError } = await supabase
      .from('portfolio_projects')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;
    await fetch();
  };

  return { projects, loading, error, create, update, remove, refetch: fetch };
}
