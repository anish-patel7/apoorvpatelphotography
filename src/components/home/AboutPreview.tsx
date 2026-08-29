import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function AboutPreview() {
  return (
    <section className="py-20 sm:py-28 bg-brand-charcoal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="relative">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=800&q=80"
                alt="Photographer at work"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-brand-saffron rounded-2xl p-6 shadow-2xl hidden sm:block">
              <div className="text-black text-center">
                <div className="text-3xl font-bold">5+</div>
                <div className="text-sm font-medium">Years of</div>
                <div className="text-sm font-medium">Excellence</div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-brand-saffron text-sm font-semibold tracking-widest uppercase mb-3">About Us</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Capturing Moments,<br />
              <span className="text-brand-saffron">Creating Memories</span>
            </h2>
            <p className="text-white/60 leading-relaxed mb-6">
              Apoorvpatel Photography is a professional creative studio specializing in photography,
              videography, editing, and training. With a presence in India and the United Kingdom,
              we bring a unique blend of cultural richness and modern creativity to every project.
            </p>
            <p className="text-white/60 leading-relaxed mb-8">
              Our philosophy is simple — every moment tells a story, and we're here to tell it beautifully.
              From grand weddings to intimate portraits, from cinematic films to creative edits, we pour
              our passion into every frame.
            </p>

            <div className="grid grid-cols-2 gap-6 mb-8">
              {[
                { label: 'Photography', desc: 'Weddings, Events & Portraits' },
                { label: 'Videography', desc: 'Cinematic Films & Reels' },
                { label: 'Editing', desc: 'Photo & Video Post-Production' },
                { label: 'Training', desc: 'Learn Photography & Editing' },
              ].map(item => (
                <div key={item.label} className="border-l-2 border-brand-saffron pl-4">
                  <h4 className="font-semibold text-sm mb-0.5">{item.label}</h4>
                  <p className="text-white/50 text-xs">{item.desc}</p>
                </div>
              ))}
            </div>

            <Link
              to="/about"
              className="inline-flex items-center gap-2 text-brand-saffron font-medium hover:gap-3 transition-all"
            >
              Learn More About Us <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
