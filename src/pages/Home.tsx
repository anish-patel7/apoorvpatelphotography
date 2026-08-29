import Hero from '../components/home/Hero';
import ServicesOverview from '../components/home/ServicesOverview';
import FeaturedPortfolio from '../components/home/FeaturedPortfolio';
import InstagramReels from '../components/home/InstagramReels';
import AboutPreview from '../components/home/AboutPreview';
import WhyChooseUs from '../components/home/WhyChooseUs';
import TrainingPreview from '../components/home/TrainingPreview';
import TestimonialsSection from '../components/home/TestimonialsSection';
import CTASection from '../components/home/CTASection';

export default function Home() {
  return (
    <>
      <Hero />
      <ServicesOverview />
      <FeaturedPortfolio />
      <InstagramReels />
      <AboutPreview />
      <WhyChooseUs />
      <TrainingPreview />
      <TestimonialsSection />
      <CTASection />
    </>
  );
}
