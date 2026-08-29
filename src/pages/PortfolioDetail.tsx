import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Share2, X, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { portfolioProjects } from '../data/portfolio';

export default function PortfolioDetail() {
  const { id } = useParams();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const project = portfolioProjects.find(p => p.id === id);

  if (!project) {
    return (
      <div className="pt-32 pb-20 text-center">
        <h1 className="font-heading text-3xl font-bold mb-4">Project Not Found</h1>
        <Link to="/portfolio" className="text-brand-saffron hover:underline">Back to Portfolio</Link>
      </div>
    );
  }

  const related = portfolioProjects.filter(p => p.category === project.category && p.id !== project.id).slice(0, 3);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: project.title, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <>
      <section className="pt-28 pb-8 bg-brand-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/portfolio" className="inline-flex items-center gap-2 text-white/60 hover:text-brand-saffron transition-colors mb-8">
            <ArrowLeft size={18} /> Back to Portfolio
          </Link>

          <div className="aspect-[21/9] rounded-2xl overflow-hidden mb-8">
            <img src={project.coverImage} alt={project.title} className="w-full h-full object-cover" />
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
            <div className="flex-1">
              <span className="inline-block px-3 py-1 bg-brand-saffron/20 text-brand-saffron text-xs font-semibold rounded-full mb-4">
                {project.category}
              </span>
              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">{project.title}</h1>
              <p className="text-white/60 leading-relaxed mb-6">{project.description}</p>

              <div className="flex flex-wrap gap-6 text-sm text-white/50">
                <span className="flex items-center gap-1.5"><MapPin size={16} className="text-brand-saffron" /> {project.location}</span>
                <span className="flex items-center gap-1.5"><Calendar size={16} className="text-brand-saffron" /> {project.date}</span>
              </div>
            </div>

            <div className="flex flex-row lg:flex-col gap-3">
              <button onClick={handleShare} className="px-5 py-2.5 border border-white/20 rounded-full text-sm hover:bg-white/10 transition-colors flex items-center gap-2">
                <Share2 size={16} /> Share
              </button>
              <Link to="/contact" className="px-5 py-2.5 bg-brand-saffron text-black rounded-full text-sm font-semibold hover:bg-brand-gold transition-colors flex items-center gap-2">
                <MessageCircle size={16} /> Get a Quote
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-brand-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-semibold mb-6">Gallery</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {project.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setLightboxIndex(i)}
                className="aspect-square rounded-xl overflow-hidden hover:opacity-80 transition-opacity cursor-pointer"
              >
                <img src={img} alt={`${project.title} - ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="py-16 bg-brand-charcoal">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl font-semibold mb-8">Related Projects</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map(p => (
                <Link to={`/portfolio/${p.id}`} key={p.id} className="group rounded-2xl overflow-hidden">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={p.coverImage} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                  </div>
                  <div className="p-4 bg-brand-dark">
                    <h3 className="font-heading font-semibold group-hover:text-brand-saffron transition-colors">{p.title}</h3>
                    <p className="text-white/50 text-sm">{p.location}</p>
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
