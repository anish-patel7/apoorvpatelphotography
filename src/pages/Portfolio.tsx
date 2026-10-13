import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Star, ArrowUpRight } from 'lucide-react';
import InstagramIcon from '../components/icons/InstagramIcon';
import SEO from '../components/common/SEO';
import { usePortfolio } from '../hooks/usePortfolio';

const portfolioCategories = [
  'All',
  'Wedding',
  'Engagement',
  'Pre-Wedding',
  'Baby Shower',
  'Maternity',
  'Family',
  'Personal',
  'Videography',
  'Photo Editing',
  'Video Editing',
] as const;

const portfolioBreadcrumbs = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.apoorvpatelphotography.com/' },
    { '@type': 'ListItem', position: 2, name: 'Portfolio', item: 'https://www.apoorvpatelphotography.com/portfolio' },
  ],
};

export default function Portfolio() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const { projects, loading } = usePortfolio(activeCategory === 'All' ? undefined : activeCategory);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const gridSpans = [
    'md:col-span-8 row-span-1',
    'md:col-span-4 md:row-span-2',
    'md:col-span-4 row-span-1',
    'md:col-span-4 row-span-1',
    'md:col-span-6 row-span-1',
    'md:col-span-6 row-span-1',
    'md:col-span-12 row-span-1',
    'md:col-span-4 row-span-1',
  ];

  return (
    <main className="flex-grow pt-[120px]">
      <SEO
        title="Photography Portfolio | Weddings, Pre-Weddings & Portraits — Apoorv Patel"
        description="Explore authentic wedding ceremonies, pre-wedding shoots, engagements, and portraits captured with artistic composition and cinematic depth across India and the UK."
        canonicalPath="/portfolio"
        image="/images/real_work_dzvz4ssjoss.jpg"
        schema={portfolioBreadcrumbs}
      />
      <header className="px-5 md:px-16 py-[120px] max-w-[1440px] mx-auto text-center">
        <h1 className="font-display text-[40px] md:text-[72px] text-on-background mb-6 leading-[1.1] tracking-[-0.02em] font-semibold">
          Our Portfolio
        </h1>
        <p className="font-body text-[18px] text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
          A curated collection of moments, framed with precision and inspired by innovation. Explore our visual stories across various disciplines.
        </p>
      </header>

      <section className="px-5 md:px-16 mb-16 max-w-[1440px] mx-auto overflow-x-auto">
        <div className="flex space-x-8 font-body text-[12px] font-bold tracking-[0.15em] uppercase text-on-surface-variant min-w-max pb-2">
          {portfolioCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`pb-2 transition-colors ${
                activeCategory === cat
                  ? 'text-on-surface border-b-2 border-tertiary'
                  : 'hover:text-on-surface'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      <section className="px-5 md:px-16 pb-[120px] max-w-[1440px] mx-auto">
        {loading ? (
          <div className="text-center py-20">
            <p className="text-on-surface-variant">Loading portfolio...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-on-surface-variant text-lg">No portfolio projects available yet.</p>
            <p className="text-on-surface-variant text-sm mt-2">Check back soon for our latest work!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 auto-rows-[300px] md:auto-rows-[400px]">
            {projects.map((project, i) => {
              const hasInstagram = !!(project.instagram_url || project.video_url || project.reel_url);
              const isReel = project.content_type === 'reel';

              return (
                <Link
                  key={project.id}
                  to={`/portfolio/${project.id}`}
                  className={`${gridSpans[i % gridSpans.length]} relative group cursor-pointer overflow-hidden rounded-lg bg-surface-container border border-outline-variant/20 block`}
                >
                  <img
                    src={project.cover_image}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading={i === 0 ? 'eager' : 'lazy'}
                    fetchPriority={i === 0 ? 'high' : 'auto'}
                    decoding="async"
                  />

                  {/* Top badges (Real Work, Featured, Reel, or Instagram) */}
                  <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
                    <div className="flex flex-wrap items-center gap-2">
                      {project.is_real_work && (
                        <span className="px-2.5 py-1 bg-black/80 backdrop-blur-md text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-full border border-emerald-500/40 flex items-center gap-1 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Real Work
                        </span>
                      )}
                      {project.featured && !project.is_real_work && (
                        <span className="px-2.5 py-1 bg-black/70 backdrop-blur-md text-tertiary text-[10px] font-bold uppercase tracking-wider rounded-full border border-tertiary/40 flex items-center gap-1 shadow-sm">
                          <Star size={10} fill="currentColor" /> Featured
                        </span>
                      )}
                      {isReel && (
                        <span className="px-2.5 py-1 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-full border border-white/20 flex items-center gap-1 shadow-sm">
                          <Play size={10} fill="white" /> Reel
                        </span>
                      )}
                      {hasInstagram && !isReel && (
                        <span className="px-2.5 py-1 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-full border border-white/20 flex items-center gap-1 shadow-sm">
                          <InstagramIcon size={11} /> Instagram Post
                        </span>
                      )}
                    </div>

                    <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md text-white/80 group-hover:text-tertiary group-hover:bg-black/75 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 duration-300">
                      <ArrowUpRight size={14} />
                    </div>
                  </div>

                  <div className="absolute inset-0 gallery-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-5 sm:p-8">
                    <span className="font-body text-[11px] sm:text-[12px] font-bold tracking-[0.15em] uppercase text-tertiary mb-1.5 sm:mb-2">
                      {project.category}
                    </span>
                    <h3 className="font-display text-[20px] sm:text-[26px] md:text-[32px] text-on-background leading-tight mb-2">
                      {project.title}
                    </h3>
                    <p className="text-on-surface-variant text-xs line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="py-[120px] bg-surface-container-low text-center px-5">
        <h2 className="font-display text-[32px] md:text-[48px] text-on-background mb-8 leading-tight">
          Ready for your own shoot?
        </h2>
        <Link
          to="/contact"
          className="inline-block bg-on-background text-background font-body text-[14px] font-semibold tracking-[0.05em] px-8 py-4 rounded-sm btn-cinematic hover:bg-tertiary-fixed hover:text-on-tertiary"
        >
          Get a Quote
        </Link>
      </section>
    </main>
  );
}
