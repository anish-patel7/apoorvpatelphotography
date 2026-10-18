import { Link } from 'react-router-dom';
import { useFeaturedPortfolio, getProjectCover } from '../../hooks/usePortfolio';

export default function FeaturedPortfolio() {
  const { projects, loading } = useFeaturedPortfolio();

  return (
    <section className="fade-in">
      <div className="flex justify-between items-end mb-16">
        <div>
          <h2 className="font-display text-[32px] md:text-[48px] text-on-background mb-4 leading-tight">
            Selected Works
          </h2>
          <div className="w-16 h-[2px] bg-tertiary" />
        </div>
        <Link
          to="/portfolio"
          className="font-body text-[12px] font-bold tracking-[0.15em] uppercase text-tertiary hover:text-white transition-colors flex items-center gap-2"
        >
          View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>

      {loading ? (
        <div className="h-[400px] flex items-center justify-center bg-surface-container rounded-xl text-on-surface-variant text-sm">
          Loading selected works...
        </div>
      ) : projects.length === 0 ? (
        <div className="h-[300px] flex flex-col items-center justify-center bg-surface-container rounded-xl text-center px-4">
          <p className="text-on-surface font-semibold text-lg">Curating New Photography Collections</p>
          <p className="text-on-surface-variant text-xs mt-1 max-w-md">
            Our latest editorial and wedding showcases are being assembled. Contact the studio for private inquiries.
          </p>
        </div>
      ) : projects.length === 1 ? (
        // Elegant focal spotlight when single authentic work is present
        <div className="max-w-4xl mx-auto">
          <Link
            to={`/portfolio/${projects[0].slug || projects[0].id}`}
            className="gallery-card rounded-2xl block relative group overflow-hidden bg-surface-container border border-outline-variant/30 h-[480px] md:h-[600px] shadow-2xl"
          >
            <img
              src={getProjectCover(projects[0]) || undefined}
              alt={projects[0].display_title}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
            {projects[0].is_real_work && (
              <div className="absolute top-5 left-5 z-10 bg-black/80 backdrop-blur-md border border-tertiary/40 px-3.5 py-1.5 rounded-full text-[11px] font-semibold text-tertiary tracking-wider uppercase flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Featured Authentic Work
              </div>
            )}
            <div className="gallery-overlay flex flex-col items-center justify-center p-8 text-center bg-gradient-to-t from-black/90 via-black/40 to-transparent">
              <span className="font-body text-xs tracking-widest uppercase text-tertiary mb-2 font-semibold">
                {projects[0].category}{projects[0].location ? <> &middot; {projects[0].location}</> : null}
              </span>
              <span className="font-display text-[28px] md:text-[38px] text-white leading-tight font-bold">
                {projects[0].display_title}
              </span>
            </div>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[800px]">
          {projects.map((item, idx) => {
            const spanClass = idx === 0 ? 'md:col-span-2 md:row-span-2' : idx === 1 ? 'md:col-span-2 md:row-span-1' : 'md:col-span-1 md:row-span-1';

            return (
              <Link
                key={item.id}
                to={`/portfolio/${item.slug || item.id}`}
                className={`gallery-card rounded-lg ${spanClass} min-h-[280px] md:min-h-0 block relative group overflow-hidden bg-surface-container border border-outline-variant/20`}
              >
                <img
                  src={getProjectCover(item) || undefined}
                  alt={item.display_title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
                {item.is_real_work && (
                  <div className="absolute top-4 left-4 z-10 bg-black/70 backdrop-blur-md border border-tertiary/40 px-3 py-1 rounded-full text-[11px] font-semibold text-tertiary tracking-wider uppercase flex items-center gap-1.5 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Real Work
                  </div>
                )}
                <div className="gallery-overlay flex flex-col items-center justify-center p-6 text-center">
                  <span className="font-body text-xs tracking-widest uppercase text-tertiary mb-2 font-semibold">{item.category}</span>
                  <span className="font-display text-[26px] md:text-[32px] text-white leading-tight">{item.display_title}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
