import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useServices } from '../hooks/useServices';

const serviceCategories = [
  { id: 'photography', label: 'Photography', icon: 'photo_camera' },
  { id: 'videography', label: 'Videography', icon: 'videocam' },
  { id: 'editing', label: 'Editing', icon: 'edit' },
];

export default function Services() {
  const [activeTab, setActiveTab] = useState<string>('photography');
  const { services, loading } = useServices(activeTab);

  return (
    <main className="pt-[104px]">
      <section className="px-5 md:px-16 py-[120px] max-w-[1440px] mx-auto">
        <div className="text-center mb-16">
          <p className="font-body text-[12px] font-bold tracking-[0.2em] uppercase text-tertiary mb-6">What We Offer</p>
          <h1 className="font-display text-[40px] md:text-[72px] text-on-background mb-6 leading-[1.1] tracking-[-0.02em] font-semibold">
            Our Services
          </h1>
          <p className="font-body text-[18px] text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            From capturing your precious moments to transforming them into timeless art — we offer comprehensive creative services.
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-16 flex-wrap">
          {serviceCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-sm font-body text-[14px] font-semibold tracking-[0.05em] transition-all ${
                activeTab === cat.id
                  ? 'bg-tertiary text-background border-b-2 border-tertiary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      <section className="px-5 md:px-16 pb-[120px] max-w-[1440px] mx-auto">
        {loading ? (
          <div className="text-center py-20">
            <p className="text-on-surface-variant">Loading services...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-on-surface-variant text-lg">No services available for this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map(service => (
              <div
                key={service.id}
                className="group bg-surface-container-low rounded-sm p-8 border border-outline-variant/10 hover:bg-surface-container transition-colors duration-300"
              >
                <span className="material-symbols-outlined text-[40px] text-tertiary mb-4 block" style={{ fontVariationSettings: "'wght' 200" }}>
                  {service.icon || 'photo_camera'}
                </span>
                <h3 className="font-display text-[24px] text-on-surface mb-3 leading-tight">
                  {service.title}
                </h3>
                <p className="font-body text-[16px] text-on-surface-variant leading-relaxed mb-6">{service.description}</p>
                {service.features && service.features.length > 0 && (
                  <ul className="space-y-2 mb-6">
                    {service.features.map(f => (
                      <li key={f} className="flex items-center gap-2 font-body text-[14px] text-on-surface-variant">
                        <span className="material-symbols-outlined text-[18px] text-tertiary">check_circle</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 text-tertiary font-body text-[14px] font-semibold hover:text-tertiary/80 transition-all"
                >
                  Inquire Now
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-[120px] bg-surface-container-low">
        <div className="max-w-4xl mx-auto px-5 md:px-16 text-center">
          <h2 className="font-display text-[32px] md:text-[48px] text-on-background mb-6 leading-tight">
            Need a Custom Package?
          </h2>
          <p className="font-body text-[16px] text-on-surface-variant mb-8 leading-relaxed">
            We offer customized packages tailored to your specific needs. Get in touch and let's discuss your requirements.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/contact"
              className="px-8 py-4 bg-on-background text-background font-body text-[14px] font-semibold tracking-[0.05em] rounded-sm btn-cinematic hover:bg-tertiary hover:text-on-tertiary flex items-center gap-2"
            >
              Get a Quote
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
            <a
              href="https://wa.me/?text=Hi%2C%20I%27m%20interested%20in%20your%20photography%20services."
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-surface-container text-on-surface-variant font-body text-[14px] font-semibold tracking-[0.05em] rounded-sm border border-outline-variant/30 hover:bg-surface-container-high flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
