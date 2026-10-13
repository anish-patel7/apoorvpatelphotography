import type { InstagramReel } from '../types';

/**
 * Instagram Reels & Social Content Registry
 * Only items with a valid individual Instagram post or reel URL (e.g. /p/ or /reel/)
 * and authentic photography thumbnails are marked as 'configured' for production display.
 * Items lacking an individual post/reel URL are marked as 'incomplete' and excluded from public production embeds.
 */
export const instagramReels: InstagramReel[] = [
  {
    id: 'DZVZ4sSjOss',
    thumbnail: '/images/real_work_dzvz4ssjoss.jpg',
    url: 'https://www.instagram.com/p/DZVZ4sSjOss/',
    title: 'Royal Groom Portrait',
    featured: true,
    status: 'configured',
  },
];

