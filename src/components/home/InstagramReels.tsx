import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Play, ExternalLink, X, ArrowUpRight, Loader2 } from 'lucide-react';
import InstagramIcon from '../icons/InstagramIcon';
import InstagramEmbed from '../instagram/InstagramEmbed';
import { useReels } from '../../hooks/useReels';
import { isValidInstagramUrl, cleanInstagramUrl } from '../../utils/instagram';
import type { InstagramReel } from '../../types';

export default function InstagramReels() {
  const { reels, loading } = useReels();
  const [activeReel, setActiveReel] = useState<InstagramReel | null>(null);

  // Filter only genuinely configured reels with valid individual post or reel URLs
  const configuredReels = reels.filter(
    reel => reel.status !== 'incomplete' && isValidInstagramUrl(reel.instagram_url || reel.url || '')
  );

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveReel(null);
    };
    if (activeReel) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeReel]);

  return (
    <section className="fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
        <div>
          <p className="font-body text-[12px] font-bold tracking-[0.2em] uppercase text-tertiary mb-3 flex items-center gap-2">
            <InstagramIcon size={16} className="text-tertiary" />
            Social & Live Work
          </p>
          <h2 className="font-display text-[32px] md:text-[48px] text-on-background leading-tight">
            Latest from Instagram
          </h2>
          <div className="w-16 h-[2px] bg-tertiary mt-4" />
        </div>
        <a
          href="https://www.instagram.com/apoorvpatel_photography/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-body text-[12px] font-bold tracking-[0.15em] uppercase text-tertiary hover:text-white transition-colors flex items-center gap-2"
        >
          Follow @apoorvpatel_photography <ExternalLink size={14} />
        </a>
      </div>

      {loading && configuredReels.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-on-surface-variant text-sm">
          <Loader2 size={24} className="animate-spin text-tertiary mr-2" />
          <span>Loading Instagram highlights...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {configuredReels.map((reel, idx) => {
            const reelUrl = reel.instagram_url || reel.url || '';
            const reelThumbnail = reel.thumbnail_url || reel.thumbnail || '';
            const isFeatured = reel.is_featured ?? reel.featured ?? false;

            return (
              <div
                key={reel.id}
                onClick={() => setActiveReel(reel)}
                className="group relative aspect-[9/16] rounded-lg overflow-hidden bg-surface-container border border-outline-variant/20 shadow-md transition-all duration-300 hover:border-tertiary/50 hover:shadow-xl cursor-pointer"
              >
                <img
                  src={reelThumbnail}
                  alt={reel.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
                {idx === 0 && isFeatured && (
                  <div className="absolute top-2 left-2 z-10 bg-black/80 backdrop-blur-md border border-tertiary/40 px-2 py-0.5 rounded-full text-[10px] font-semibold text-tertiary tracking-wider uppercase flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Featured Real Work
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 transition-all flex flex-col justify-between p-3">
                  <div className="flex justify-end">
                    <a
                      href={cleanInstagramUrl(reelUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-tertiary hover:bg-black/80 transition-colors"
                      title="Open directly on Instagram"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  <div className="flex flex-col items-center justify-center my-auto opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
                    <div className="w-11 h-11 rounded-full bg-tertiary/20 backdrop-blur-md border border-tertiary/40 flex items-center justify-center shadow-lg">
                      <Play size={18} fill="currentColor" className="text-tertiary ml-0.5" />
                    </div>
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium truncate font-body">{reel.title}</p>
                    <span className="text-tertiary text-[10px] uppercase tracking-wider block mt-0.5 font-semibold">
                      Watch Reel
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Studio Feed Explore Invitation Card */}
          <a
            href="https://www.instagram.com/apoorvpatel_photography/"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-[9/16] rounded-lg overflow-hidden bg-surface-container-low border border-dashed border-outline-variant/40 hover:border-tertiary/60 transition-all p-4 flex flex-col justify-between items-center text-center shadow-xs"
          >
            <div className="w-10 h-10 rounded-full bg-tertiary/10 border border-tertiary/30 flex items-center justify-center text-tertiary mt-4 group-hover:scale-110 transition-transform">
              <InstagramIcon size={20} />
            </div>
            <div className="space-y-1.5 px-1">
              <p className="font-display text-sm font-semibold text-on-surface">More on Instagram</p>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Explore our full feed of client stories, live reels, and cinema shorts.
              </p>
            </div>
            <span className="text-tertiary text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 group-hover:underline mb-2">
              View Feed <ArrowUpRight size={13} />
            </span>
          </a>
        </div>
      )}

      {/* Embedded Reel Interactive Modal Overlay */}
      {activeReel && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setActiveReel(null)}
        >
          <div
            className="relative bg-surface-container-low border border-outline-variant/30 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <InstagramIcon size={18} className="text-tertiary" />
                <div>
                  <h3 className="font-display font-semibold text-base text-on-surface truncate max-w-[240px]">
                    {activeReel.title}
                  </h3>
                  <span className="text-[11px] text-tertiary uppercase tracking-wider font-semibold">
                    Instagram Reel
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveReel(null)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Embedded Instagram Reel */}
            <InstagramEmbed
              url={activeReel.instagram_url || activeReel.url || ''}
              fallbackThumbnail={activeReel.thumbnail_url || activeReel.thumbnail || ''}
              title={activeReel.title}
              orientation={activeReel.orientation}
              aspectRatio="reel"
              autoLoad={false}
            />

            {/* Fallback & External Link Bar */}
            <div className="pt-2 flex items-center justify-between gap-3 text-xs border-t border-outline-variant/20">
              <span className="text-on-surface-variant text-[11px]">
                Original post on Instagram
              </span>
              <a
                href={cleanInstagramUrl(activeReel.instagram_url || activeReel.url || '')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-tertiary/15 hover:bg-tertiary/25 text-tertiary border border-tertiary/30 rounded-lg font-semibold tracking-wide transition-colors"
              >
                <span>Watch on Instagram</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
