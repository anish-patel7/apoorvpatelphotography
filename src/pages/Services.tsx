import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Heart,
  Sparkles,
  Camera,
  Baby,
  PartyPopper,
  Users,
  HeartHandshake,
  User,
  Film,
  Video,
  Share2,
  Palette,
  Clapperboard,
  Wand2,
  Layers,
  Brush,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react';
import SEO from '../components/common/SEO';
import { useServices } from '../hooks/useServices';

const iconMap: Record<string, LucideIcon> = {
  Heart,
  Sparkles,
  Camera,
  Baby,
  PartyPopper,
  Users,
  HeartHandshake,
  User,
  Film,
  Video,
  Instagram: Share2,
  Palette,
  Clapperboard,
  Wand: Wand2,
  Wand2,
  Layers,
  Brush,
};

const serviceCategories = [
  { id: 'photography', label: 'Photography', icon: Camera },
  { id: 'videography', label: 'Videography', icon: Video },
  { id: 'multimedia', label: 'Multimedia Design', icon: Film },
  { id: 'design', label: 'Graphic Design', icon: Palette },
  { id: 'editing', label: 'Editing', icon: Clapperboard },
];

const servicesBreadcrumbs = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.apoorvpatelphotography.com/' },
    { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://www.apoorvpatelphotography.com/services' },
  ],
};

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const initialTab = serviceCategories.some(c => c.id === requestedTab) ? (requestedTab as string) : 'photography';

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const { services, loading } = useServices(activeTab);

  useEffect(() => {
    if (requestedTab && serviceCategories.some(c => c.id === requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [requestedTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  return (
    <main className="pt-[104px]">
      <SEO
        title="Photography, Multimedia & Graphic Design Services | Apoorv Patel"
        description="Comprehensive wedding photography, cinematic videography, multimedia design, graphic design, and post-production creative services based in the United Kingdom."
        canonicalPath="/services"
        image="/images/real_work_dzvz4ssjoss.jpg"
        schema={servicesBreadcrumbs}
      />
      <section className="px-5 md:px-16 py-[120px] max-w-[1440px] mx-auto">
        <div className="text-center mb-16">
          <p className="font-body text-[12px] font-bold tracking-[0.2em] uppercase text-tertiary mb-6">What We Offer</p>
          <h1 className="font-display text-[40px] md:text-[72px] text-on-background mb-6 leading-[1.1] tracking-[-0.02em] font-semibold">
            Our Services
          </h1>
          <p className="font-body text-[18px] text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            From capturing your timeless moments to designing bespoke digital graphics and cinematic visuals — we offer full-spectrum creative services based in the UK.
          </p>
        </div>

        <div className="flex justify-center gap-3 mb-16 flex-wrap">
          {serviceCategories.map(cat => {
            const CatIcon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => handleTabChange(cat.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-sm font-body text-[14px] font-semibold tracking-[0.05em] transition-all cursor-pointer ${
                  activeTab === cat.id
                    ? 'bg-tertiary text-on-tertiary border-b-2 border-tertiary shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <CatIcon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="px-5 md:px-16 pb-[120px] max-w-[1440px] mx-auto">
        {loading ? (
          <div className="text-center py-20">
            <p className="text-on-surface-variant">Loading services...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-on-surface-variant text-lg">No services currently listed for this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map(service => {
              const IconComp = iconMap[service.icon] || Camera;
              return (
                <div
                  key={service.id}
                  id={service.slug || service.id}
                  className="group bg-surface-container-low rounded-sm p-8 border border-outline-variant/10 hover:bg-surface-container transition-colors duration-300 flex flex-col justify-between"
                >
                  <div>
                    <IconComp className="w-10 h-10 text-tertiary mb-4" strokeWidth={1.5} />
                    <h3 className="font-display text-[24px] text-on-surface mb-3 leading-tight">
                      {service.title}
                    </h3>
                    <p className="font-body text-[16px] text-on-surface-variant leading-relaxed mb-6">{service.description}</p>
                    {service.features && service.features.length > 0 && (
                      <ul className="space-y-2 mb-6">
                        {service.features.map((f: string) => (
                          <li key={f} className="flex items-center gap-2 font-body text-[14px] text-on-surface-variant">
                            <CheckCircle className="w-4 h-4 text-tertiary flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <Link
                    to={`/contact?service=${encodeURIComponent(service.title)}`}
                    className="inline-flex items-center gap-2 text-tertiary font-body text-[14px] font-semibold hover:text-tertiary/80 transition-all pt-2"
                  >
                    Inquire Now
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
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
