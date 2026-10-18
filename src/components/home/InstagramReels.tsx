import { useMemo, useState } from 'react';
import { ExternalLink, ArrowUpRight, AlertCircle } from 'lucide-react';
import InstagramIcon from '../icons/InstagramIcon';
import ReelCard from '../reels/ReelCard';
import { useReels } from '../../hooks/useReels';
import { INSTAGRAM_HANDLE, INSTAGRAM_PROFILE_URL } from '../../utils/instagram';
import { HOMEPAGE_REEL_LIMIT, getReelMediaType, getReelPoster, hasPlayableMedia, isInlinePlayable } from '../../utils/reelMedia';
import { parseYouTubeUrl } from '../../utils/youtube';
import type { InstagramReel } from '../../types';

const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://www.apoorvpatelphotography.com').replace(/\/$/, '');
const absoluteUrl = (url: string) => (/^https?:\/\//i.test(url) ? url : `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`);

/** schema.org VideoObject entries so search engines can index the films that play on this page. */
function videoStructuredData(reels: InstagramReel[]): string | null {
  const items = reels
    .filter(isInlinePlayable)
    .map(reel => {
      const poster = getReelPoster(reel);
      if (!poster) return null;
      const youtube = getReelMediaType(reel) === 'youtube' ? parseYouTubeUrl(reel.youtube_url) : null;
      return {
        '@type': 'VideoObject',
        name: reel.title || 'Apoorv Patel Photography film',
        description: reel.description || reel.title || 'Wedding and event film by Apoorv Patel Photography.',
        thumbnailUrl: absoluteUrl(poster),
        uploadDate: reel.created_at,
        ...(youtube ? { embedUrl: `https://www.youtube.com/embed/${youtube.id}` } : { contentUrl: reel.video_url }),
      };
    })
    .filter(Boolean);
  return items.length ? JSON.stringify({ '@context': 'https://schema.org', '@graph': items }) : null;
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
  // The one card currently playing. Starting another card stops (unmounts) this one.
  const [activeId, setActiveId] = useState<string | null>(null);

  // useReels already returns Published + Featured only; re-check defensively so a
  // draft or unplayable entry can never reach the public grid.
  const showcaseReels = reels.filter(
    reel => reel.status === 'configured' && (reel.is_featured ?? reel.featured) && hasPlayableMedia(reel)
  );
  const structuredData = useMemo(() => videoStructuredData(showcaseReels), [showcaseReels]);

  return (
    <section className="fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
        <div>
          <p className="font-body text-[12px] font-bold tracking-[0.2em] uppercase text-tertiary mb-3 flex items-center gap-2">
            <InstagramIcon size={16} className="text-tertiary" />
            Social & Live Work
          </p>
          <h2 className="font-display text-[32px] md:text-[48px] text-on-background leading-tight">
            Latest Films &amp; Reels
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" aria-busy="true" aria-label="Loading films and reels">
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
          {showcaseReels.map(reel => (
            <ReelCard
              key={reel.id}
              reel={reel}
              active={activeId === reel.id}
              onPlay={() => setActiveId(reel.id)}
              onStop={() => setActiveId(current => (current === reel.id ? null : current))}
            />
          ))}

          <FollowCard />
        </div>
      )}

      {structuredData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData.replace(/</g, '\\u003c') }} />}
    </section>
  );
}
