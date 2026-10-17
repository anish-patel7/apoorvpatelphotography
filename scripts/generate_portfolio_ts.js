import fs from 'node:fs';

const importedData = JSON.parse(fs.readFileSync('scripts/imported_portfolio_data.json', 'utf8'));

const existingGroomProject = {
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
  orientation: 'portrait'
};

const allProjects = [
  existingGroomProject,
  ...importedData.map(p => ({
    id: p.slug,
    title: p.title,
    category: p.category,
    coverImage: p.coverImage,
    images: p.images,
    description: p.description,
    date: p.date,
    location: p.location,
    featured: p.featured,
    isRealWork: true,
    orientation: p.orientation
  }))
];

const tsContent = `import type { PortfolioProject } from '../types';

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

export const portfolioProjects: PortfolioProject[] = ${JSON.stringify(allProjects, null, 2)};
`;

fs.writeFileSync('src/data/portfolio.ts', tsContent, 'utf8');
console.log('src/data/portfolio.ts updated successfully with all 4 imported photography projects and 46 images!');
