import { Link } from 'react-router-dom';

const services = [
  {
    icon: 'camera',
    title: 'Photography',
    description: 'Capturing fleeting moments with precision and artistic vision. From high-fashion editorial to intimate portraits.',
  },
  {
    icon: 'videocam',
    title: 'Videography',
    description: 'Cinematic storytelling that moves. We craft visual narratives with high-end equipment and dramatic composition.',
  },
  {
    icon: 'edit',
    title: 'Post-Production',
    description: 'Meticulous color grading and retouching to ensure every final piece meets the standard of a high-end gallery.',
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {services.map((service, i) => (
          <Link
            key={service.title}
            to="/services"
            className={`${i % 2 === 0 ? 'bg-surface-container-low' : 'bg-surface-container'} p-10 flex flex-col items-center text-center rounded-lg border border-white/10 hover:-translate-y-2 transition-transform duration-500`}
          >
            <span
              className="material-symbols-outlined text-[48px] text-tertiary mb-6"
              style={{ fontVariationSettings: "'wght' 200" }}
            >
              {service.icon}
            </span>
            <h3 className="font-display text-[32px] text-on-surface mb-4 leading-tight">
              {service.title}
            </h3>
            <p className="font-body text-[16px] text-on-surface-variant leading-relaxed">
              {service.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
