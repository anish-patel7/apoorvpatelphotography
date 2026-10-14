import { Link } from 'react-router-dom';

const services = [
  {
    icon: 'camera',
    title: 'Photography',
    description: 'Capturing fleeting moments with precision and artistic vision. From luxury weddings to timeless portraits.',
    link: '/services?tab=photography',
  },
  {
    icon: 'videocam',
    title: 'Videography',
    description: 'Cinematic storytelling that moves. We craft visual narratives with high-end equipment and dramatic composition.',
    link: '/services?tab=videography',
  },
  {
    icon: 'movie_filter',
    title: 'Multimedia Design',
    description: 'Creative multimedia solutions including video editing, motion graphics, digital content creation and visual storytelling.',
    link: '/services?tab=multimedia',
  },
  {
    icon: 'palette',
    title: 'Graphic Design',
    description: 'Professional graphic design for branding, promotional materials, social media creatives and digital visual communication.',
    link: '/services?tab=design',
  },
  {
    icon: 'edit',
    title: 'Post-Production',
    description: 'Meticulous color grading and retouching to ensure every final piece meets the standard of a high-end gallery.',
    link: '/services?tab=editing',
  },
];

export default function ServicesOverview() {
  return (
    <section className="fade-in">
      <div className="flex flex-col items-center mb-16 text-center">
        <h2 className="font-display text-[32px] md:text-[48px] text-on-background mb-4 leading-tight">
          Our Expertise
        </h2>
        <div className="w-16 h-[2px] bg-tertiary" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 items-stretch">
        {services.map((service, i) => (
          <Link
            key={service.title}
            to={service.link}
            className={`${i % 2 === 0 ? 'bg-surface-container-low' : 'bg-surface-container'} p-8 md:p-10 flex flex-col items-center text-center rounded-lg border border-outline-variant/30 hover:-translate-y-2 transition-transform duration-500 h-full group`}
          >
            <span
              className="material-symbols-outlined text-[48px] text-tertiary mb-6 group-hover:scale-110 transition-transform duration-300"
              style={{ fontVariationSettings: "'wght' 200" }}
            >
              {service.icon}
            </span>
            <h3 className="font-display text-[26px] xl:text-[28px] text-on-surface mb-4 leading-snug">
              {service.title}
            </h3>
            <p className="font-body text-[15px] text-on-surface-variant leading-relaxed">
              {service.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
