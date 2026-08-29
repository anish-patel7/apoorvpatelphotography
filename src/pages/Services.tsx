import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Video, Palette, ArrowRight, CheckCircle2 } from 'lucide-react';
import { services, serviceCategories } from '../data/services';

const iconMap: Record<string, React.ElementType> = { Camera, Video, Palette };

export default function Services() {
  const [activeTab, setActiveTab] = useState<string>('photography');

  const filtered = services.filter(s => s.category === activeTab);

  return (
    <>
      <section className="pt-32 pb-12 bg-brand-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-brand-saffron text-sm font-semibold tracking-widest uppercase mb-3">What We Offer</p>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Our Services</h1>
            <p className="text-white/50 max-w-2xl mx-auto">
              From capturing your precious moments to transforming them into timeless art — we offer comprehensive creative services.
            </p>
          </div>

          <div className="flex justify-center gap-4 mb-12">
            {serviceCategories.map(cat => {
              const Icon = iconMap[cat.icon] || Camera;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all ${
                    activeTab === cat.id
                      ? 'bg-brand-saffron text-black'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <Icon size={18} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pb-20 bg-brand-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map(service => (
              <div
                key={service.id}
                className="group bg-brand-charcoal rounded-2xl p-8 border border-white/5 hover:border-brand-saffron/30 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-brand-saffron/10 flex items-center justify-center mb-6">
                  <Camera size={24} className="text-brand-saffron" />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-3 group-hover:text-brand-saffron transition-colors">
                  {service.title}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed mb-6">{service.description}</p>
                <ul className="space-y-2 mb-6">
                  {service.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle2 size={14} className="text-brand-green shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-1 text-brand-saffron text-sm font-medium hover:gap-2 transition-all"
                >
                  Inquire Now <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-brand-charcoal">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
            Need a Custom Package?
          </h2>
          <p className="text-white/50 mb-8">
            We offer customized packages tailored to your specific needs. Get in touch and let's discuss your requirements.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/contact"
              className="px-8 py-3.5 bg-brand-saffron text-black font-semibold rounded-full hover:bg-brand-gold transition-colors flex items-center gap-2"
            >
              Get a Quote <ArrowRight size={18} />
            </Link>
            <a
              href="https://wa.me/?text=Hi%2C%20I%27m%20interested%20in%20your%20photography%20services."
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600 transition-colors"
            >
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
