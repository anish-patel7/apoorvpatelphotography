import { useEffect } from 'react';
import SEO from '../components/common/SEO';
import Hero from '../components/home/Hero';
import ServicesOverview from '../components/home/ServicesOverview';
import FeaturedPortfolio from '../components/home/FeaturedPortfolio';
import InstagramReels from '../components/home/InstagramReels';
import CTASection from '../components/home/CTASection';

const homeSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  'name': 'Apoorv Patel Photography',
  'alternateName': 'Apoorvpatel Photography',
  'url': 'https://www.apoorvpatelphotography.com',
  'logo': 'https://www.apoorvpatelphotography.com/images/logo.png',
  'image': 'https://www.apoorvpatelphotography.com/images/real_work_dzvz4ssjoss.jpg',
  'description': 'Award-winning wedding and portrait photography by Apoorv Patel. Specializing in luxury weddings, candid moments, and cinematic films across India and the UK.',
  'slogan': 'Inspired by Innovation',
  'email': 'contact@apoorvpatelphotography.com',
  'sameAs': [
    'https://www.instagram.com/apoorvpatel_photography/'
  ],
  'knowsAbout': [
    'Wedding Photography',
    'Pre-Wedding Photography',
    'Engagement Photography',
    'Candid Photography',
    'Cinematic Wedding Films',
    'Photo Editing',
    'Video Editing',
    'Photography Training'
  ]
};

export default function Home() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <SEO
        title="Apoorv Patel Photography | Luxury Wedding & Portrait Photographer — IND & UK"
        description="Award-winning wedding and portrait photography by Apoorv Patel. Specializing in luxury weddings, candid moments, and cinematic films across India and the UK."
        canonicalPath="/"
        image="/images/real_work_dzvz4ssjoss.jpg"
        schema={homeSchema}
      />
      <Hero />
      <main className="max-w-[1440px] mx-auto px-5 md:px-16 py-[120px] space-y-[120px]">
        <ServicesOverview />
        <FeaturedPortfolio />
        <InstagramReels />
        <CTASection />
      </main>
    </>
  );
}
