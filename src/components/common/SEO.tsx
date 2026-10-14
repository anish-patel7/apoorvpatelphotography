import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface SEOProps {
  title: string;
  description: string;
  canonicalPath?: string;
  image?: string;
  type?: 'website' | 'article';
  schema?: Record<string, unknown> | Array<Record<string, unknown>>;
  noindex?: boolean;
}

const DEFAULT_TITLE = 'Apoorv Patel Photography | UK Wedding Photography & Creative Design';
const DEFAULT_DESCRIPTION = 'Explore wedding photography, cinematic videography, multimedia design and graphic design by Apoorv Patel Photography, a UK-based creative business.';
const DEFAULT_IMAGE = '/images/logo.png';
const SITE_NAME = 'Apoorv Patel Photography';

function getBaseUrl(): string {
  const envUrl = import.meta.env.VITE_SITE_URL as string | undefined;
  if (envUrl && envUrl.trim()) {
    return envUrl.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return 'https://www.apoorvpatelphotography.com';
}

export default function SEO({
  title,
  description,
  canonicalPath,
  image = DEFAULT_IMAGE,
  type = 'website',
  schema,
  noindex = false,
}: SEOProps) {
  const location = useLocation();

  useEffect(() => {
    const baseUrl = getBaseUrl();
    const fullTitle = title
      ? (title.includes('Apoorv') ? title : `${title} | ${SITE_NAME}`)
      : DEFAULT_TITLE;
    const fullCanonical = `${baseUrl}${canonicalPath || location.pathname}`;
    const fullImageUrl = image.startsWith('http')
      ? image
      : `${baseUrl}${image.startsWith('/') ? image : `/${image}`}`;

    // 1. Document Title
    document.title = fullTitle;

    // Helper to set or create meta tag
    const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Helper to set or create link tag
    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // 2. Standard Meta Tags
    setMeta('name', 'description', description || DEFAULT_DESCRIPTION);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // 3. Canonical Link
    setLink('canonical', fullCanonical);

    // 4. Open Graph Meta Tags
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description || DEFAULT_DESCRIPTION);
    setMeta('property', 'og:url', fullCanonical);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:image', fullImageUrl);

    // 5. Twitter Card Meta Tags
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description || DEFAULT_DESCRIPTION);
    setMeta('name', 'twitter:image', fullImageUrl);

    // 6. JSON-LD Structured Data
    const SCRIPT_ID = 'seo-structured-data';
    let scriptEl = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (schema) {
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = SCRIPT_ID;
        scriptEl.type = 'application/ld+json';
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(schema);
    } else if (scriptEl) {
      scriptEl.remove();
    }
  }, [title, description, canonicalPath, image, type, schema, noindex, location.pathname]);

  return null;
}
