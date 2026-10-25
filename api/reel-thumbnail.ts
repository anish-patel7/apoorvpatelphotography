import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/reel-thumbnail  { ids: string[], broken?: string[] }   (Vercel Serverless Function)
 * `broken` lists ids whose stored thumbnail no longer loads (checked by the dashboard);
 * those are treated as missing.
 *
 * For each Instagram reel in `ids` that has no hand-picked thumbnail, looks up the
 * reel's ORIGINAL cover through official Meta APIs only, copies the image into the
 * `reel-thumbnails` bucket (Instagram's CDN links expire) and saves its public URL.
 *
 * Sources, in order (each optional, both server-side only):
 *   1. Instagram API with Instagram Login — the studio account's own media
 *      (GET graph.instagram.com/me/media, field thumbnail_url). Needs INSTAGRAM_ACCESS_TOKEN
 *      (long-lived token, permission instagram_business_basic). Only covers reels posted by
 *      that account.
 *   2. Meta oEmbed Read — GET graph.facebook.com/instagram_oembed. Needs META_APP_ID and
 *      META_CLIENT_TOKEN (app with the oEmbed Read feature). Meta may omit thumbnail_url,
 *      in which case nothing is returned.
 * Instagram pages are never scraped. When no source returns a cover, the reel is reported
 * as "unavailable" and the dashboard applies the branded fallback poster.
 *
 * Security: the caller must be an active admin (Supabase access token in Authorization).
 * Storage/database writes use that admin's own token, so Row Level Security still applies
 * and no service-role key is needed. Only image URLs returned by Meta, on Meta CDN hosts,
 * are downloaded (no user-supplied URLs are fetched), with timeouts, a size cap and
 * content checks. Files go to a fixed path per reel, so repeated runs never duplicate.
 */

const GRAPH_INSTAGRAM = 'https://graph.instagram.com/v21.0';
const GRAPH_FACEBOOK = 'https://graph.facebook.com/v21.0';
const BUCKET = 'reel-thumbnails';
const MAX_IDS = 25;
const MAX_MEDIA_PAGES = 4; // 4 × 50 most recent posts
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const TIMEOUT_MS = 8000;
const IMAGE_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const META_CDN_HOST = /(^|\.)(cdninstagram\.com|fbcdn\.net)$/i;
const SHORTCODE_REGEX = /instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(?:share\/)?(?:reel|reels|p|tv)\/([A-Za-z0-9_-]{5,64})/i;

export type ThumbnailResult =
  | { id: string; status: 'instagram'; thumbnail_url: string; source: 'account' | 'oembed' }
  | { id: string; status: 'unavailable'; reason: 'not_configured' | 'not_found' | 'api_error' | 'token_expired' | 'download_failed' }
  | { id: string; status: 'skipped'; reason: 'manual_thumbnail' | 'has_original' | 'not_instagram' | 'not_found' }
  | { id: string; status: 'error'; reason: 'storage_failed' | 'database_failed' | 'changed_meanwhile' };

export function shortcodeOf(url: string | null | undefined): string | null {
  const m = String(url || '').match(SHORTCODE_REGEX);
  return m ? m[1] : null;
}

/** manual = uploaded/pasted by the admin; instagram = retrieved original; generated = branded fallback. */
export function thumbnailKind(url: string | null | undefined): 'missing' | 'manual' | 'instagram' | 'generated' {
  const u = String(url || '').trim();
  if (!u || /^(blob|data):/i.test(u)) return 'missing';
  if (u.includes(`/${BUCKET}/instagram/`)) return 'instagram';
  if (u.includes(`/${BUCKET}/generated/`)) return 'generated';
  return 'manual';
}

function bearer(req: any): string | null {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, retries = 1): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      if (res.status >= 500 && attempt < retries) continue;
      return res;
    } catch (err) {
      if (attempt >= retries) throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}

function isMetaCdnUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' && META_CDN_HOST.test(u.hostname);
  } catch {
    return false;
  }
}

/** Downloads a Meta CDN image with type, size and signature checks. */
async function downloadCover(url: string): Promise<{ bytes: Uint8Array; type: string } | null> {
  if (!isMetaCdnUrl(url)) return null;
  const res = await fetchWithTimeout(url, { redirect: 'follow' });
  if (!res.ok || !isMetaCdnUrl(res.url || url)) return null;
  const type = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!IMAGE_TYPES[type]) return null;
  const declared = Number(res.headers.get('content-length') || 0);
  if (declared > MAX_IMAGE_BYTES) return null;
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) return null;
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
  const png = bytes[0] === 0x89 && bytes[1] === 0x50;
  const webp = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  if (!(jpeg || png || webp)) return null;
  return { bytes, type };
}

type AccountLookup = { covers: Map<string, string>; error: null | 'api_error' | 'token_expired' };

/** Maps shortcode → cover URL for the studio account's recent posts. */
async function loadAccountCovers(token: string): Promise<AccountLookup> {
  const covers = new Map<string, string>();
  let next: string | null = `${GRAPH_INSTAGRAM}/me/media?fields=id,shortcode,permalink,media_type,thumbnail_url,media_url&limit=50&access_token=${encodeURIComponent(token)}`;
  for (let page = 0; next && page < MAX_MEDIA_PAGES; page++) {
    const res = await fetchWithTimeout(next);
    const body: any = await res.json().catch(() => null);
    if (!res.ok || !Array.isArray(body?.data)) {
      return { covers, error: body?.error?.code === 190 ? 'token_expired' : 'api_error' };
    }
    for (const m of body.data) {
      const code = m?.shortcode || shortcodeOf(m?.permalink);
      // Videos/reels expose their cover as thumbnail_url; media_url of a video is the MP4.
      const cover = m?.thumbnail_url || (m?.media_type !== 'VIDEO' ? m?.media_url : null);
      if (code && cover) covers.set(String(code), String(cover));
    }
    next = typeof body?.paging?.next === 'string' && body.paging.next.startsWith(GRAPH_INSTAGRAM) ? body.paging.next : null;
  }
  return { covers, error: null };
}

