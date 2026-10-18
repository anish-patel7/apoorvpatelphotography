import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ExternalLink, Film, Play, X } from 'lucide-react';
import InstagramIcon from '../icons/InstagramIcon';
import { InlineVideoPlayer, InlineYouTubePlayer } from './InlineReelPlayers';
import { cleanInstagramUrl, isValidInstagramUrl } from '../../utils/instagram';
import { getReelMediaType, getReelPoster, isInlinePlayable } from '../../utils/reelMedia';
import { parseYouTubeUrl } from '../../utils/youtube';
import type { InstagramReel } from '../../types';

const CARD_CLASS =
  'group relative aspect-[9/16] rounded-lg overflow-hidden bg-surface-container border border-outline-variant/20 shadow-md transition-all duration-300';

/** Card artwork before playback: saved/auto thumbnail, the video's own first frame, or a branded placeholder. */
function ReelArtwork({ reel, previewing }: { reel: InstagramReel; previewing: boolean }) {
  const poster = getReelPoster(reel);
  const type = getReelMediaType(reel);
  const videoSrc = type === 'video' ? reel.video_url || '' : '';
  const videoRef = useRef<HTMLVideoElement>(null);
  const [broken, setBroken] = useState(false);
  const wide = reel.orientation === 'landscape' || reel.orientation === 'square';

  // Uploaded videos play a silent preview while the pointer is over the card.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (previewing) {
      v.muted = true;
      v.play().catch(() => {});
    } else {
      v.pause();
      if (v.readyState > 0) v.currentTime = poster ? 0 : 0.1;
    }
  }, [previewing, poster]);

  if (videoSrc && !broken) {
    return (
      <>
        {poster && wide && <img src={poster} alt="" aria-hidden="true" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover scale-125 blur-xl opacity-60" />}
        <video
          ref={videoRef}
          // Without a thumbnail, show the video's own first frame (fetches only metadata + one frame).
          src={poster ? videoSrc : `${videoSrc}#t=0.1`}
          poster={poster || undefined}
          muted
          loop
          playsInline
          preload={poster ? 'none' : 'metadata'}
          aria-hidden="true"
          tabIndex={-1}
          onError={() => setBroken(true)}
          className={`absolute inset-0 w-full h-full transition-transform duration-700 group-hover:scale-105 ${wide ? 'object-contain' : 'object-cover bg-black'}`}
        />
      </>
    );
  }

  if (!poster || broken) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-surface-container-high to-surface-container-lowest">
        {type === 'instagram' ? <InstagramIcon size={36} className="text-tertiary/50" /> : <Film size={36} className="text-tertiary/50" />}
      </div>
    );
  }

  if (!wide) {
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

function SourceBadge({ reel }: { reel: InstagramReel }) {
  const type = getReelMediaType(reel);
  const label = type === 'video' ? 'Film' : type === 'youtube' ? (parseYouTubeUrl(reel.youtube_url)?.isShort ? 'Short' : 'YouTube') : reel.content_type === 'post' ? 'Post' : 'Reel';
  return (
    <span className="absolute top-2 left-2 z-[2] pointer-events-none bg-black/70 backdrop-blur-md border border-white/15 px-2 py-0.5 rounded-full text-[9px] font-semibold text-white/90 tracking-wider uppercase flex items-center gap-1">
      {type === 'video' ? <Film size={10} /> : type === 'youtube' ? <Play size={10} fill="currentColor" /> : <InstagramIcon size={10} />}
      {label}
      {type === 'youtube' && <span className="sr-only"> on YouTube</span>}
    </span>
  );
}

function CardCaption({ title, action }: { title: string; action: React.ReactNode }) {
  return (
    <span className="relative block">
      <span className="block text-white text-xs sm:text-[13px] font-medium font-body line-clamp-2 leading-snug">{title}</span>
      <span className="text-tertiary text-[10px] uppercase tracking-wider mt-1 font-semibold flex items-center gap-1">{action}</span>
    </span>
  );
}

interface ReelCardProps {
  reel: InstagramReel;
  /** True while this card's player is showing. Only one card is active at a time. */
  active: boolean;
  onPlay: () => void;
  onStop: () => void;
}

/**
 * One homepage card. Uploaded videos and YouTube links play inside the card.
 * Instagram-only links can't be guaranteed to play off Instagram, so they are
 * shown honestly as "Watch on Instagram" links instead of a play button.
 */
export default function ReelCard({ reel, active, onPlay, onStop }: ReelCardProps) {
  const [hovered, setHovered] = useState(false);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const type = getReelMediaType(reel);
  const instagramUrl = reel.instagram_url || reel.url || '';
  const canonicalInstagram = isValidInstagramUrl(instagramUrl) ? cleanInstagramUrl(instagramUrl) : '';
  const youtube = type === 'youtube' ? parseYouTubeUrl(reel.youtube_url) : null;
  const title = reel.title || (type === 'youtube' ? 'YouTube video' : type === 'video' ? 'Film' : 'Instagram reel');
  const fit = reel.orientation === 'landscape' || reel.orientation === 'square' ? 'contain' : 'cover';

  const stop = () => {
    onStop();
    requestAnimationFrame(() => playButtonRef.current?.focus());
  };

  // Instagram link only → honest external link (Instagram controls playback of its reels).
  if (!isInlinePlayable(reel)) {
    return (
      <a
        href={canonicalInstagram}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${title} — watch on Instagram (opens in a new tab)`}
        className={`${CARD_CLASS} block hover:border-tertiary/50 hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-tertiary`}
      >
        <ReelArtwork reel={reel} previewing={false} />
        <span className="absolute inset-0 z-[1] bg-gradient-to-t from-black/85 via-black/15 to-transparent group-hover:from-black/90 transition-colors flex flex-col justify-end p-3 text-left">
          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="w-12 h-12 rounded-full bg-black/35 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
              <InstagramIcon size={20} className="text-white" />
            </span>
          </span>
          <CardCaption title={title} action={<>Watch on Instagram <ArrowUpRight size={11} /></>} />
        </span>
        <SourceBadge reel={reel} />
      </a>
    );
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`${CARD_CLASS} ${active ? 'border-tertiary/60 shadow-xl' : 'hover:border-tertiary/50 hover:shadow-xl hover:-translate-y-0.5'}`}
      data-reel-id={reel.id}
      data-playing={active ? 'true' : undefined}
    >
      {active ? (
        <>
          {type === 'video' && reel.video_url && (
            <InlineVideoPlayer src={reel.video_url} poster={getReelPoster(reel)} title={title} fit={fit} instagramUrl={canonicalInstagram || undefined} />
          )}
          {type === 'youtube' && youtube && (
            <InlineYouTubePlayer videoId={youtube.id} title={title} watchUrl={youtube.canonicalUrl} />
          )}
          <button
            type="button"
            onClick={stop}
            aria-label={`Close player: ${title}`}
            className="absolute top-2 right-2 z-[3] w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:text-tertiary hover:bg-black/85 transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </>
      ) : (
        <>
          <ReelArtwork reel={reel} previewing={hovered && type === 'video'} />
          <button
            ref={playButtonRef}
            type="button"
            onClick={onPlay}
            className="absolute inset-0 z-[1] w-full h-full bg-gradient-to-t from-black/85 via-black/15 to-transparent group-hover:from-black/90 transition-colors flex flex-col justify-end p-3 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-inset"
            aria-label={`Play ${type === 'youtube' ? 'YouTube video' : 'video'}: ${title}`}
          >
            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="w-12 h-12 rounded-full bg-black/35 backdrop-blur-md border border-tertiary/50 flex items-center justify-center shadow-lg opacity-90 group-hover:opacity-100 group-hover:scale-110 group-hover:bg-tertiary/25 transition-all duration-300">
                <Play size={20} fill="currentColor" className="text-tertiary ml-0.5" />
              </span>
            </span>
            <CardCaption title={title} action={type === 'youtube' ? (youtube?.isShort ? 'Play Short' : 'Play Video') : 'Play Film'} />
          </button>
          <SourceBadge reel={reel} />
          {canonicalInstagram && (
            <a
              href={canonicalInstagram}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-2 right-2 z-[2] w-7 h-7 rounded-full bg-black/45 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-tertiary hover:bg-black/80 transition-colors"
              title="Also on Instagram"
              aria-label={`${title} on Instagram (opens in a new tab)`}
            >
              <ExternalLink size={12} />
            </a>
          )}
        </>
      )}
    </div>
  );
}
