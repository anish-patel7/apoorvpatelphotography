import { useState, useCallback, useEffect, useRef } from 'react';
import { Play, ExternalLink, ArrowUpRight, AlertCircle, Film } from 'lucide-react';
import InstagramIcon from '../icons/InstagramIcon';
import ReelViewerModal from '../instagram/ReelViewerModal';
import { useReels } from '../../hooks/useReels';
import { INSTAGRAM_HANDLE, INSTAGRAM_PROFILE_URL, cleanInstagramUrl, isValidInstagramUrl } from '../../utils/instagram';
import { HOMEPAGE_REEL_LIMIT, getReelMediaType, hasPlayableMedia } from '../../utils/reelMedia';
import type { InstagramReel } from '../../types';

/**
 * Card artwork. Uploaded videos show their own first frame (no thumbnail upload needed)
 * and play muted while the pointer is over the card. Instagram reels use the saved cover
 * image when one exists; otherwise a branded placeholder is shown.
 */
function ReelThumbnail({ reel, playing }: { reel: InstagramReel; playing: boolean }) {
  const poster = reel.thumbnail_url || reel.thumbnail || '';
  const videoSrc = reel.video_url || '';
  const isVideo = getReelMediaType(reel) === 'video' && Boolean(videoSrc);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [broken, setBroken] = useState(false);

  // Play while hovered; rewind to the first frame when the pointer leaves.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) {
      v.muted = true;
      v.play().catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0.1;
    }
  }, [playing]);

  if (isVideo && !broken) {
    const landscape = reel.orientation === 'landscape' || reel.orientation === 'square';
    return (
      <video
        ref={videoRef}
        src={`${videoSrc}#t=0.1`}
        poster={poster || undefined}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        onError={() => setBroken(true)}
        className={`absolute inset-0 w-full h-full bg-black transition-transform duration-700 group-hover:scale-105 ${landscape ? 'object-contain' : 'object-cover'}`}
      />
    );
  }

  if (!poster || broken) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-surface-container-high to-surface-container-lowest">
        {getReelMediaType(reel) === 'video'
          ? <Film size={36} className="text-tertiary/50" />
          : <InstagramIcon size={36} className="text-tertiary/50" />}
      </div>
    );
  }

  const orientation = reel.orientation || 'portrait';
  if (orientation === 'portrait') {
    return (
      <img
        src={poster}
        alt={reel.title}
        loading="lazy"
        decoding="async"
        onError={() => setBroken(true)}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
      />
    );
  }

  return (
    <>
      <img src={poster} alt="" aria-hidden="true" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover scale-125 blur-xl opacity-60" />
      <img
        src={poster}
        alt={reel.title}
        loading="lazy"
        decoding="async"
        onError={() => setBroken(true)}
        className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
      />
    </>
  );
}

function SkeletonCard() {
  return <div className="aspect-[9/16] rounded-lg bg-surface-container border border-outline-variant/20 animate-pulse" />;
}

function FollowCard() {
  return (
    <a
      href={INSTAGRAM_PROFILE_URL}
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
  );
}

export default function InstagramReels() {
  const { reels, loading, error } = useReels(HOMEPAGE_REEL_LIMIT);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const closeViewer = useCallback(() => setActiveIndex(null), []);

  // useReels already returns Published + Featured only; re-check defensively so a
  // draft or unplayable entry can never reach the public grid.
  const showcaseReels = reels.filter(
    reel => reel.status === 'configured' && (reel.is_featured ?? reel.featured) && hasPlayableMedia(reel)
  );

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
          href={INSTAGRAM_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-body text-[12px] font-bold tracking-[0.15em] uppercase text-tertiary hover:text-on-background transition-colors flex items-center gap-2"
        >
          Follow {INSTAGRAM_HANDLE} <ExternalLink size={14} />
        </a>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" aria-busy="true" aria-label="Loading Instagram highlights">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 rounded-lg border border-outline-variant/30 bg-surface-container-low p-6 flex flex-col items-start justify-center gap-2">
            <AlertCircle size={20} className="text-tertiary" />
            <p className="font-display text-on-surface font-semibold">{error}</p>
            <p className="text-sm text-on-surface-variant">You can still watch our latest work directly on Instagram.</p>
          </div>
          <FollowCard />
        </div>
      ) : showcaseReels.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 rounded-lg border border-outline-variant/30 bg-surface-container-low p-6 flex flex-col items-start justify-center gap-2">
            <p className="font-display text-on-surface font-semibold">New reels are on the way</p>
            <p className="text-sm text-on-surface-variant">Follow {INSTAGRAM_HANDLE} for our latest weddings, portraits and behind-the-scenes films.</p>
          </div>
          <FollowCard />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {showcaseReels.map((reel, idx) => {
            const instagramUrl = reel.instagram_url || reel.url || '';
            const hasInstagramLink = isValidInstagramUrl(instagramUrl);
            const isVideo = getReelMediaType(reel) === 'video';
            const label = isVideo ? 'Watch Video' : reel.content_type === 'post' ? 'View Post' : 'Watch Reel';

            return (
              <div
                key={reel.id}
                onMouseEnter={() => setHoveredId(reel.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="group relative aspect-[9/16] rounded-lg overflow-hidden bg-surface-container border border-outline-variant/20 shadow-md transition-all duration-300 hover:border-tertiary/50 hover:shadow-xl hover:-translate-y-0.5"
              >
                <ReelThumbnail reel={reel} playing={hoveredId === reel.id} />

                {/* Whole card opens the viewer */}
                <button
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className="absolute inset-0 z-[1] w-full h-full bg-gradient-to-t from-black/85 via-black/15 to-transparent group-hover:from-black/90 transition-colors flex flex-col justify-end p-3 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-inset"
                  aria-label={`${label}: ${reel.title || 'Instagram highlight'}`}
                >
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="w-12 h-12 rounded-full bg-black/35 backdrop-blur-md border border-tertiary/50 flex items-center justify-center shadow-lg opacity-90 group-hover:opacity-100 group-hover:scale-110 group-hover:bg-tertiary/25 transition-all duration-300">
                      <Play size={20} fill="currentColor" className="text-tertiary ml-0.5" />
                    </span>
                  </span>
                  <span className="relative block">
                    <span className="block text-white text-xs sm:text-[13px] font-medium font-body line-clamp-2 leading-snug">{reel.title}</span>
                    <span className="text-tertiary text-[10px] uppercase tracking-wider block mt-1 font-semibold">{label}</span>
                  </span>
                </button>

                <span className="absolute top-2 left-2 z-[2] pointer-events-none bg-black/70 backdrop-blur-md border border-white/15 px-2 py-0.5 rounded-full text-[9px] font-semibold text-white/90 tracking-wider uppercase flex items-center gap-1">
                  {isVideo ? <Film size={10} /> : <InstagramIcon size={10} />}
                  {isVideo ? 'Video' : reel.content_type === 'post' ? 'Post' : 'Reel'}
                </span>

                {hasInstagramLink && (
                  <a
                    href={cleanInstagramUrl(instagramUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 z-[2] w-7 h-7 rounded-full bg-black/45 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-tertiary hover:bg-black/80 transition-colors"
                    title="Open on Instagram"
                    aria-label={`Open ${reel.title || 'post'} on Instagram`}
                  >
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            );
          })}

          <FollowCard />
        </div>
      )}

      {activeIndex !== null && showcaseReels[activeIndex] && (
        <ReelViewerModal
          reels={showcaseReels}
          index={activeIndex}
          onClose={closeViewer}
          onNavigate={setActiveIndex}
        />
      )}
    </section>
  );
}
