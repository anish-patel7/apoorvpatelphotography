import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Star, ArrowUpRight, Grid, LayoutGrid, X, ChevronLeft, ChevronRight, Maximize2, Globe } from 'lucide-react';
import InstagramIcon from '../components/icons/InstagramIcon';
import SEO from '../components/common/SEO';
import { usePortfolio, usePortfolioCategories, filterProjectsByCategory, getProjectCover } from '../hooks/usePortfolio';

const portfolioBreadcrumbs = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.apoorvpatelphotography.com/' },
    { '@type': 'ListItem', position: 2, name: 'Portfolio', item: 'https://www.apoorvpatelphotography.com/portfolio' },
  ],
};

interface GalleryItem {
  kind: 'image' | 'video' | 'link';
  url: string;
  poster?: string | null;
  title: string;
  category: string;
  projectId: string;
  projectPath: string;
  index: number;
  /** Link tiles only: what kind of work the link points to. */
  linkType?: 'instagram' | 'website';
}

export default function Portfolio() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'photos' | 'projects'>('photos');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const navigate = useNavigate();
  const { categories } = usePortfolioCategories();

  // One request for every published project; "All" and each category tab are views of the same list.
  const { allProjects, loading, error } = usePortfolio();
  const projects = useMemo(() => filterProjectsByCategory(allProjects, activeCategory), [allProjects, activeCategory]);

  // Tabs come from the categories managed in the admin; any category used by published
  // work but missing from that list is still shown so nothing becomes unreachable.
  const categoryTabs = useMemo(() => {
    const names = categories.filter(c => c.is_active).map(c => c.name);
    const known = new Set(names.map(n => n.toLowerCase()));
    const extra = Array.from(new Set(allProjects.map(p => p.category).filter(c => c && !known.has(c.toLowerCase()))));
    return ['All', ...names, ...extra];
  }, [categories, allProjects]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [projects, viewMode]);

  // Flatten every photo/video across the visible projects; link-only work gets a tile too.
  const allPhotos: GalleryItem[] = useMemo(() => {
    const items: GalleryItem[] = [];
    for (const project of projects) {
      const base = { title: project.display_title, category: project.category, projectId: project.id, projectPath: `/portfolio/${project.slug || project.id}` };
      if (project.media.length === 0) {
        items.push({ ...base, kind: 'link', url: getProjectCover(project), index: 0, linkType: project.instagram_url ? 'instagram' : 'website' });
        continue;
      }
      project.media.forEach((m, idx) => items.push({ ...base, kind: m.type, url: m.url, poster: m.poster, index: idx }));
    }
    return items;
  }, [projects]);

  // The lightbox steps through photos and videos only.
  const viewerItems = useMemo(() => allPhotos.filter(i => i.kind !== 'link'), [allPhotos]);
  const openItem = (item: GalleryItem) => {
    if (item.kind === 'link') navigate(item.projectPath);
    else setLightboxIndex(viewerItems.indexOf(item));
  };

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
        title="Portfolio | UK Wedding Photography & Creative Design — Apoorv Patel"
        description="Explore authentic wedding ceremonies, pre-wedding shoots, candid engagement sessions, and baby shower celebrations by Apoorv Patel Photography."
        canonicalPath="/portfolio"
        image="/images/portfolio/wedding-collection/photo_01.webp"
        schema={portfolioBreadcrumbs}
      />
      <header className="px-5 md:px-16 py-[80px] md:py-[100px] max-w-[1440px] mx-auto text-center">
        <h1 className="font-display text-[40px] md:text-[72px] text-on-background mb-6 leading-[1.1] tracking-[-0.02em] font-semibold">
          Our Portfolio
        </h1>
        <p className="font-body text-[18px] text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
          A curated collection of timeless moments, framed with precision and inspired by emotional authenticity.
        </p>

        {/* View mode toggle */}
        <div className="mt-8 flex justify-center items-center gap-3">
          <div className="inline-flex p-1 bg-surface-container rounded-lg border border-outline-variant/30">
            <button
              onClick={() => setViewMode('photos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold tracking-wider uppercase transition-all ${
                viewMode === 'photos'
                  ? 'bg-tertiary text-background shadow-md'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Grid size={14} /> All Photos ({allPhotos.length})
            </button>
            <button
              onClick={() => setViewMode('projects')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold tracking-wider uppercase transition-all ${
                viewMode === 'projects'
                  ? 'bg-tertiary text-background shadow-md'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <LayoutGrid size={14} /> Projects ({projects.length})
            </button>
          </div>
        </div>
      </header>

      {/* Category filter tabs */}
      <section className="px-5 md:px-16 mb-12 max-w-[1440px] mx-auto overflow-x-auto">
        <div className="flex space-x-6 md:space-x-8 font-body text-[12px] font-bold tracking-[0.15em] uppercase text-on-surface-variant min-w-max pb-2 border-b border-outline-variant/20">
          {categoryTabs.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`pb-3 transition-colors cursor-pointer ${
                activeCategory === cat
                  ? 'text-on-surface border-b-2 border-tertiary -mb-[1px]'
                  : 'hover:text-on-surface'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Main Gallery Area */}
      <section className="px-5 md:px-16 pb-[120px] max-w-[1440px] mx-auto">
        {loading ? (
          <div className="text-center py-20">
            <p className="text-on-surface-variant">Loading portfolio...</p>
          </div>
        ) : error && allProjects.length === 0 ? (
          <div className="text-center py-20" role="alert">
            <p className="text-on-surface-variant text-lg">{error}</p>
          </div>
        ) : viewMode === 'photos' ? (
          /* ================= Direct Photo Grid ================= */
          allPhotos.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-on-surface-variant text-lg">No photographs available in this category yet.</p>
              <p className="text-on-surface-variant text-sm mt-2">Try selecting "All" to view all available work.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {allPhotos.map((photo, i) => (
                <div
                  key={`${photo.projectId}-${photo.index}`}
                  onClick={() => openItem(photo)}
                  className="group relative cursor-pointer overflow-hidden rounded-lg bg-surface-container border border-outline-variant/20 aspect-[3/4] sm:aspect-square md:aspect-[4/5] shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  {photo.kind === 'image' || (photo.kind === 'video' && photo.poster) || (photo.kind === 'link' && photo.url) ? (
                    <img
                      src={photo.kind === 'video' ? photo.poster! : photo.url}
                      alt={`${photo.title} - ${photo.index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading={i < 8 ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                  ) : photo.kind === 'video' ? (
                    <video src={`${photo.url}#t=0.5`} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-surface-container-high to-surface-container-lowest text-tertiary">
                      {photo.linkType === 'instagram' ? <InstagramIcon size={36} /> : <Globe size={36} />}
                      <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{photo.linkType === 'instagram' ? 'View on Instagram' : 'View work'}</span>
                    </div>
                  )}
                  {photo.kind === 'video' && (
                    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="w-12 h-12 rounded-full bg-black/45 backdrop-blur-md border border-tertiary/50 flex items-center justify-center">
                        <Play size={18} fill="currentColor" className="text-tertiary ml-0.5" />
                      </span>
                    </span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                    <div className="flex justify-between items-center">
                      <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-tertiary text-[10px] font-bold uppercase tracking-wider rounded-sm">
                        {photo.category}
                      </span>
                      <span className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white/90 flex items-center justify-center">
                        <Maximize2 size={13} />
                      </span>
                    </div>
                    <div>
                      <h4 className="text-white text-sm font-display font-medium line-clamp-1">{photo.title}</h4>
                      <p className="text-white/60 text-xs mt-0.5">{photo.kind === 'video' ? 'Click to play' : photo.kind === 'link' ? 'Click to open' : 'Click to view fullscreen'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* ================= Projects / Collections View ================= */
          projects.length === 0 ? (
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
                    to={`/portfolio/${project.slug || project.id}`}
                    className={`${gridSpans[i % gridSpans.length]} relative group cursor-pointer overflow-hidden rounded-lg bg-surface-container border border-outline-variant/20 block`}
                  >
                    {getProjectCover(project) ? (
                      <img
                        src={getProjectCover(project)}
                        alt={project.display_title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        loading={i === 0 ? 'eager' : 'lazy'}
                        fetchPriority={i === 0 ? 'high' : 'auto'}
                        decoding="async"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-container-high to-surface-container-lowest text-tertiary/70">
                        {hasInstagram ? <InstagramIcon size={44} /> : <Globe size={44} />}
                      </div>
                    )}

                    {/* Top badges */}
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
                        {project.display_title}
                      </h3>
                      <p className="text-on-surface-variant text-xs line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        )}
      </section>

      {/* Lightbox for direct photo view */}
      {lightboxIndex !== null && viewerItems[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-20 cursor-pointer"
            aria-label="Close"
          >
            <X size={28} />
          </button>

          <button
            onClick={e => {
              e.stopPropagation();
              setLightboxIndex(i => (i! === 0 ? viewerItems.length - 1 : i! - 1));
            }}
            className="absolute left-4 sm:left-8 text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-20 cursor-pointer"
            aria-label="Previous"
          >
            <ChevronLeft size={32} />
          </button>

          <div className="flex flex-col items-center max-w-[95vw] max-h-[90vh] z-10" onClick={e => e.stopPropagation()}>
            {viewerItems[lightboxIndex].kind === 'video' ? (
              <video
                key={viewerItems[lightboxIndex].url}
                src={viewerItems[lightboxIndex].url}
                poster={viewerItems[lightboxIndex].poster || undefined}
                controls
                autoPlay
                playsInline
                controlsList="nodownload"
                className="max-w-[90vw] max-h-[80vh] rounded-lg shadow-2xl bg-black"
              />
            ) : (
              <img
                src={viewerItems[lightboxIndex].url}
                alt={`${viewerItems[lightboxIndex].title} - ${lightboxIndex + 1}`}
                className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg shadow-2xl"
              />
            )}
            <div className="mt-4 text-center">
              <span className="text-xs uppercase tracking-wider text-tertiary font-semibold block">
                {viewerItems[lightboxIndex].category}
              </span>
              <h3 className="text-white text-base font-display font-medium mt-1">
                {viewerItems[lightboxIndex].title}
              </h3>
              <p className="text-white/50 text-xs mt-1">
                {lightboxIndex + 1} of {viewerItems.length}
              </p>
            </div>
          </div>

          <button
            onClick={e => {
              e.stopPropagation();
              setLightboxIndex(i => (i! === viewerItems.length - 1 ? 0 : i! + 1));
            }}
            className="absolute right-4 sm:right-8 text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-20 cursor-pointer"
            aria-label="Next"
          >
            <ChevronRight size={32} />
          </button>
        </div>
      )}

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
