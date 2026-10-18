import { createClient } from '@supabase/supabase-js';
export type { Database } from './database.types';

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawAnonKey &&
  rawUrl !== 'https://your-project.supabase.co' &&
  !rawUrl.includes('your-project') &&
  rawAnonKey !== 'your-anon-key-here' &&
  rawAnonKey.length > 20
);

// Fallback client placeholder for offline/static deployment
export const supabase = createClient(
  isSupabaseConfigured ? rawUrl! : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? rawAnonKey! : 'anon-key-placeholder'
);

/** Raw project URL / public anon key, used for direct Storage uploads with progress events. */
export const supabaseUrl = isSupabaseConfigured ? rawUrl! : '';
export const supabaseAnonKey = isSupabaseConfigured ? rawAnonKey! : '';

export function getStorageUrl(bucket: string, path: string): string {
  if (!isSupabaseConfigured || !rawUrl) return path;
  return `${rawUrl}/storage/v1/object/public/${bucket}/${path}`;
}
