import { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/common/SEO';
import { useTraining } from '../hooks/useTraining';

const highlights = [
  { icon: 'lightbulb', title: 'Practical Sessions', desc: 'Hands-on experience in studio and natural light environments. Build your portfolio while you learn under expert guidance.' },
  { icon: 'laptop_mac', title: 'Industry Software', desc: 'Master industry-standard tools including Adobe Lightroom, Photoshop, and Premiere Pro for a flawless post-production workflow.' },
  { icon: 'groups', title: 'Intimate Batches', desc: 'Limited batch sizes ensure personalized attention, detailed critique, and a collaborative learning environment.' },
];

const trainingBreadcrumbs = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.apoorvpatelphotography.com/' },
    { '@type': 'ListItem', position: 2, name: 'Training', item: 'https://www.apoorvpatelphotography.com/training' },
  ],
};

export default function Training() {
  const { courses, loading, error } = useTraining();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <main className="pt-[104px]">
      <SEO
        title="Photography & Editing Training Courses | Master Visual Storytelling — Apoorv Patel"
        description="Hands-on training courses in professional photography, cinematography, Adobe Lightroom, and video editing. Personalized coaching for aspiring visual storytellers."
        canonicalPath="/training"
        image="/images/real_work_dzvz4ssjoss.jpg"
        schema={trainingBreadcrumbs}
      />
      {/* Hero */}
      <section className="min-h-[716px] flex items-center px-5 md:px-16 py-[120px] max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 z-10 pr-0 lg:pr-12">
            <p className="font-body text-[12px] font-bold tracking-[0.2em] uppercase text-tertiary mb-6">Inspired by Innovation</p>
            <h1 className="font-display text-[32px] md:text-[72px] text-on-background mb-8 leading-[1.1] tracking-[-0.02em] font-semibold">
              Master the Art of Visual Storytelling.
            </h1>
            <p className="font-body text-[18px] text-on-surface-variant mb-12 max-w-2xl leading-relaxed">
              Elevate your craft with premium training in photography, videography, and post-production. Designed for creatives who demand technical precision and aesthetic excellence.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#courses" className="bg-on-background text-background font-body text-[14px] font-semibold tracking-[0.05em] px-8 py-4 btn-cinematic hover:bg-tertiary hover:text-on-tertiary rounded-sm">
                Explore Courses
              </a>
              <Link to="/contact" className="border border-outline-variant/30 text-on-background font-body text-[14px] font-semibold tracking-[0.05em] px-8 py-4 btn-cinematic hover:bg-surface-variant rounded-sm flex items-center gap-2">
                Enquire Now <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 relative mt-12 lg:mt-0">
            <div className="aspect-[4/5] bg-surface-container-low relative overflow-hidden rounded-sm group border border-outline-variant/10">
              <img
                src="/images/portfolio/wedding-collection/photo_04.webp"
                alt="Candid haldi ceremony close-up photographed by Apoorv Patel"
                loading="lazy"
                decoding="async"
                className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-[2s] ease-out opacity-80 group-hover:opacity-100"
              />
            </div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-tertiary/10 blur-[60px] rounded-full pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Curriculum Highlights */}
      <section className="px-5 md:px-16 py-[120px] max-w-[1440px] mx-auto bg-surface-dim">
        <div className="mb-16">
          <h2 className="font-display text-[32px] md:text-[48px] text-on-background mb-4 leading-tight">The Curriculum Edge</h2>
          <p className="font-body text-[18px] text-on-surface-variant max-w-xl leading-relaxed">Immersive learning designed for real-world application.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {highlights.map(h => (
            <div key={h.title} className="bg-surface-container-low p-10 border border-outline-variant/10 rounded-sm flex flex-col justify-between group hover:bg-surface-container transition-colors duration-500 min-h-[300px]">
              <span className="material-symbols-outlined text-[40px] text-tertiary mb-8" style={{ fontVariationSettings: "'wght' 200" }}>{h.icon}</span>
              <div>
                <h3 className="font-display text-[32px] text-on-background mb-4 leading-tight">{h.title}</h3>
                <p className="font-body text-[16px] text-on-surface-variant leading-relaxed">{h.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Courses */}
      <section id="courses" className="px-5 md:px-16 py-[120px] max-w-[1440px] mx-auto">
        <div className="mb-16">
          <h2 className="font-display text-[32px] md:text-[48px] text-on-background mb-4 leading-tight">Available Programs</h2>
          <p className="font-body text-[18px] text-on-surface-variant max-w-xl leading-relaxed">Select a discipline to begin your creative journey.</p>
        </div>
        {loading ? (
          <div className="text-center py-20">
            <p className="text-on-surface-variant">Loading courses...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20" role="alert">
            <p className="text-on-surface-variant text-lg">{error}</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-on-surface-variant text-lg">Training courses will be announced soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {courses.map(course => (
              <div key={course.id} className="bg-surface-container-lowest border border-outline-variant/10 rounded-sm overflow-hidden group">
                <div className="aspect-[16/9] relative overflow-hidden bg-surface-container">
                  <img
                    src={course.image}
                    alt={course.title}
                    loading="lazy"
                    decoding="async"
                    className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-[1.5s] ease-out opacity-70 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                    <span className="bg-surface-container-high/80 backdrop-blur-md px-3 py-1 font-body text-[10px] font-bold tracking-[0.15em] uppercase text-on-surface rounded-sm border border-outline-variant/20">
                      {course.level}
                    </span>
                    <span className="font-body text-[10px] font-bold tracking-[0.15em] uppercase text-on-surface">{course.duration}</span>
                  </div>
                </div>
                <div className="p-6 sm:p-8">
                  <h3 className="font-display text-[22px] sm:text-[32px] text-on-background mb-3 leading-tight">{course.title}</h3>
                  <p className="font-body text-[15px] sm:text-[16px] text-on-surface-variant mb-6 sm:mb-8 line-clamp-2 leading-relaxed">{course.description}</p>
                  {openId === course.id && (
                    <div id={`course-details-${course.id}`} className="mb-6 space-y-4 text-[15px] text-on-surface-variant border-t border-outline-variant/20 pt-5">
                      <p>{course.description}</p>
                      <dl className="grid grid-cols-2 gap-3 text-sm">
                        {course.duration && <div><dt className="text-[11px] uppercase tracking-wider text-tertiary font-semibold">Duration</dt><dd>{course.duration}</dd></div>}
                        {course.mode && <div><dt className="text-[11px] uppercase tracking-wider text-tertiary font-semibold">Mode</dt><dd>{course.mode}</dd></div>}
                        {course.level && <div><dt className="text-[11px] uppercase tracking-wider text-tertiary font-semibold">Level</dt><dd>{course.level}</dd></div>}
                        {course.fee && <div><dt className="text-[11px] uppercase tracking-wider text-tertiary font-semibold">Fee</dt><dd>{course.fee}</dd></div>}
                      </dl>
                      {course.curriculum.length > 0 && (
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-tertiary font-semibold mb-2">What you'll learn</p>
                          <ul className="list-disc pl-5 space-y-1">{course.curriculum.map(item => <li key={item}>{item}</li>)}</ul>
                        </div>
                      )}
                      {course.tools.length > 0 && (
                        <p><span className="text-[11px] uppercase tracking-wider text-tertiary font-semibold">Tools: </span>{course.tools.join(', ')}</p>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <Link to={`/contact?service=${encodeURIComponent('Training')}&course=${encodeURIComponent(course.title)}`} className="bg-on-background text-background font-body text-[14px] font-semibold tracking-[0.05em] px-6 py-3 btn-cinematic hover:bg-tertiary hover:text-on-tertiary rounded-sm flex-1 text-center">
                      Enquire
                    </Link>
                    <button
                      type="button"
                      onClick={() => setOpenId(id => (id === course.id ? null : course.id))}
                      aria-expanded={openId === course.id}
                      aria-controls={`course-details-${course.id}`}
                      className="border border-outline-variant/30 text-on-background font-body text-[14px] font-semibold tracking-[0.05em] px-6 py-3 btn-cinematic hover:bg-surface-variant rounded-sm flex-1 text-center cursor-pointer"
                    >
                      {openId === course.id ? 'Hide Details' : 'View Details'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Testimonial */}
      <section className="px-5 md:px-16 py-[120px] max-w-[1440px] mx-auto border-t border-outline-variant/10 text-center">
        <p className="font-body text-[12px] font-bold tracking-[0.2em] uppercase text-tertiary mb-12">What Our Students Say</p>
        <div className="max-w-4xl mx-auto">
          <span className="material-symbols-outlined text-[64px] text-surface-variant mb-8 block opacity-50">format_quote</span>
          <p className="font-display text-[24px] md:text-[32px] text-on-surface leading-relaxed mb-10 italic">
            "The practical approach to lighting and composition completely transformed my portfolio. It wasn't just about learning the settings; it was about learning how to see light."
          </p>
          <p className="font-body text-[12px] font-bold tracking-[0.15em] uppercase text-on-background mb-1">Photography Training Alumni</p>
          <p className="font-body text-[14px] text-on-surface-variant">2024 Batch</p>
        </div>
      </section>
    </main>
  );
}
