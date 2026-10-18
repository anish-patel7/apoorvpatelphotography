import { createClient } from '@supabase/supabase-js';

/**
 * GET /sitemap.xml (rewritten to /api/sitemap in vercel.json)
 * Lists the main pages plus every PUBLISHED portfolio project, so work added in the
 * admin dashboard is discoverable by search engines without a redeploy.
 * Uses the public anon key: Row Level Security only exposes published projects.
 */

const SITE = (process.env.VITE_SITE_URL || 'https://www.apoorvpatelphotography.com').replace(/\/$/, '');

const STATIC_PAGES: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/portfolio', changefreq: 'weekly', priority: '0.9' },
  { path: '/services', changefreq: 'monthly', priority: '0.8' },
  { path: '/training', changefreq: 'monthly', priority: '0.8' },
  { path: '/about', changefreq: 'monthly', priority: '0.6' },
  { path: '/contact', changefreq: 'yearly', priority: '0.7' },
];

function xmlEscape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function absolute(url: string): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE}${url.startsWith('/') ? url : `/${url}`}`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }

  const today = new Date().toISOString().slice(0, 10);
  const urls: string[] = STATIC_PAGES.map(
    p => `  <url>\n    <loc>${SITE}${p.path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`
  );

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (supabaseUrl && anonKey && !supabaseUrl.includes('your-project')) {
    try {
      const supabase = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
      const { data, error } = await supabase
        .from('portfolio_projects')
        .select('slug, title, category, cover_image_url, updated_at')
        .eq('is_published', true)
        .order('display_order', { ascending: true })
        .limit(1000);
      if (error) throw error;
      for (const p of data || []) {
        if (!p.slug) continue;
        const image = absolute(p.cover_image_url || '');
        urls.push(
          `  <url>\n    <loc>${SITE}/portfolio/${encodeURIComponent(p.slug)}</loc>\n` +
          `    <lastmod>${String(p.updated_at || today).slice(0, 10)}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n` +
          (image ? `    <image:image>\n      <image:loc>${xmlEscape(image)}</image:loc>\n      <image:title>${xmlEscape(p.title || `${p.category} photography`)}</image:title>\n    </image:image>\n` : '') +
          '  </url>'
        );
      }
    } catch (err: any) {
      // Still serve the main pages; log for the developer.
      console.error('[sitemap] portfolio query failed:', err?.message || err);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('\n')}\n</urlset>\n`;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).send(req.method === 'HEAD' ? '' : xml);
}
