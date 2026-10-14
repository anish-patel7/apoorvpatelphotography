import type { PortfolioProject } from '../types';

export const portfolioCategories = [
  'All',
  'Wedding',
  'Engagement',
  'Pre-Wedding',
  'Baby Shower',
  'Family',
  'Personal',
  'Videography',
  'Multimedia Design',
  'Graphic Design',
  'Photo Editing',
  'Video Editing',
] as const;

export const portfolioProjects: PortfolioProject[] = [
  {
    id: 'royal-groom-portrait',
    title: 'Royal Groom Portrait — Timeless Heritage',
    category: 'Wedding',
    coverImage: '/images/real_work_dzvz4ssjoss.jpg',
    images: [
      '/images/real_work_dzvz4ssjoss.jpg',
    ],
    videoUrl: 'https://www.instagram.com/p/DZVZ4sSjOss/',
    reelUrl: 'https://www.instagram.com/p/DZVZ4sSjOss/',
    instagramUrl: 'https://www.instagram.com/p/DZVZ4sSjOss/',
    contentType: 'post',
    description: 'An evocative, black-and-white royal groom portrait showcasing traditional embroidered safa and contemplative emotion, captured through dramatic chiaroscuro lighting.',
    date: '2026',
    location: 'Gujarat, India',
    featured: true,
    isRealWork: true,
  },
];

