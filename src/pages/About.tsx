import { Link } from 'react-router-dom';

export default function About() {
  return (
    <main className="pt-[104px]">
      {/* Hero */}
      <section className="px-5 md:px-16 py-[120px] max-w-[1440px] mx-auto">
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
              Apoorvpatel Photography is a professional creative studio offering photography,
              videography, photo/video editing, Instagram/Reel content creation, and
              photography/video editing training.
            </p>
            <p className="font-body text-[16px] text-on-surface-variant leading-relaxed mb-6">
              With a presence in both India and the United Kingdom, we bring a unique blend of
              cultural richness and modern creativity to every project. Our philosophy is rooted
              in the belief that every moment deserves to be captured with artistry, care, and
              an innovative approach.
            </p>
            <p className="font-body text-[16px] text-on-surface-variant leading-relaxed mb-8">
              Whether it's a grand wedding celebration, an intimate portrait session, a cinematic
              film, professional editing, or helping aspiring photographers learn the craft — we
              pour our heart and passion into every project.
            </p>

            <div className="flex items-center gap-2 text-on-surface-variant text-sm mb-6">
              <span className="material-symbols-outlined text-tertiary text-[16px]">location_on</span>
              <span>India</span>
              <span className="mx-1">|</span>
              <span>United Kingdom</span>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/5] rounded-sm overflow-hidden border border-outline-variant/10">
              <img
                src="https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=800&q=80"
                alt="Professional photographer at work"
                className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-700"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-surface-container border border-outline-variant/10 rounded-sm p-6 shadow-2xl hidden lg:block">
              <img src="/images/logo.png" alt="AP Logo" className="h-20 w-auto" />
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
              A full suite of creative services to capture, create, and teach.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: 'camera', title: 'Photography', desc: 'Weddings, events, portraits, couple, family, maternity, and personal photography across India and the UK.' },
              { icon: 'videocam', title: 'Videography', desc: 'Cinematic wedding films, event coverage, highlight reels, social media videos, and Instagram Reels.' },
              { icon: 'edit', title: 'Editing', desc: 'Photo retouching, color correction, album design, video editing, reel editing, and creative editing.' },
              { icon: 'school', title: 'Training', desc: 'Comprehensive courses in photography, videography, photo editing, and video editing for all levels.' },
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
