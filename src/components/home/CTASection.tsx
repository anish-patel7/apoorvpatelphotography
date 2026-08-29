import { Link } from 'react-router-dom';
import { MessageCircle, ArrowRight } from 'lucide-react';
import InstagramIcon from '../icons/InstagramIcon';

export default function CTASection() {
  return (
    <section className="py-20 sm:py-28 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1920&q=80)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/80 to-black/90" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
          Ready to Capture Your <span className="text-brand-saffron">Special Moments</span>?
        </h2>
        <p className="text-white/60 text-lg mb-10 max-w-2xl mx-auto">
          Let's create something beautiful together. Get in touch to discuss your photography,
          videography, or editing needs.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/contact"
            className="group px-8 py-3.5 bg-brand-saffron text-black font-semibold rounded-full hover:bg-brand-gold transition-all duration-300 flex items-center gap-2"
          >
            Get a Quote
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="https://wa.me/?text=Hi%2C%20I%27m%20interested%20in%20your%20photography%20services."
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3.5 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <MessageCircle size={18} />
            WhatsApp Us
          </a>
          <a
            href="https://www.instagram.com/apoorvpatel_photography/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3.5 border-2 border-white/30 text-white font-semibold rounded-full hover:border-brand-saffron hover:text-brand-saffron transition-all duration-300 flex items-center gap-2"
          >
            <InstagramIcon size={18} />
            Follow Us
          </a>
        </div>
      </div>
    </section>
  );
}
