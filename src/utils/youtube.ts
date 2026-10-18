/**
 * YouTube link helpers for the Films & Reels gallery. Only YouTube's official
 * embed player and its public thumbnail images (i.ytimg.com) are used.
 */

export interface ParsedYouTube {
  id: string;
  /** True for youtube.com/shorts/ links (portrait by default). */
  isShort: boolean;
  /** Normalised link that is stored in the database. */
  canonicalUrl: string;
}

const ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

/** Accepts youtube.com/shorts/ID, youtube.com/watch?v=ID, youtu.be/ID, m./music. hosts and /embed/ID. */
export function parseYouTubeUrl(raw: string | null | undefined): ParsedYouTube | null {
  const trimmed = (raw || '').trim();
  if (!trimmed) return null;
  let u: URL;
  try {
    u = new URL(/^[a-z]+:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase().replace(/^(www|m|music)\./, '');
  let id: string | null = null;
  let isShort = false;
  if (host === 'youtu.be') {
    id = u.pathname.slice(1).split('/')[0] || null;
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (u.pathname === '/watch') id = u.searchParams.get('v');
    const m = u.pathname.match(/^\/(shorts|embed|live|v)\/([^/?#]+)/);
    if (m) {
      id = m[2];
      isShort = m[1] === 'shorts';
    }
  }
  if (!id || !ID_PATTERN.test(id)) return null;
  return {
    id,
    isShort,
    canonicalUrl: isShort ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`,
  };
}

export function isYouTubeUrl(url: string | null | undefined): boolean {
  return parseYouTubeUrl(url) !== null;
}

/**
 * Official embed URL. Privacy-enhanced domain, inline playback on iPhone,
 * related videos limited to this channel, and the JS API so the site can pause it.
 */
export function getYouTubeEmbedUrl(id: string, { autoplay = true }: { autoplay?: boolean } = {}): string {
  const params = new URLSearchParams({
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    enablejsapi: '1',
  });
  if (autoplay) params.set('autoplay', '1');
  if (typeof window !== 'undefined') params.set('origin', window.location.origin);
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

/**
 * Public thumbnail. hqdefault (480×360) exists for every video; for Shorts the
 * portrait frame sits in its centre, so it fills a 9:16 card with object-cover.
 * mqdefault (320×180) is a clean 16:9 crop for landscape videos.
 */
export function getYouTubeThumbnail(id: string, orientation: 'portrait' | 'landscape' | 'square' = 'portrait'): string {
  return `https://i.ytimg.com/vi/${id}/${orientation === 'landscape' ? 'mqdefault' : 'hqdefault'}.jpg`;
}
