import { Link } from 'react-router-dom';
import { Camera, Video, Palette, GraduationCap, MapPin, ArrowRight } from 'lucide-react';
import InstagramIcon from '../components/icons/InstagramIcon';

export default function About() {
  return (
    <>
      <section className="pt-32 pb-20 bg-brand-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-brand-saffron text-sm font-semibold tracking-widest uppercase mb-3">About Us</p>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                Apoorvpatel<br />
                <span className="text-brand-saffron">Photography</span>
              </h1>
              <p className="font-script text-2xl text-brand-gold mb-6">"inspired by innovation"</p>
              <p className="text-white/60 leading-relaxed mb-6">
                Apoorvpatel Photography is a professional creative studio offering photography,
                videography, photo/video editing, Instagram/Reel content creation, and
                photography/video editing training.
              </p>
              <p className="text-white/60 leading-relaxed mb-6">
                With a presence in both India and the United Kingdom, we bring a unique blend of
                cultural richness and modern creativity to every project. Our philosophy is rooted
                in the belief that every moment deserves to be captured with artistry, care, and
                an innovative approach.
              </p>
              <p className="text-white/60 leading-relaxed mb-8">
                Whether it's a grand wedding celebration, an intimate portrait session, a cinematic
                film, professional editing, or helping aspiring photographers learn the craft — we
                pour our heart and passion into every project.
              </p>

              <div className="flex items-center gap-2 text-white/50 text-sm mb-6">
                <MapPin size={16} className="text-brand-saffron" />
                <span>India</span>
                <span className="mx-1">|</span>
                <span>United Kingdom</span>
              </div>

              <div className="flex items-center gap-1 mb-8">
                <div className="h-1 w-10 bg-brand-saffron rounded"></div>
                <div className="h-1 w-10 bg-white rounded"></div>
                <div className="h-1 w-10 bg-brand-green rounded"></div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=800&q=80"
                  alt="Professional photographer at work"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-brand-charcoal border border-white/10 rounded-2xl p-6 shadow-2xl hidden lg:block">
                <img src="/images/logo.png" alt="AP Logo" className="h-20 w-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-brand-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">What We Do</h2>
            <p className="text-white/50 max-w-xl mx-auto">
              A full suite of creative services to capture, create, and teach.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Camera, title: 'Photography', desc: 'Weddings, events, portraits, couple, family, maternity, and personal photography across India and the UK.' },
              { icon: Video, title: 'Videography', desc: 'Cinematic wedding films, event coverage, highlight reels, social media videos, and Instagram Reels.' },
              { icon: Palette, title: 'Editing', desc: 'Photo retouching, color correction, album design, video editing, reel editing, and creative editing.' },
              { icon: GraduationCap, title: 'Training', desc: 'Comprehensive courses in photography, videography, photo editing, and video editing for all levels.' },
            ].map(item => (
              <div key={item.title} className="text-center p-6 rounded-2xl border border-white/5 hover:border-brand-saffron/20 transition-colors">
                <item.icon size={40} className="text-brand-saffron mx-auto mb-4" />
                <h3 className="font-heading text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-brand-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">Our Approach</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Understand', desc: 'We listen to your vision, understand your needs, and plan every detail to deliver exactly what you imagine.' },
              { step: '02', title: 'Create', desc: 'With artistic precision and innovative techniques, we capture and create content that tells your story beautifully.' },
              { step: '03', title: 'Deliver', desc: 'We refine every image and video to perfection and deliver a polished product that exceeds expectations.' },
            ].map(item => (
              <div key={item.step} className="relative p-8 rounded-2xl border border-white/5">
                <span className="text-6xl font-bold text-brand-saffron/10 absolute top-4 right-6">{item.step}</span>
                <h3 className="font-heading text-xl font-semibold mb-3 relative z-10">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed relative z-10">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-brand-charcoal">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">Let's Work Together</h2>
          <p className="text-white/50 mb-8">
            Ready to create something beautiful? Get in touch and let's discuss your project.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/contact" className="px-8 py-3.5 bg-brand-saffron text-black font-semibold rounded-full hover:bg-brand-gold transition-colors flex items-center gap-2">
              Get in Touch <ArrowRight size={18} />
            </Link>
            <a
              href="https://www.instagram.com/apoorvpatel_photography/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 border-2 border-white/30 text-white font-semibold rounded-full hover:border-brand-saffron hover:text-brand-saffron transition-all flex items-center gap-2"
            >
              <InstagramIcon size={18} /> Follow Us
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
