import { useEffect } from 'react';
import Hero from '../components/home/Hero';
import ServicesOverview from '../components/home/ServicesOverview';
import FeaturedPortfolio from '../components/home/FeaturedPortfolio';
import CTASection from '../components/home/CTASection';

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
      <Hero />
      <main className="max-w-[1440px] mx-auto px-5 md:px-16 py-[120px] space-y-[120px]">
        <ServicesOverview />
        <FeaturedPortfolio />
        <CTASection />
      </main>
    </>
  );
}
