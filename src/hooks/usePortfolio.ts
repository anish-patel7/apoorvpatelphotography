import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { portfolioProjects, portfolioCategories as builtInCategories } from '../data/portfolio';
import {
  FriendlyError,
  SETUP_NEEDED_MESSAGE,
  isMissingSchemaError,
  logTechnicalError,
  toFriendly,
} from '../lib/adminErrors';

/** One photo or video in a project's gallery (stored in portfolio_images). */
export interface PortfolioMediaItem {
  url: string;
  type: 'image' | 'video';
  /** Still frame shown before a video plays. */
  poster?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface Project {
  id: string;
  title: string;
  /** Title shown to visitors (automatic titles are replaced by "<Category> Collection"). */
  display_title: string;
  is_auto_title?: boolean;
  slug: string;
  category: string;
  cover_image: string;
  cover_image_url?: string;
  /** Photo URLs only (kept for existing callers). */
  images: string[];
  /** Photos and videos in gallery order. */
  media: PortfolioMediaItem[];
  /** Instagram post/reel URL fields (legacy names). */
  video_url: string | null;
  reel_url: string | null;
  instagram_url?: string | null;
  /** Optional external work link (YouTube, Vimeo or another website). */
  external_url?: string | null;
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

export interface PortfolioCategory {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

export function getDisplayTitle(p: { title?: string; category?: string; is_auto_title?: boolean }): string {
  if (p.is_auto_title || !p.title?.trim()) return `${p.category || 'Portfolio'} Collection`;
  return p.title;
}

/** Internal title for uploads saved without one, e.g. "Wedding Collection — 18 October 2026". */
export function generateAutoTitle(category: string, date = new Date()): string {
  const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${category} Collection — ${day}`;
}

export function slugify(text: string): string {
  return text.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'portfolio';
}

/** Slug with a short random suffix, so automatic titles never collide. */
export function generateUniqueSlug(title: string): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${slugify(title).slice(0, 60)}-${suffix}`;
}

// Built-in sample projects, used ONLY when Supabase is not configured (local preview).
const fallbackProjects: Project[] = portfolioProjects.map((p, idx) => ({
  id: p.id,
  title: p.title,
  display_title: p.title,
  slug: p.id,
  category: p.category,
  cover_image: p.coverImage,
  cover_image_url: p.coverImage,
  images: p.images,
  media: p.images.map(url => ({ url, type: 'image' as const })),
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

const fallbackCategories: PortfolioCategory[] = builtInCategories
  .filter(c => c !== 'All')
  .map((name, i) => ({ id: name, name, display_order: i + 1, is_active: true }));

function mapDbProject(row: any): Project {
  const cover = row.cover_image_url || row.cover_image || '';
  const isAuto = Boolean(row.is_auto_title);
  return {
    id: row.id,
    title: row.title,
    display_title: getDisplayTitle({ title: row.title, category: row.category, is_auto_title: isAuto }),
    is_auto_title: isAuto,
    slug: row.slug || row.id,
    category: row.category,
    cover_image: cover,
    cover_image_url: cover,
    images: cover ? [cover] : [],
    media: cover ? [{ url: cover, type: 'image' }] : [],
    video_url: row.video_url || null,
    reel_url: row.reel_url || null,
    instagram_url: row.instagram_url || row.video_url || row.reel_url || null,
    external_url: row.external_url || null,
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

/** Loads gallery items from portfolio_images and attaches them to each project (cover first). */
async function attachGalleryImages(rows: any[]): Promise<Project[]> {
  const projects = rows.map(mapDbProject);
  if (projects.length === 0) return projects;

  const ids = projects.map(p => p.id);
  // select('*') works both before and after the media columns of migration 010 exist.
  const mediaRows = await fetchAllPages<any>((from, to) =>
    supabase
      .from('portfolio_images')
      .select('*')
      .in('project_id', ids)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })
      .range(from, to) as any
  );

  const byProject = new Map<string, PortfolioMediaItem[]>();
  for (const row of mediaRows) {
    if (!row.image_url) continue;
    const list = byProject.get(row.project_id) ?? [];
    if (!list.some(m => m.url === row.image_url)) {
      list.push({
        url: row.image_url,
        type: row.media_type === 'video' ? 'video' : 'image',
        poster: row.poster_url || null,
        width: row.width ?? null,
        height: row.height ?? null,
      });
    }
    byProject.set(row.project_id, list);
  }

  return projects.map(p => {
    const gallery = byProject.get(p.id) ?? [];
    const coverInGallery = gallery.some(m => m.url === p.cover_image || m.poster === p.cover_image);
    const media: PortfolioMediaItem[] =
      p.cover_image && !coverInGallery ? [{ url: p.cover_image, type: 'image' }, ...gallery] : gallery;
    return { ...p, media, images: media.filter(m => m.type === 'image').map(m => m.url) };
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
      logTechnicalError('Portfolio fetch', err);
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
        logTechnicalError(`Portfolio project fetch (${slug})`, err);
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
        const withMedia = await attachGalleryImages(data || []);
        if (!cancelled) {
          setProjects(withMedia);
          setError(null);
        }
      } catch (err) {
        logTechnicalError('Featured portfolio fetch', err);
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

/** Best still image for a project card: cover, else first photo, else first video poster. */
export function getProjectCover(p: Pick<Project, 'cover_image' | 'media'>): string {
  if (p.cover_image) return p.cover_image;
  const photo = p.media.find(m => m.type === 'image');
  if (photo) return photo.url;
  return p.media.find(m => m.type === 'video' && m.poster)?.poster || '';
}

// -----------------------------------------------------------------------------
// Categories (managed in Admin → Portfolio → Categories)
// -----------------------------------------------------------------------------

/**
 * Portfolio categories. `managed` is false when the categories table has not been
 * created yet (setup not run); the built-in list is then used read-only.
 */
export function usePortfolioCategories() {
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [managed, setManaged] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      await Promise.resolve();
      setCategories(fallbackCategories);
      setManaged(false);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('portfolio_categories')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });
    if (error) {
      logTechnicalError('Load portfolio categories (using built-in list)', error);
      setCategories(fallbackCategories);
      setManaged(false);
    } else {
      setCategories(((data || []) as any[]).map(r => ({
        id: String(r.id),
        name: r.name,
        display_order: r.display_order ?? 0,
        is_active: r.is_active ?? true,
      })));
      setManaged(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const requireManaged = () => {
    if (!managed) throw new FriendlyError(SETUP_NEEDED_MESSAGE);
  };

  const create = async (name: string) => {
    requireManaged();
    const clean = name.trim().replace(/\s+/g, ' ');
    if (!clean) throw new FriendlyError('Please enter a category name.');
    if (categories.some(c => c.name.toLowerCase() === clean.toLowerCase())) {
      throw new FriendlyError('This category already exists.');
    }
    const nextOrder = categories.reduce((m, c) => Math.max(m, c.display_order), 0) + 1;
    const { error } = await supabase.from('portfolio_categories').insert([{ name: clean, display_order: nextOrder }] as any);
    if (error) throw toFriendly(error, 'Create category');
    await load();
  };

  const rename = async (id: string, name: string) => {
    requireManaged();
    const clean = name.trim().replace(/\s+/g, ' ');
    if (!clean) throw new FriendlyError('Please enter a category name.');
    if (categories.some(c => c.id !== id && c.name.toLowerCase() === clean.toLowerCase())) {
      throw new FriendlyError('Another category already has this name.');
    }
    // Projects follow automatically (ON UPDATE CASCADE).
    const { error } = await (supabase.from('portfolio_categories').update as any)({ name: clean }).eq('id', id);
    if (error) throw toFriendly(error, 'Rename category');
    await load();
  };

  const setActive = async (id: string, isActive: boolean) => {
    requireManaged();
    const { error } = await (supabase.from('portfolio_categories').update as any)({ is_active: isActive }).eq('id', id);
    if (error) throw toFriendly(error, 'Show/hide category');
    await load();
  };

  const move = async (id: string, direction: -1 | 1) => {
    requireManaged();
    const ordered = [...categories];
    const i = ordered.findIndex(c => c.id === id);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= ordered.length) return;
    [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
    const results = await Promise.all(
      ordered
        .map((c, idx) => ({ c, order: idx + 1 }))
        .filter(({ c, order }) => c.display_order !== order)
        .map(({ c, order }) => (supabase.from('portfolio_categories').update as any)({ display_order: order }).eq('id', c.id))
    );
    const failed = results.find((r: any) => r.error);
    await load();
    if (failed) throw toFriendly((failed as any).error, 'Reorder categories');
  };

  const remove = async (id: string) => {
    requireManaged();
    const { error } = await supabase.from('portfolio_categories').delete().eq('id', id);
    if (error) throw toFriendly(error, 'Delete category');
    await load();
  };

  return { categories, managed, loading, create, rename, setActive, move, remove, refetch: load };
}

// -----------------------------------------------------------------------------
// Admin
// -----------------------------------------------------------------------------

const MEDIA_COLUMNS_ERROR = 'Video uploads need a one-time setup by your website developer. Photos can still be uploaded.';

/** Replaces a project's gallery rows in portfolio_images with `media` (in order). */
async function replaceGalleryMedia(projectId: string, media: PortfolioMediaItem[], title: string) {
  const seen = new Set<string>();
  const items = media.filter(m => {
    const url = m.url.trim();
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  });

  const { error: deleteError } = await supabase.from('portfolio_images').delete().eq('project_id', projectId);
  if (deleteError) throw toFriendly(deleteError, 'Update gallery (delete old rows)');
  if (items.length === 0) return;

  const rows = items.map((m, i) => ({
    project_id: projectId,
    image_url: m.url.trim(),
    alt_text: `${title} - ${m.type === 'video' ? 'Video' : 'Photograph'} ${i + 1}`,
    display_order: i + 1,
    media_type: m.type,
    poster_url: m.poster || null,
    width: m.width ?? null,
    height: m.height ?? null,
  }));

  let { error } = await supabase.from('portfolio_images').insert(rows as any);
  if (error && isMissingSchemaError(error)) {
    // Setup 010 not applied yet: photos can be stored in the original columns, videos cannot.
    logTechnicalError('Save gallery (media columns missing; saving photos only)', error);
    if (items.some(m => m.type === 'video')) throw new FriendlyError(MEDIA_COLUMNS_ERROR);
    ({ error } = await supabase.from('portfolio_images').insert(
      rows.map(({ project_id, image_url, alt_text, display_order }) => ({ project_id, image_url, alt_text, display_order })) as any
    ));
  }
  if (error) throw toFriendly(error, 'Save gallery');
}

/** Columns added by migration 010; stripped (with a logged warning) if setup is incomplete. */
const PROJECT_010_COLUMNS = ['external_url', 'is_auto_title'];

function stripProjectColumns(payload: Record<string, unknown>): Record<string, unknown> {
  if (payload.external_url) throw new FriendlyError('Website links need a one-time setup by your website developer. Instagram links and uploads still work.');
  const copy = { ...payload };
  for (const col of PROJECT_010_COLUMNS) delete copy[col];
  return copy;
}

const NOT_CONFIGURED_ERROR = 'Saving is not available in this preview.';

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
      setError(toFriendly(err, 'Load portfolio (admin)', 'Your portfolio could not be loaded. Please refresh the page.').message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  const create = async (projectData: Partial<Project>) => {
    if (!isSupabaseConfigured) throw new FriendlyError(NOT_CONFIGURED_ERROR);

    const dbPayload: Record<string, any> = {
      slug: projectData.slug || generateUniqueSlug(projectData.title || 'portfolio'),
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
    if (projectData.external_url !== undefined) dbPayload.external_url = projectData.external_url || null;
    if (projectData.is_auto_title !== undefined) dbPayload.is_auto_title = projectData.is_auto_title;

    const insert = (body: Record<string, unknown>) =>
      supabase.from('portfolio_projects').insert([body as any]).select().single();

    let { data, error: insertError } = await insert(dbPayload);
    if (insertError && isMissingSchemaError(insertError)) {
      logTechnicalError('Create project (setup 010 not applied; retrying without new columns)', insertError);
      ({ data, error: insertError } = await insert(stripProjectColumns(dbPayload)));
    }
    // Slug already taken: retry once with a fresh unique suffix.
    if (insertError && (insertError as any).code === '23505' && /slug/i.test(insertError.message)) {
      dbPayload.slug = generateUniqueSlug(dbPayload.title);
      ({ data, error: insertError } = await insert(dbPayload));
    }
    if (insertError) throw toFriendly(insertError, 'Create project', 'Your work could not be saved. Please try again.');

    const created = data as any;
    if (created?.id && projectData.media) {
      try {
        await replaceGalleryMedia(created.id, projectData.media, dbPayload.title);
      } catch (err) {
        await fetch();
        throw err;
      }
    }
    await fetch();
    return created ? mapDbProject(created) : null;
  };

  const update = async (id: string, updates: Partial<Project>) => {
    if (!isSupabaseConfigured) throw new FriendlyError(NOT_CONFIGURED_ERROR);

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
      dbUpdates.cover_image_url = updates.cover_image_url ?? updates.cover_image ?? '';
    }
    if (updates.instagram_url !== undefined) dbUpdates.instagram_url = updates.instagram_url;
    if (updates.video_url !== undefined) dbUpdates.video_url = updates.video_url;
    if (updates.reel_url !== undefined) dbUpdates.reel_url = updates.reel_url;
    if (updates.external_url !== undefined) dbUpdates.external_url = updates.external_url || null;
    if (updates.is_auto_title !== undefined) dbUpdates.is_auto_title = updates.is_auto_title;
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
      const write = (body: Record<string, unknown>) =>
        (supabase.from('portfolio_projects').update as any)(body).eq('id', id).select('id');
      let { data, error: updateError } = await write(dbUpdates);
      if (updateError && isMissingSchemaError(updateError)) {
        logTechnicalError('Update project (setup 010 not applied; retrying without new columns)', updateError);
        ({ data, error: updateError } = await write(stripProjectColumns(dbUpdates)));
      }
      if (updateError) throw toFriendly(updateError, 'Update project', 'Your changes could not be saved. Please try again.');
      if (!data || data.length === 0) {
        logTechnicalError('Update project', new Error(`No row updated for id ${id} (deleted, or RLS denied)`));
        throw new FriendlyError('This work could not be updated. Please refresh the page and try again.');
      }
    }
    if (updates.media !== undefined) {
      await replaceGalleryMedia(id, updates.media, updates.title || '');
    }
    await fetch();
  };

  const remove = async (id: string) => {
    if (!isSupabaseConfigured) throw new FriendlyError(NOT_CONFIGURED_ERROR);

    // portfolio_images rows are removed by ON DELETE CASCADE.
    const { error: deleteError } = await supabase
      .from('portfolio_projects')
      .delete()
      .eq('id', id);

    if (deleteError) throw toFriendly(deleteError, 'Delete project', 'This work could not be deleted. Please try again.');
    await fetch();
  };

  /** Moves a project one place earlier/later and renumbers display_order. */
  const move = async (id: string, direction: -1 | 1) => {
    if (!isSupabaseConfigured) throw new FriendlyError(NOT_CONFIGURED_ERROR);
    const ordered = [...projects];
    const i = ordered.findIndex(p => p.id === id);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= ordered.length) return;
    [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
    setProjects(ordered);
    const results = await Promise.all(
      ordered
        .map((p, idx) => ({ p, order: idx + 1 }))
        .filter(({ p, order }) => p.display_order !== order)
        .map(({ p, order }) => (supabase.from('portfolio_projects').update as any)({ display_order: order }).eq('id', p.id))
    );
    const failed = results.find((r: any) => r.error);
    await fetch();
    if (failed) throw toFriendly((failed as any).error, 'Reorder projects');
  };

  return { projects, loading, error, create, update, remove, move, refetch: fetch };
}
