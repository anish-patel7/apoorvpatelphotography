import { useEffect } from 'react';
import SEO from '../components/common/SEO';
import Hero from '../components/home/Hero';
import ServicesOverview from '../components/home/ServicesOverview';
import FeaturedPortfolio from '../components/home/FeaturedPortfolio';
import InstagramReels from '../components/home/InstagramReels';
import TestimonialsSection from '../components/home/TestimonialsSection';
import CTASection from '../components/home/CTASection';

const homeSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  'name': 'Apoorv Patel Photography',
  'alternateName': 'Apoorvpatel Photography',
  'url': 'https://www.apoorvpatelphotography.com',
  'logo': 'https://www.apoorvpatelphotography.com/images/logo.png',
  'image': 'https://www.apoorvpatelphotography.com/images/real_work_dzvz4ssjoss.jpg',
  'description': 'UK-based photography, multimedia and graphic design studio by Apoorv Patel. Specializing in luxury weddings, cinematic videography, multimedia design, and creative visual branding in the United Kingdom.',
  'slogan': 'Capturing Timeless Moments. Creating Inspiring Visuals. Based in the United Kingdom.',
  'email': 'contact@apoorvpatelphotography.com',
  'address': {
    '@type': 'PostalAddress',
    'addressCountry': 'GB'
  },
  'sameAs': [
    'https://www.instagram.com/apoorvpatel_photography/'
  ],
  'knowsAbout': [
    'UK Wedding Photography',
    'Pre-Wedding Photography',
    'Engagement Photography',
    'Cinematic Wedding Films',
    'Multimedia Design',
    'Graphic Design',
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
        title="Apoorv Patel Photography | UK Wedding Photography & Creative Design"
        description="Explore wedding photography, cinematic videography, multimedia design and graphic design by Apoorv Patel Photography, a UK-based creative business."
        canonicalPath="/"
        image="/images/real_work_dzvz4ssjoss.jpg"
        schema={homeSchema}
      />
      <Hero />
      <main className="max-w-[1440px] mx-auto px-5 md:px-16 py-[120px] space-y-[120px]">
        <ServicesOverview />
        <FeaturedPortfolio />
        <InstagramReels />
        <TestimonialsSection />
        <CTASection />
      </main>
    </>
  );
}
