import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Share2, X, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { usePortfolioProject, usePortfolio } from '../hooks/usePortfolio';

export default function PortfolioDetail() {
  const { id } = useParams<{ id: string }>();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { project, loading } = usePortfolioProject(id || '');
  const { projects } = usePortfolio();

  if (loading) {
    return (
      <div className="pt-32 pb-20 text-center">
        <p className="text-on-surface-variant">Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="pt-32 pb-20 text-center">
        <h1 className="font-display text-[40px] text-on-background mb-4 leading-tight">Project Not Found</h1>
        <Link to="/portfolio" className="text-tertiary hover:text-tertiary/80">Back to Portfolio</Link>
      </div>
    );
  }

  const related = projects.filter(p => p.category === project.category && p.id !== project.id).slice(0, 3);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: project.title, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <>
      <section className="pt-28 pb-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/portfolio" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-tertiary transition-colors mb-8">
            <ArrowLeft size={18} /> Back to Portfolio
          </Link>

          <div className="aspect-[21/9] rounded-sm overflow-hidden mb-8">
            <img src={project.cover_image} alt={project.title} className="w-full h-full object-cover" />
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
            <div className="flex-1">
              <span className="inline-block px-3 py-1 bg-tertiary/20 text-tertiary text-xs font-semibold rounded-sm mb-4">
                {project.category}
              </span>
              <h1 className="font-display text-[40px] sm:text-[48px] lg:text-[56px] text-on-background font-semibold mb-4 leading-tight">{project.title}</h1>
              <p className="font-body text-[16px] text-on-surface-variant leading-relaxed mb-6">{project.description}</p>

              <div className="flex flex-wrap gap-6 text-sm text-on-surface-variant">
                <span className="flex items-center gap-1.5"><MapPin size={16} className="text-tertiary" /> {project.location}</span>
                <span className="flex items-center gap-1.5"><Calendar size={16} className="text-tertiary" /> {project.date}</span>
              </div>
            </div>

            <div className="flex flex-row lg:flex-col gap-3">
              <button onClick={handleShare} className="px-5 py-2.5 border border-outline-variant/30 rounded-sm text-sm hover:bg-surface-container transition-colors flex items-center gap-2 text-on-surface-variant">
                <Share2 size={16} /> Share
              </button>
              <Link to="/contact" className="px-5 py-2.5 bg-tertiary text-background rounded-sm text-sm font-semibold hover:bg-tertiary/80 transition-colors flex items-center gap-2">
                <MessageCircle size={16} /> Get a Quote
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-[32px] text-on-background font-semibold mb-6">Gallery</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {project.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setLightboxIndex(i)}
                className="aspect-square rounded-sm overflow-hidden hover:opacity-80 transition-opacity cursor-pointer border border-outline-variant/10"
              >
                <img src={img} alt={`${project.title} - ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="py-16 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-[32px] text-on-background font-semibold mb-8">Related Projects</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map(p => (
                <Link to={`/portfolio/${p.id}`} key={p.id} className="group rounded-sm overflow-hidden border border-outline-variant/10">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={p.cover_image} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                  </div>
                  <div className="p-4 bg-surface-container">
                    <h3 className="font-display font-semibold text-on-background group-hover:text-tertiary transition-colors">{p.title}</h3>
                    <p className="text-on-surface-variant text-sm">{p.location}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center" onClick={() => setLightboxIndex(null)}>
          <button onClick={() => setLightboxIndex(null)} className="absolute top-6 right-6 text-white/80 hover:text-white" aria-label="Close">
            <X size={32} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i! === 0 ? project.images.length - 1 : i! - 1)); }}
            className="absolute left-4 sm:left-8 text-white/80 hover:text-white"
            aria-label="Previous"
          >
            <ChevronLeft size={40} />
          </button>
          <img
            src={project.images[lightboxIndex]}
            alt={`${project.title} - ${lightboxIndex + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i! === project.images.length - 1 ? 0 : i! + 1)); }}
            className="absolute right-4 sm:right-8 text-white/80 hover:text-white"
            aria-label="Next"
          >
            <ChevronRight size={40} />
          </button>
          <div className="absolute bottom-6 text-white/50 text-sm">{lightboxIndex + 1} / {project.images.length}</div>
        </div>
      )}
    </>
  );
}
