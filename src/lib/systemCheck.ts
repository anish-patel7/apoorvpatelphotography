/**
 * Developer diagnostics: verifies that the database columns and storage buckets the
 * admin dashboard relies on exist. Used by /admin/system (developer only) and, as a
 * single plain-language notice, on the dashboard.
 */
import { supabase, isSupabaseConfigured } from './supabase';
import { isMissingBucketError, isMissingSchemaError, logTechnicalError } from './adminErrors';

export interface CheckResult {
  id: string;
  label: string;
  ok: boolean;
  /** Technical detail for the developer. */
  detail: string;
}

export const SETUP_SQL_PATH = 'supabase/setup/run_once_admin_setup.sql';

async function checkColumns(id: string, label: string, table: string, columns: string): Promise<CheckResult> {
  const { error } = await supabase.from(table).select(columns).limit(1);
  if (!error) return { id, label, ok: true, detail: `${table}(${columns}) available` };
  if (isMissingSchemaError(error)) return { id, label, ok: false, detail: `${table}: ${error.message}` };
  // Any other error (e.g. permissions) is not a setup gap but is still worth showing.
  return { id, label, ok: false, detail: `${table}: ${error.code ?? ''} ${error.message}` };
}

async function checkBucket(id: string, label: string, bucket: string): Promise<CheckResult> {
  const { error } = await supabase.storage.from(bucket).list('', { limit: 1 });
  if (!error) return { id, label, ok: true, detail: `bucket "${bucket}" reachable` };
  return {
    id,
    label,
    ok: false,
    detail: isMissingBucketError(error) ? `bucket "${bucket}" does not exist` : `bucket "${bucket}": ${error.message}`,
  };
}

export async function runSystemCheck(): Promise<CheckResult[]> {
  if (!isSupabaseConfigured) {
    return [{ id: 'config', label: 'Website connected to the content service', ok: false, detail: 'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set for this build.' }];
  }
  const results = await Promise.all([
    checkColumns('reels', 'Reels: uploaded videos & publishing (setup 008)', 'instagram_reels', 'id, video_url, media_type, status, is_featured'),
    checkBucket('reel-videos', 'Reels: video storage', 'reel-videos'),
    checkBucket('reel-thumbnails', 'Reels: thumbnail storage', 'reel-thumbnails'),
    checkColumns('portfolio-images', 'Portfolio: gallery photos (setup 009)', 'portfolio_images', 'id, project_id, image_url, display_order'),
    checkColumns('portfolio-categories', 'Portfolio: admin-managed categories (setup 010)', 'portfolio_categories', 'id, name, display_order, is_active'),
    checkColumns('portfolio-media', 'Portfolio: video items in galleries (setup 010)', 'portfolio_images', 'media_type, poster_url, width, height'),
    checkColumns('portfolio-links', 'Portfolio: work links & automatic titles (setup 010)', 'portfolio_projects', 'external_url, is_auto_title'),
    checkBucket('portfolio-photo-storage', 'Portfolio: photo storage', 'portfolio-images'),
    checkBucket('portfolio-video-storage', 'Portfolio: video storage', 'portfolio-videos'),
  ]);
  results.filter(r => !r.ok).forEach(r => logTechnicalError(`System check: ${r.label}`, new Error(r.detail)));
  return results;
}
