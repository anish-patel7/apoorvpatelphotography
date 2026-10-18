/**
 * Reel media helpers shared by the admin dashboard, the homepage showcase and the viewer.
 * A reel is either an Instagram post/reel (played via Instagram's public embed)
 * or a video uploaded to Supabase Storage (played with native HTML5 controls).
 */

import { isValidInstagramUrl } from './instagram';
import type { InstagramReel, ReelMediaType } from '../types';

export const REEL_VIDEO_BUCKET = 'reel-videos';
export const REEL_THUMBNAIL_BUCKET = 'reel-thumbnails';

/** Keep in sync with the reel-videos bucket file_size_limit (migration 008). */
export const MAX_REEL_VIDEO_BYTES = 50 * 1024 * 1024;
export const MAX_REEL_THUMBNAIL_BYTES = 5 * 1024 * 1024;

export const ALLOWED_REEL_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
export const ALLOWED_REEL_THUMBNAIL_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/** Number of featured reels shown on the homepage. */
export const HOMEPAGE_REEL_LIMIT = 7;

export const DEFAULT_REEL_THUMBNAIL = '/images/real_work_dzvz4ssjoss.jpg';

/** Temporary browser-only URLs that must never be stored in the database. */
export function isTemporaryUrl(url: string | null | undefined): boolean {
  return Boolean(url && /^(blob|data):/i.test(url.trim()));
}

/** Direct links to video files (uploaded to storage or hosted elsewhere). */
export function isDirectVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (isTemporaryUrl(trimmed)) return false;
  return /\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(trimmed) || trimmed.includes(`/storage/v1/object/public/${REEL_VIDEO_BUCKET}/`);
}

export function getReelMediaType(reel: Pick<InstagramReel, 'media_type' | 'video_url'>): ReelMediaType {
  if (reel.media_type === 'video' || reel.media_type === 'instagram') return reel.media_type;
  return reel.video_url ? 'video' : 'instagram';
}

/** True when the reel has something a visitor can actually play. */
export function hasPlayableMedia(reel: InstagramReel): boolean {
  if (getReelMediaType(reel) === 'video') {
    return Boolean(reel.video_url) && !isTemporaryUrl(reel.video_url);
  }
  return isValidInstagramUrl(reel.instagram_url || reel.url || '');
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** CSS aspect ratio (width / height) for a reel, using real dimensions when known. */
export function getReelAspectRatio(reel: {
  video_width?: number | null;
  video_height?: number | null;
  orientation?: InstagramReel['orientation'] | null;
}): number {
  if (reel.video_width && reel.video_height) return reel.video_width / reel.video_height;
  switch (reel.orientation) {
    case 'landscape':
      return 16 / 9;
    case 'square':
      return 1;
    default:
      return 9 / 16;
  }
}
