import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-brand-dark" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-1">
            <div className="h-0.5 w-12 bg-brand-saffron rounded"></div>
            <div className="h-0.5 w-12 bg-white rounded"></div>
            <div className="h-0.5 w-12 bg-brand-green rounded"></div>
          </div>
        </div>

        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight">
          <span className="block">Apoorvpatel</span>
          <span className="block text-brand-saffron">Photography</span>
        </h1>

        <p className="font-script text-2xl sm:text-3xl text-brand-gold mb-2">
          "inspired by innovation"
        </p>

        <p className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto mb-4">
          IND | UK
        </p>

        <p className="text-white/60 text-base sm:text-lg max-w-2xl mx-auto mb-10">
          Professional Photography, Videography, Editing & Training.
          Capturing moments that last a lifetime with artistry and passion.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/portfolio"
            className="group px-8 py-3.5 bg-brand-saffron text-black font-semibold rounded-full hover:bg-brand-gold transition-all duration-300 flex items-center gap-2"
          >
            View Portfolio
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/contact"
            className="px-8 py-3.5 border-2 border-white/30 text-white font-semibold rounded-full hover:border-brand-saffron hover:text-brand-saffron transition-all duration-300 flex items-center gap-2"
          >
            <Play size={18} />
            Get a Quote
          </Link>
        </div>

        <div className="mt-16 flex items-center justify-center gap-8 sm:gap-16 text-center">
          {[
            { value: '500+', label: 'Projects' },
            { value: '300+', label: 'Happy Clients' },
            { value: '5+', label: 'Years Experience' },
            { value: '2', label: 'Countries' },
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-2xl sm:text-3xl font-bold text-brand-saffron">{stat.value}</div>
              <div className="text-white/50 text-xs sm:text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1.5 h-3 bg-white/50 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