async function oembedCover(canonicalUrl: string, appId: string, clientToken: string): Promise<string | null> {
  const url = `${GRAPH_FACEBOOK}/instagram_oembed?url=${encodeURIComponent(canonicalUrl)}&fields=thumbnail_url&access_token=${encodeURIComponent(`${appId}|${clientToken}`)}`;
  try {
    const res = await fetchWithTimeout(url);
    const body: any = await res.json().catch(() => null);
    return res.ok && typeof body?.thumbnail_url === 'string' ? body.thumbnail_url : null;
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return res.status(501).json({ success: false, configured: false, error: 'Supabase is not configured on the server.' });
  }

  // ---- Authorisation: an active admin, acting with their own token ----------
  const token = bearer(req);
  if (!token) return res.status(401).json({ success: false, error: 'Missing authorization.' });
  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return res.status(401).json({ success: false, error: 'Your session has expired. Please sign in again.' });
  }
  const { data: profile } = await supabase.from('admin_profiles').select('id, role, is_active').eq('id', userData.user.id).maybeSingle();
  if (!profile || !(profile as any).is_active || !['admin', 'super_admin'].includes((profile as any).role)) {
    return res.status(403).json({ success: false, error: 'Admin access required.' });
  }

  // ---- Input -----------------------------------------------------------------
  let body: any = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  const ids: string[] = Array.isArray(body?.ids)
    ? [...new Set(body.ids.filter((v: unknown) => typeof v === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(v)))] as string[]
    : [];
  const broken = new Set(Array.isArray(body?.broken) ? body.broken.filter((v: unknown) => typeof v === 'string' && ids.includes(v as string)) : []);
  if (ids.length === 0 || ids.length > MAX_IDS) {
    return res.status(400).json({ success: false, error: `Send between 1 and ${MAX_IDS} reel ids.` });
  }

  const { data: rows, error: rowsError } = await supabase
    .from('instagram_reels')
    .select('id, instagram_url, thumbnail_url')
    .in('id', ids);
  if (rowsError) return res.status(500).json({ success: false, error: 'Reels could not be loaded.' });
  const byId = new Map((rows || []).map((r: any) => [String(r.id), r]));

  const igToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const appId = process.env.META_APP_ID;
  const clientToken = process.env.META_CLIENT_TOKEN;
  const configured = Boolean(igToken || (appId && clientToken));

  let account: AccountLookup | null = null;
  const results: ThumbnailResult[] = [];

  for (const id of ids) {
    const row: any = byId.get(id);
    if (!row) { results.push({ id, status: 'skipped', reason: 'not_found' }); continue; }
    const code = shortcodeOf(row.instagram_url);
    if (!code) { results.push({ id, status: 'skipped', reason: 'not_instagram' }); continue; }
    const kind = broken.has(id) ? 'missing' : thumbnailKind(row.thumbnail_url);
    if (kind === 'manual') { results.push({ id, status: 'skipped', reason: 'manual_thumbnail' }); continue; }
    if (kind === 'instagram') { results.push({ id, status: 'skipped', reason: 'has_original' }); continue; }
    if (!configured) { results.push({ id, status: 'unavailable', reason: 'not_configured' }); continue; }

    // 1. Studio account media (one lookup per request)
    let coverUrl: string | null = null;
    let source: 'account' | 'oembed' = 'account';
    let lookupError: 'api_error' | 'token_expired' | null = null;
    if (igToken) {
      if (!account) {
        try { account = await loadAccountCovers(igToken); } catch { account = { covers: new Map(), error: 'api_error' }; }
      }
      coverUrl = account.covers.get(code) || null;
      lookupError = account.error;
    }
    // 2. oEmbed
    if (!coverUrl && appId && clientToken) {
      const canonical = `https://www.instagram.com/${/\/p\//.test(row.instagram_url) ? 'p' : 'reel'}/${code}/`;
      coverUrl = await oembedCover(canonical, appId, clientToken);
      source = 'oembed';
    }
    if (!coverUrl) {
      results.push({ id, status: 'unavailable', reason: lookupError || 'not_found' });
      continue;
    }

    let image: { bytes: Uint8Array; type: string } | null = null;
    try { image = await downloadCover(coverUrl); } catch { image = null; }
    if (!image) { results.push({ id, status: 'unavailable', reason: 'download_failed' }); continue; }

    const path = `instagram/${code}.${IMAGE_TYPES[image.type]}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, image.bytes, { contentType: image.type, upsert: true, cacheControl: '31536000' });
    if (uploadError) { results.push({ id, status: 'error', reason: 'storage_failed' }); continue; }

    // Version query busts caches when the same path is refreshed later.
    const publicUrl = `${supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
    // Only replace the value we inspected: never overwrite a thumbnail the admin set meanwhile.
    let update = (supabase.from('instagram_reels').update as any)({ thumbnail_url: publicUrl }).eq('id', id);
    update = row.thumbnail_url == null ? update.is('thumbnail_url', null) : update.eq('thumbnail_url', row.thumbnail_url);
    const { data: updated, error: updateError } = await update.select('id');
    if (updateError) { results.push({ id, status: 'error', reason: 'database_failed' }); continue; }
    if (!updated || updated.length === 0) { results.push({ id, status: 'error', reason: 'changed_meanwhile' }); continue; }
    results.push({ id, status: 'instagram', thumbnail_url: publicUrl, source });
  }

  return res.status(200).json({ success: true, configured, results });
}
