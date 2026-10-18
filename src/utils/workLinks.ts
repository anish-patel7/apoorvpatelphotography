/**
 * Classifies a pasted "work link" so the site can show it the right way:
 * Instagram posts/reels use Instagram's embed, YouTube/Vimeo use their official
 * players, direct image/video files are shown inline, and any other website is
 * opened as a normal link (most sites forbid being embedded).
 */
import { parseInstagramUrl } from './instagram';

export type WorkLinkKind = 'instagram' | 'youtube' | 'vimeo' | 'image' | 'video' | 'website';

export interface WorkLinkInfo {
  kind: WorkLinkKind;
  /** Normalised URL to store. */
  url: string;
  /** Official embed player URL (YouTube/Vimeo). */
  embedUrl?: string;
  /** Instagram only: reel vs post. */
  instagramType?: 'reel' | 'post';
}

export interface WorkLinkResult {
  info: WorkLinkInfo | null;
  error: string | null;
}

const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i;

function youtubeId(u: URL): string | null {
  const host = u.hostname.replace(/^www\.|^m\./, '');
  if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (u.pathname === '/watch') return u.searchParams.get('v');
    const m = u.pathname.match(/^\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{6,})/);
    return m ? m[1] : null;
  }
  return null;
}

function vimeoId(u: URL): string | null {
  const host = u.hostname.replace(/^www\./, '');
  if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return null;
  const m = u.pathname.match(/\/(?:video\/)?(\d{6,})/);
  return m ? m[1] : null;
}

export function parseWorkLink(raw: string): WorkLinkResult {
  const trimmed = raw.trim();
  if (!trimmed) return { info: null, error: null };

  let u: URL;
  try {
    u = new URL(/^[a-z]+:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return { info: null, error: 'This doesn\'t look like a web link. Please paste the full address.' };
  }
  if (u.protocol !== 'https:') {
    return { info: null, error: 'Please use a secure link that starts with https://' };
  }

  const ig = parseInstagramUrl(u.toString());
  if (/(^|\.)instagram\.com$|(^|\.)instagr\.am$/i.test(u.hostname)) {
    if (!ig.isValid || !ig.canonicalUrl) {
      return { info: null, error: 'Please paste a link to a single Instagram post or reel (not a profile).' };
    }
    return { info: { kind: 'instagram', url: ig.canonicalUrl, instagramType: ig.type === 'post' ? 'post' : 'reel' }, error: null };
  }

  const yt = youtubeId(u);
  if (yt) {
    return { info: { kind: 'youtube', url: `https://www.youtube.com/watch?v=${yt}`, embedUrl: `https://www.youtube-nocookie.com/embed/${yt}` }, error: null };
  }
  const vm = vimeoId(u);
  if (vm) {
    return { info: { kind: 'vimeo', url: `https://vimeo.com/${vm}`, embedUrl: `https://player.vimeo.com/video/${vm}` }, error: null };
  }

  if (IMAGE_EXT.test(u.pathname)) return { info: { kind: 'image', url: u.toString() }, error: null };
  if (VIDEO_EXT.test(u.pathname)) return { info: { kind: 'video', url: u.toString() }, error: null };
  return { info: { kind: 'website', url: u.toString() }, error: null };
}

export const WORK_LINK_LABEL: Record<WorkLinkKind, string> = {
  instagram: 'Instagram',
  youtube: 'YouTube video',
  vimeo: 'Vimeo video',
  image: 'Image link',
  video: 'Video link',
  website: 'Website link',
};
