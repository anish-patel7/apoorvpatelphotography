import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Share2, X, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import InstagramIcon from '../components/icons/InstagramIcon';
import InstagramEmbed from '../components/instagram/InstagramEmbed';
import SEO from '../components/common/SEO';
import { usePortfolioProject, usePortfolio } from '../hooks/usePortfolio';
import { cleanInstagramUrl } from '../utils/instagram';

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
        <SEO
          title="Project Not Found | Apoorv Patel Photography"
          description="The requested photography project could not be found."
          noindex={true}
        />
        <h1 className="font-display text-[40px] text-on-background mb-4 leading-tight">Project Not Found</h1>
        <Link to="/portfolio" className="text-tertiary hover:text-tertiary/80">Back to Portfolio</Link>
      </div>
    );
  }

  const related = projects.filter(p => p.category === project.category && p.id !== project.id).slice(0, 3);
  const instagramUrl = project.instagram_url || project.video_url || project.reel_url;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: project.title, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const galleryImages = project.images && project.images.length > 0 ? project.images : [project.cover_image];

  const projectSchema = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.apoorvpatelphotography.com/' },
        { '@type': 'ListItem', position: 2, name: 'Portfolio', item: 'https://www.apoorvpatelphotography.com/portfolio' },
        { '@type': 'ListItem', position: 3, name: project.title, item: `https://www.apoorvpatelphotography.com/portfolio/${project.id}` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      name: project.title,
      caption: project.description,
      contentUrl: project.cover_image.startsWith('http')
        ? project.cover_image
        : `https://www.apoorvpatelphotography.com${project.cover_image.startsWith('/') ? project.cover_image : `/${project.cover_image}`}`,
      creator: {
        '@type': 'Person',
        name: 'Apoorv Patel',
      },
      creditText: 'Apoorv Patel Photography',
      copyrightNotice: '© Apoorv Patel Photography',
    },
  ];

  return (
    <>
      <SEO
        title={`${project.title} | Apoorv Patel Photography`}
        description={project.description}
        canonicalPath={`/portfolio/${project.id}`}
        image={project.cover_image}
        type="article"
        schema={projectSchema}
      />
      <section className="pt-28 pb-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/portfolio" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-tertiary transition-colors mb-8">
            <ArrowLeft size={18} /> Back to Portfolio
          </Link>

          <div className="aspect-[16/9] sm:aspect-[21/9] rounded-sm overflow-hidden mb-8 border border-outline-variant/10 shadow-lg bg-surface-container">
            <img
              src={project.cover_image}
              alt={project.title}
              className="w-full h-full object-cover"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-block px-3 py-1 bg-tertiary/20 text-tertiary text-xs font-semibold rounded-sm">
                  {project.category}
                </span>
                {project.is_real_work && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Verified Real Work
                  </span>
                )}
              </div>
              <h1 className="font-display text-[26px] sm:text-[38px] lg:text-[52px] text-on-background font-semibold mb-4 leading-tight">{project.title}</h1>
              <p className="font-body text-[16px] text-on-surface-variant leading-relaxed mb-6">{project.description}</p>

              <div className="flex flex-wrap gap-6 text-sm text-on-surface-variant">
                <span className="flex items-center gap-1.5"><MapPin size={16} className="text-tertiary" /> {project.location}</span>
                <span className="flex items-center gap-1.5"><Calendar size={16} className="text-tertiary" /> {project.date}</span>
              </div>
            </div>

            <div className="flex flex-row lg:flex-col gap-3">
              {instagramUrl && (
                <a
                  href={cleanInstagramUrl(instagramUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 border border-tertiary/50 text-tertiary rounded-sm text-sm font-semibold hover:bg-tertiary hover:text-background transition-colors flex items-center gap-2"
                >
                  <InstagramIcon size={16} /> View on Instagram
                </a>
              )}
              <button onClick={handleShare} className="px-5 py-2.5 border border-outline-variant/30 rounded-sm text-sm hover:bg-surface-container transition-colors flex items-center gap-2 text-on-surface-variant cursor-pointer">
                <Share2 size={16} /> Share
              </button>
              <Link to="/contact" className="px-5 py-2.5 bg-tertiary text-background rounded-sm text-sm font-semibold hover:bg-tertiary/80 transition-colors flex items-center gap-2">
                <MessageCircle size={16} /> Get a Quote
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Instagram Embed Spotlight (for Instagram-linked projects) */}
      {instagramUrl && (
        <section className="py-14 bg-surface-container-low border-y border-outline-variant/15">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-10">
              <div className="w-full lg:w-1/2 flex justify-center">
                <InstagramEmbed
                  url={instagramUrl}
                  fallbackThumbnail={project.cover_image}
                  title={project.title}
                  orientation={project.orientation}
                  aspectRatio={project.content_type === 'reel' ? 'reel' : 'auto'}
                  autoLoad={false}
                />
              </div>
              <div className="w-full lg:w-1/2 space-y-4">
                <span className="inline-block px-3 py-1 bg-tertiary/20 text-tertiary text-xs font-semibold rounded-sm uppercase tracking-wider">
                  Instagram {project.content_type === 'reel' ? 'Reel' : 'Post'}
                </span>
                <h2 className="font-display text-[28px] sm:text-[36px] text-on-background font-semibold leading-tight">
                  Social Spotlight & Interactive View
                </h2>
                <p className="font-body text-[16px] text-on-surface-variant leading-relaxed">
                  Experience this shoot as shared on Instagram. You can interact directly with the embedded preview above, or visit our official Instagram post for comments, audio, and behind-the-scenes.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <a
                    href={cleanInstagramUrl(instagramUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-tertiary text-background text-sm font-semibold rounded-sm hover:bg-tertiary/80 transition-colors shadow-sm"
                  >
                    <InstagramIcon size={16} /> Open on Instagram
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Photo Gallery (Preserved for all projects) */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-[32px] text-on-background font-semibold mb-6">Gallery</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {galleryImages.map((img: string, i: number) => (
              <button
                key={i}
                onClick={() => setLightboxIndex(i)}
                className="aspect-square rounded-sm overflow-hidden hover:opacity-80 transition-opacity cursor-pointer border border-outline-variant/10 bg-surface-container"
              >
                <img src={img} alt={`${project.title} - ${i + 1}`} className="w-full h-full object-cover" loading="lazy" decoding="async" />
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
                <Link to={`/portfolio/${p.id}`} key={p.id} className="group rounded-sm overflow-hidden border border-outline-variant/10 bg-surface-container">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={p.cover_image} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" decoding="async" />
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
