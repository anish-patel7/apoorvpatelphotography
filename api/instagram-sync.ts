import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

/**
 * Optional Instagram → instagram_reels import (Vercel Serverless Function).
 *
 * Uses the official Instagram API with Instagram Login (Meta Graph API) to list the
 * studio account's recent media, and inserts any reels not already in the table
 * as DRAFTS (status 'incomplete', not featured). Nothing is published automatically.
 *
 * Server-side environment variables (Vercel → Settings → Environment Variables,
 * NEVER prefixed with VITE_):
 *   INSTAGRAM_ACCESS_TOKEN     long-lived Instagram user access token (instagram_business_basic)
 *   SUPABASE_URL               or VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  service role key (bypasses RLS — server only)
 *   CRON_SECRET                optional; lets a Vercel Cron job call GET /api/instagram-sync
 *
 * Callers:
 *   POST with "Authorization: Bearer <Supabase access token>" of an active admin (dashboard button)
 *   GET  with "Authorization: Bearer <CRON_SECRET>" (Vercel Cron)
 */

const GRAPH_BASE = 'https://graph.instagram.com/v21.0';
const MEDIA_FIELDS = 'id,caption,media_type,media_product_type,permalink,thumbnail_url,timestamp';
const MAX_MEDIA = 25;

const PERMALINK_REGEX = /instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i;

function canonicalPermalink(permalink: string): string | null {
  const match = permalink.match(PERMALINK_REGEX);
  if (!match) return null;
  const segment = match[1].toLowerCase() === 'p' ? 'p' : match[1].toLowerCase() === 'tv' ? 'tv' : 'reel';
  return `https://www.instagram.com/${segment}/${match[2]}/`;
}

function titleFromCaption(caption: string | undefined): string {
  const firstLine = (caption || '').split('\n').map(l => l.trim()).find(Boolean) || '';
  const cleaned = firstLine.replace(/#[\w]+/g, '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'Instagram Reel';
  return cleaned.length > 80 ? `${cleaned.slice(0, 77).trimEnd()}…` : cleaned;
}

function bearer(req: any): string | null {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const igToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  const missing = [
    !supabaseUrl && 'SUPABASE_URL',
    !serviceKey && 'SUPABASE_SERVICE_ROLE_KEY',
    !igToken && 'INSTAGRAM_ACCESS_TOKEN',
  ].filter(Boolean);
  if (missing.length > 0) {
    return res.status(501).json({
      success: false,
      configured: false,
      error: `Instagram sync is not configured. Missing server environment variables: ${missing.join(', ')}.`,
    });
  }

  const supabase = createClient(supabaseUrl!, serviceKey!, { auth: { persistSession: false } });

  // ---- Authorisation -------------------------------------------------------
  const token = bearer(req);
  if (!token) return res.status(401).json({ success: false, error: 'Missing authorization.' });

  if (req.method === 'GET') {
    if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }
  } else {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return res.status(401).json({ success: false, error: 'Your session is invalid or expired. Please sign in again.' });
    }
    const { data: profile } = await supabase
      .from('admin_profiles')
      .select('id, role, is_active')
      .eq('id', userData.user.id)
      .maybeSingle();
    if (!profile || !(profile as any).is_active || !['admin', 'super_admin'].includes((profile as any).role)) {
      return res.status(403).json({ success: false, error: 'Admin access required.' });
    }
  }

  try {
    // ---- Fetch recent media from the official API -------------------------
    const mediaUrl = `${GRAPH_BASE}/me/media?fields=${MEDIA_FIELDS}&limit=${MAX_MEDIA}&access_token=${encodeURIComponent(igToken!)}`;
    const igRes = await fetch(mediaUrl);
    const igBody: any = await igRes.json().catch(() => null);
    if (!igRes.ok || !igBody || !Array.isArray(igBody.data)) {
      const apiMessage = igBody?.error?.message || `HTTP ${igRes.status}`;
      const expired = igBody?.error?.code === 190;
      return res.status(502).json({
        success: false,
        error: expired
          ? 'The Instagram access token has expired or was revoked. Generate a new long-lived token and update INSTAGRAM_ACCESS_TOKEN.'
          : `Instagram API error: ${apiMessage}`,
      });
    }

    const reelsFromApi = (igBody.data as any[]).filter(
      m => m?.media_product_type === 'REELS' || (m?.media_type === 'VIDEO' && m?.media_product_type !== 'STORY')
    );

    // ---- Skip anything already in the table --------------------------------
    const { data: existingRows, error: existingError } = await supabase
      .from('instagram_reels')
      .select('instagram_url, display_order');
    if (existingError) throw existingError;

    const existing = new Set(
      (existingRows || []).map((r: any) => String(r.instagram_url || '')).filter(Boolean)
    );
    let nextOrder = (existingRows || []).reduce((max: number, r: any) => Math.max(max, Number(r.display_order) || 0), 0) + 1;

    let imported = 0;
    let skipped = 0;

    // Oldest first so display order follows posting order.
    for (const media of reelsFromApi.reverse()) {
      const permalink = canonicalPermalink(String(media.permalink || ''));
      if (!permalink || existing.has(permalink)) {
        skipped++;
        continue;
      }

      // Instagram CDN thumbnail URLs expire, so copy the image into our own storage.
      let thumbnailUrl = '';
      if (media.thumbnail_url) {
        try {
          const imgRes = await fetch(media.thumbnail_url);
          const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
          if (imgRes.ok && contentType.startsWith('image/')) {
            const bytes = new Uint8Array(await imgRes.arrayBuffer());
            const path = `instagram/${String(media.id).replace(/[^0-9A-Za-z_-]/g, '')}.jpg`;
            const { error: uploadError } = await supabase.storage
              .from('reel-thumbnails')
              .upload(path, bytes, { contentType, upsert: true, cacheControl: '31536000' });
            if (!uploadError) {
              thumbnailUrl = supabase.storage.from('reel-thumbnails').getPublicUrl(path).data.publicUrl;
            }
          }
        } catch {
          // Thumbnail is optional; the admin can upload one later.
        }
      }

      const { error: insertError } = await supabase.from('instagram_reels').insert([{
        id: randomUUID(),
        title: titleFromCaption(media.caption),
        instagram_url: permalink,
        video_url: null,
        media_type: 'instagram',
        thumbnail_url: thumbnailUrl,
        content_type: 'reel',
        status: 'incomplete',
        is_featured: false,
        orientation: 'portrait',
        display_order: nextOrder,
      }] as any);

      if (insertError) {
        // 23505 = already imported by a concurrent run
        if ((insertError as any).code === '23505') {
          skipped++;
          continue;
        }
        throw insertError;
      }
      existing.add(permalink);
      nextOrder++;
      imported++;
    }

    return res.status(200).json({ success: true, imported, skipped, checked: reelsFromApi.length });
  } catch (err: any) {
    console.error('Instagram sync failed:', err?.message || err);
    return res.status(500).json({ success: false, error: 'Instagram sync failed. Check the Vercel function logs.' });
  }
}
