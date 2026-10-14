import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <section className="fade-in py-24 border-t border-outline-variant/20 flex flex-col items-center text-center">
      <h2 className="font-display text-[32px] md:text-[72px] text-on-background mb-8 leading-[1.1] tracking-[-0.02em] font-semibold">
        Start Your Story With Us
      </h2>
      <Link
        to="/contact"
        className="bg-on-background text-background font-body text-[14px] font-semibold tracking-[0.05em] px-10 py-5 rounded-full btn-cinematic border border-on-background hover:bg-tertiary hover:text-on-tertiary hover:border-tertiary transition-colors text-lg"
      >
        Get a Quote
      </Link>
    </section>
  );
}
