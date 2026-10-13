import type { PortfolioProject, Testimonial, Lead } from '../types';

/**
 * Development & Testing Demo Seed Data
 * This file contains mock records strictly for local development testing and sandbox seeding.
 * It is NOT used in production-facing public website renders.
 */

export const demoPortfolioProjects: PortfolioProject[] = [
  {
    id: 'elegant-wedding-ceremony',
    title: 'Elegant Wedding Ceremony',
    category: 'Wedding',
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1200&auto=format&fit=crop&q=85',
    ],
    description: 'A beautiful traditional wedding ceremony captured with cinematic elegance.',
    date: '2026',
    location: 'Gujarat, India',
    featured: true,
    isRealWork: false,
  },
  {
    id: 'romantic-pre-wedding',
    title: 'Romantic Pre-Wedding Shoot',
    category: 'Pre-Wedding',
    coverImage: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1200&auto=format&fit=crop&q=85',
    ],
    description: 'A dreamy pre-wedding shoot set against breathtaking landscapes.',
    date: '2026',
    location: 'Udaipur, India',
    featured: true,
    isRealWork: false,
  },
  {
    id: 'garden-engagement',
    title: 'Garden Engagement Session',
    category: 'Engagement',
    coverImage: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&auto=format&fit=crop&q=85',
    ],
    description: 'An intimate engagement session in a beautiful garden setting.',
    date: '2025',
    location: 'London, UK',
    featured: true,
    isRealWork: false,
  },
];

export const demoTestimonials: Testimonial[] = [
  {
    id: 'demo-1',
    name: 'Priya & Rahul',
    review: 'Apoorv captured our wedding day perfectly. Every emotion, every detail — the photos are absolutely stunning.',
    service: 'Wedding Photography',
    date: '2026',
    rating: 5,
  },
  {
    id: 'demo-2',
    name: 'Sarah Thompson',
    review: 'The pre-wedding shoot was magical! Apoorv has an incredible eye for composition and made us feel so comfortable.',
    service: 'Pre-Wedding Shoot',
    date: '2025',
    rating: 5,
  },
];

export const demoLeads: Lead[] = [
  {
    id: 'demo-lead-1',
    name: 'Priya Sharma (Sample)',
    email: 'priya@example.com',
    mobile: '+91 98765 43210',
    whatsapp: '+91 98765 43210',
    serviceType: 'Wedding Photography',
    eventType: 'Wedding',
    eventDate: '2026-12-15',
    location: 'Ahmedabad',
    status: 'new',
    source: 'Website',
    createdAt: '2026-08-28',
    message: 'Sample inquiry for development preview.',
    notes: [],
  },
];
