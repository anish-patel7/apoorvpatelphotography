/**
 * Instagram URL Parsing & Embedding Utilities
 * Supports public posts (/p/), reels (/reel/ or /reels/), IGTV (/tv/),
 * mobile share links (/share/reel/ or /share/p/), m.instagram.com, and instagr.am.
 * Cleans tracking parameters and builds standard public embed URLs.
 */

export type InstagramType = 'post' | 'reel' | 'tv';

/** Official studio Instagram profile. */
export const INSTAGRAM_PROFILE_URL = 'https://www.instagram.com/apoorvpatel_photography/';
export const INSTAGRAM_HANDLE = '@apoorvpatel_photography';

export interface ParsedInstagramInfo {
  isValid: boolean;
  id: string | null;
  type: InstagramType | null;
  canonicalUrl: string | null;
  embedUrl: string | null;
  rawUrl: string;
}

const INSTAGRAM_REGEX = /(?:https?:\/\/)?(?:[a-zA-Z0-9-]+\.)?(?:instagram\.com|instagr\.am)\/(?:(?:share\/)?(?:reel|reels|p|tv))\/(?:[^\/]*\/)?([A-Za-z0-9_-]+)/i;
const FALLBACK_PATTERN = /(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i;

/**
 * Validates whether a given string is a valid Instagram post/reel/tv URL.
 */
export function isValidInstagramUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return INSTAGRAM_REGEX.test(trimmed) || (trimmed.includes('instagram.com') && FALLBACK_PATTERN.test(trimmed));
}

/**
 * Extracts the post or reel ID from an Instagram URL.
 * Handles trailing slashes, tracking parameters, mobile share URLs, and m.instagram.com.
 */
export function extractInstagramId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const match = trimmed.match(INSTAGRAM_REGEX) || trimmed.match(FALLBACK_PATTERN);
  return match ? match[1] : null;
}

/**
 * Detects whether the Instagram URL points to a reel, post, or IGTV.
 */
export function getInstagramType(url: string): InstagramType | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim().toLowerCase();
  if (trimmed.includes('/reel/') || trimmed.includes('/reels/') || trimmed.includes('/share/reel/')) return 'reel';
  if (trimmed.includes('/tv/')) return 'tv';
  if (trimmed.includes('/p/') || trimmed.includes('/share/p/')) return 'post';
  return 'reel'; // Default to reel for modern short-form video content
}

/**
 * Parses an Instagram URL, cleans all tracking query parameters,
 * and generates both canonical link and standard public embed iframe URL.
 */
export function parseInstagramUrl(url: string): ParsedInstagramInfo {
  const rawUrl = (url || '').trim();
  const id = extractInstagramId(rawUrl);
  const type = getInstagramType(rawUrl);

  if (!id || !type) {
    return {
      isValid: false,
      id: null,
      type: null,
      canonicalUrl: null,
      embedUrl: null,
      rawUrl,
    };
  }

  // Normalize path segment ('reels' -> 'reel')
  const pathSegment = type === 'reel' ? 'reel' : type === 'tv' ? 'tv' : 'p';
  const canonicalUrl = `https://www.instagram.com/${pathSegment}/${id}/`;
  // Instagram public embed endpoint (works across all browsers)
  const embedUrl = `https://www.instagram.com/${pathSegment}/${id}/embed/`;

  return {
    isValid: true,
    id,
    type,
    canonicalUrl,
    embedUrl,
    rawUrl,
  };
}

/**
 * Strips tracking parameters (utm_source, igsh, etc.) and returns
 * the canonical Instagram URL, or the trimmed original if not parseable.
 */
export function cleanInstagramUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const parsed = parseInstagramUrl(url);
  return parsed.canonicalUrl || url.trim();
}
