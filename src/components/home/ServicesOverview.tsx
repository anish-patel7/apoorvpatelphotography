import { Link } from 'react-router-dom';
import { Camera, Video, Palette, ArrowRight } from 'lucide-react';

const serviceCards = [
  {
    icon: Camera,
    title: 'Photography',
    description: 'Weddings, engagements, pre-wedding, maternity, portraits, birthdays & family events.',
    color: 'from-brand-saffron/20 to-brand-saffron/5',
    borderColor: 'border-brand-saffron/20',
    iconColor: 'text-brand-saffron',
  },
  {
    icon: Video,
    title: 'Videography',
    description: 'Cinematic wedding films, event coverage, highlight reels & social media videos.',
    color: 'from-brand-green/20 to-brand-green/5',
    borderColor: 'border-brand-green/20',
    iconColor: 'text-brand-green',
  },
  {
    icon: Palette,
    title: 'Editing',
    description: 'Photo retouching, color correction, album design, video editing & reel editing.',
    color: 'from-brand-gold/20 to-brand-gold/5',
    borderColor: 'border-brand-gold/20',
    iconColor: 'text-brand-gold',
  },
];

export default function ServicesOverview() {
  return (
    <section className="py-20 sm:py-28 bg-brand-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-brand-saffron text-sm font-semibold tracking-widest uppercase mb-3">What We Offer</p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Our Services</h2>
          <p className="text-white/50 max-w-2xl mx-auto">
            From capturing your precious moments to transforming them into timeless art — we offer end-to-end creative services.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {serviceCards.map(card => (
            <Link
              to="/services"
              key={card.title}
              className={`group relative bg-gradient-to-br ${card.color} border ${card.borderColor} rounded-2xl p-8 hover:scale-[1.02] transition-all duration-300`}
            >
              <card.icon size={48} className={`${card.iconColor} mb-6`} />
              <h3 className="font-heading text-2xl font-semibold mb-3">{card.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed mb-6">{card.description}</p>
              <span className={`inline-flex items-center gap-1 text-sm font-medium ${card.iconColor} group-hover:gap-2 transition-all`}>
                Explore <ArrowRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
