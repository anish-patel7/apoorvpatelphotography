/**
 * Instagram URL Parsing & Embedding Utilities
 * Supports public posts (/p/), reels (/reel/ or /reels/), and IGTV (/tv/).
 * Cleans tracking parameters and builds standard public embed URLs.
 */

export type InstagramType = 'post' | 'reel' | 'tv';

export interface ParsedInstagramInfo {
  isValid: boolean;
  id: string | null;
  type: InstagramType | null;
  canonicalUrl: string | null;
  embedUrl: string | null;
  rawUrl: string;
}

/**
 * Validates whether a given string is a valid Instagram post/reel/tv URL.
 */
export function isValidInstagramUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  const pattern = /^(https?:\/\/)?(www\.)?instagram\.com\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i;
  return pattern.test(trimmed);
}

/**
 * Extracts the post or reel ID from an Instagram URL.
 * Handles trailing slashes, tracking parameters, and mobile URLs.
 */
export function extractInstagramId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const match = trimmed.match(/instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
  return match ? match[1] : null;
}

/**
 * Detects whether the Instagram URL points to a reel, post, or IGTV.
 */
export function getInstagramType(url: string): InstagramType | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim().toLowerCase();
  if (trimmed.includes('/reel/') || trimmed.includes('/reels/')) return 'reel';
  if (trimmed.includes('/tv/')) return 'tv';
  if (trimmed.includes('/p/')) return 'post';
  return null;
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
 * Strips tracking parameters (utm_source, psln, srtk, etc.) and returns
 * the canonical Instagram URL, or the trimmed original if not parseable.
 */
export function cleanInstagramUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const parsed = parseInstagramUrl(url);
  return parsed.canonicalUrl || url.trim();
}
