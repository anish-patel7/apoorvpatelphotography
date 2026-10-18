import { Link } from 'react-router-dom';
import SEO from '../components/common/SEO';

const aboutBreadcrumbs = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.apoorvpatelphotography.com/' },
    { '@type': 'ListItem', position: 2, name: 'About', item: 'https://www.apoorvpatelphotography.com/about' },
  ],
};

export default function About() {
  return (
    <main className="pt-[104px]">
      <SEO
        title="About Apoorv Patel | UK-Based Photography & Creative Design"
        description="Meet Apoorv Patel, founder of Apoorv Patel Photography. A UK-based creative studio specializing in luxury wedding photography, cinematic videography, multimedia design, and graphic design."
        canonicalPath="/about"
        image="/images/logo.png"
        schema={aboutBreadcrumbs}
      />
      {/* Hero */}
      <section className="px-5 md:px-16 py-[120px] max-w-[1440px] mx-auto overflow-x-clip">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <p className="font-body text-[12px] font-bold tracking-[0.2em] uppercase text-tertiary mb-6">About Us</p>
            <h1 className="font-display text-[40px] md:text-[72px] text-on-background mb-6 leading-[1.1] tracking-[-0.02em] font-semibold">
              Apoorvpatel<br />
              <span className="text-tertiary">Photography</span>
            </h1>
            <p className="font-body text-[18px] text-on-surface-variant italic mb-8 tracking-wide">
              "inspired by innovation"
            </p>
            <p className="font-body text-[16px] text-on-surface-variant leading-relaxed mb-6">
              Apoorv Patel Photography is a UK-based creative studio offering luxury wedding
              and portrait photography, cinematic videography, multimedia design, graphic design,
              and post-production creative services.
            </p>
            <p className="font-body text-[16px] text-on-surface-variant leading-relaxed mb-6">
              Based in the United Kingdom, we bring an innovative approach and contemporary
              visual aesthetics to every project. Our philosophy is rooted in the belief that every
              story deserves to be captured with artistry, precision, and heartfelt emotion.
            </p>
            <p className="font-body text-[16px] text-on-surface-variant leading-relaxed mb-8">
              Whether it's a grand wedding celebration, an intimate portrait session, a cinematic
              visual film, dynamic multimedia content, or brand graphic design — we pour our heart
              and passion into every frame.
            </p>

            <div className="flex items-center gap-2 text-on-surface-variant text-sm mb-6">
              <span className="material-symbols-outlined text-tertiary text-[16px]">location_on</span>
              <span>United Kingdom</span>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/5] rounded-sm overflow-hidden border border-outline-variant/10">
              <img
                src="/images/portfolio/engagement-session/photo_10.webp"
                alt="Low-light engagement ring detail photographed by Apoorv Patel"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-700"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-surface-container border border-outline-variant/10 rounded-sm p-6 shadow-2xl hidden lg:block">
              <picture>
                <source srcSet="/images/logo.webp" type="image/webp" />
                <img
                  src="/images/logo.png"
                  alt="Apoorvpatel Photography Logo"
                  className="h-20 w-auto"
                  width="120"
                  height="80"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            </div>
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-tertiary/10 blur-[60px] rounded-full pointer-events-none" />
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-[120px] bg-surface-container-low">
        <div className="max-w-[1440px] mx-auto px-5 md:px-16">
          <div className="text-center mb-16">
            <h2 className="font-display text-[32px] md:text-[48px] text-on-background mb-4 leading-tight">What We Do</h2>
            <p className="font-body text-[16px] text-on-surface-variant max-w-xl mx-auto leading-relaxed">
              A comprehensive suite of photography and creative design solutions.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: 'camera', title: 'Photography', desc: 'Weddings, celebrations, portraits, couple, family, and personal photography crafted with artistic vision.' },
              { icon: 'videocam', title: 'Videography', desc: 'Cinematic wedding films, event highlights, social media reels, and high-impact visual storytelling.' },
              { icon: 'movie_filter', title: 'Multimedia Design', desc: 'Creative multimedia solutions including video editing, motion graphics, digital content creation and visual storytelling.' },
              { icon: 'palette', title: 'Graphic Design', desc: 'Professional graphic design for branding, promotional materials, social media creatives and digital visual communication.' },
              { icon: 'edit', title: 'Post-Production', desc: 'High-end photo retouching, color grading, album curation, and creative digital finishing.' },
              { icon: 'school', title: 'Training & Mentorship', desc: 'Specialized courses in photography techniques, cinematic videography, and post-production workflows.' },
            ].map(item => (
              <div key={item.title} className="text-center p-8 rounded-sm border border-outline-variant/10 hover:bg-surface-container transition-colors duration-500">
                <span className="material-symbols-outlined text-[40px] text-tertiary mb-4 block" style={{ fontVariationSettings: "'wght' 200" }}>{item.icon}</span>
                <h3 className="font-display text-[24px] text-on-surface mb-3 leading-tight">{item.title}</h3>
                <p className="font-body text-[14px] text-on-surface-variant leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section className="py-[120px]">
        <div className="max-w-[1440px] mx-auto px-5 md:px-16">
          <div className="text-center mb-16">
            <h2 className="font-display text-[32px] md:text-[48px] text-on-background mb-4 leading-tight">Our Approach</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Understand', desc: 'We listen to your vision, understand your needs, and plan every detail to deliver exactly what you imagine.' },
              { step: '02', title: 'Create', desc: 'With artistic precision and innovative techniques, we capture and create content that tells your story beautifully.' },
              { step: '03', title: 'Deliver', desc: 'We refine every image and video to perfection and deliver a polished product that exceeds expectations.' },
            ].map(item => (
              <div key={item.step} className="relative p-10 rounded-sm border border-outline-variant/10 hover:bg-surface-container-low transition-colors duration-500">
                <span className="text-[72px] font-display font-bold text-tertiary/10 absolute top-4 right-6">{item.step}</span>
                <h3 className="font-display text-[24px] text-on-surface mb-4 relative z-10 leading-tight">{item.title}</h3>
                <p className="font-body text-[16px] text-on-surface-variant relative z-10 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-[120px] bg-surface-container-low">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <h2 className="font-display text-[32px] md:text-[48px] text-on-background mb-4 leading-tight">Let's Work Together</h2>
          <p className="font-body text-[16px] text-on-surface-variant mb-8 leading-relaxed">
            Ready to create something beautiful? Get in touch and let's discuss your project.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/contact" className="bg-on-background text-background font-body text-[14px] font-semibold tracking-[0.05em] px-8 py-4 btn-cinematic hover:bg-tertiary hover:text-on-tertiary rounded-sm flex items-center gap-2">
              Get in Touch <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
            <a
              href="https://www.instagram.com/apoorvpatel_photography/"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-outline-variant/30 text-on-background font-body text-[14px] font-semibold tracking-[0.05em] px-8 py-4 btn-cinematic hover:bg-surface-variant rounded-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">photo_camera</span> Follow Us
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
