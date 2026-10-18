import { useState, useEffect, useRef } from 'react';
import { ExternalLink, Image as ImageIcon, AlertCircle, RefreshCw, Play, Loader2 } from 'lucide-react';
import InstagramIcon from '../icons/InstagramIcon';
import ReelVideoPlayer from './ReelVideoPlayer';
import { INSTAGRAM_PROFILE_URL, parseInstagramUrl } from '../../utils/instagram';
import { isDirectVideoUrl } from '../../utils/reelMedia';
import { getVideoContainerAspectClass, type VideoOrientation } from '../../utils/videoOrientation';

interface InstagramEmbedProps {
  url: string;
  fallbackThumbnail?: string;
  title?: string;
  aspectRatio?: 'square' | 'reel' | 'landscape' | 'auto';
  orientation?: VideoOrientation | null;
  autoLoad?: boolean;
  className?: string;
}

// Height of Instagram's embed header + footer around the media, used until the
// embed reports its real height via postMessage.
const EMBED_CHROME_PX = 210;
// If the frame hasn't loaded by then, assume it was blocked or is unavailable.
const EMBED_TIMEOUT_MS = 12000;

const MEDIA_RATIO: Record<VideoOrientation, number> = {
  portrait: 9 / 16,
  landscape: 16 / 9,
  square: 1,
};

const FRAME_MAX_WIDTH_PX: Record<VideoOrientation, number> = {
  portrait: 400,
  landscape: 640,
  square: 480,
};

// Instagram's embed needs at least 326px; above that, shrink so the whole frame fits the screen height.
const IG_MIN_EMBED_WIDTH_PX = 326;

export default function InstagramEmbed({
  url,
  fallbackThumbnail,
  title = 'Instagram Post',
  aspectRatio = 'auto',
  orientation,
  autoLoad = false,
  className = '',
}: InstagramEmbedProps) {
  // Portfolio entries may point at a hosted video file instead of Instagram.
  const isDirectVideo = Boolean(url && (isDirectVideoUrl(url) || url.includes('/video/')));

  const parsed = parseInstagramUrl(url);
  const [embedActive, setEmbedActive] = useState<boolean>(autoLoad);
  const [loading, setLoading] = useState<boolean>(true);
  const [embedBlocked, setEmbedBlocked] = useState<boolean>(false);
  const [frameHeight, setFrameHeight] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Never leave a permanent spinner: if the frame never loads, show the fallback.
  useEffect(() => {
    if (!embedActive || !loading || isDirectVideo) return;
    const timer = setTimeout(() => {
      setLoading(false);
      setEmbedBlocked(true);
    }, EMBED_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [embedActive, loading, isDirectVideo, reloadKey]);

  // Instagram's embed posts its rendered height (the same message embed.js uses).
  useEffect(() => {
    if (!embedActive || isDirectVideo) return;
    const handleMessage = (event: MessageEvent) => {
      if (!/^https:\/\/(www\.)?instagram\.com$/.test(event.origin)) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        const height = Number(data?.details?.height);
        if (data?.type === 'MEASURE' && height > 100 && height < 4000) {
          setFrameHeight(height);
        }
      } catch {
        // Not a message we understand
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [embedActive, isDirectVideo]);

  // Determine effective orientation
  const isReel = aspectRatio === 'reel' || (aspectRatio === 'auto' && parsed.type === 'reel');
  const effectiveOrientation: VideoOrientation = orientation
    ? orientation
    : isReel
    ? 'portrait'
    : aspectRatio === 'landscape'
    ? 'landscape'
    : aspectRatio === 'square'
    ? 'square'
    : 'portrait';

  const aspectClass = getVideoContainerAspectClass(effectiveOrientation);
  const originalUrl = parsed.canonicalUrl || url;

  // 1. Direct Video File Playback Mode (uploaded video files)
  if (isDirectVideo) {
    return (
      <ReelVideoPlayer
        src={url}
        poster={fallbackThumbnail}
        title={title}
        aspectRatio={MEDIA_RATIO[effectiveOrientation]}
        className={className}
      />
    );
  }

  // 2. Invalid Instagram URL state
  if (!parsed.isValid || !parsed.embedUrl) {
    return (
      <div className={`bg-surface-container-low border border-outline-variant/30 rounded-xl p-6 text-center space-y-4 ${className}`}>
        {fallbackThumbnail && (
          <div className="aspect-video max-w-md mx-auto rounded-lg overflow-hidden bg-surface-container-lowest">
            <img src={fallbackThumbnail} alt={title} className="w-full h-full object-cover" loading="lazy" />
          </div>
        )}
        <div className="space-y-1">
          <p className="font-display font-semibold text-on-surface text-lg">{title}</p>
          <p className="text-on-surface-variant text-xs">
            Direct Instagram embed is unavailable for this link.
          </p>
        </div>
        <a
          href={url || INSTAGRAM_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-tertiary/15 hover:bg-tertiary/25 text-tertiary border border-tertiary/30 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          <InstagramIcon size={14} /> Open on Instagram <ExternalLink size={12} />
        </a>
      </div>
    );
  }

  // 3. Cover Thumbnail Preview Mode (click-to-load: no Meta requests until the visitor asks)
  if (!embedActive) {
    return (
      <div className={`relative rounded-xl overflow-hidden border border-outline-variant/30 bg-surface-container-low ${aspectClass} ${className}`}>
        {fallbackThumbnail ? (
          <img
            src={fallbackThumbnail}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-container-lowest text-on-surface-variant">
            <InstagramIcon size={48} className="opacity-40" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-tertiary/20 border border-tertiary/40 flex items-center justify-center text-tertiary shadow-xl">
            {isReel ? <Play size={24} fill="#ffb77a" className="ml-1" /> : <InstagramIcon size={26} />}
          </div>

          <div className="space-y-1 max-w-xs">
            <p className="font-display font-semibold text-white text-lg leading-snug">{title}</p>
            <p className="text-white/70 text-xs">
              Plays inside Instagram's player. Loading it connects to Instagram (Meta), which may set cookies.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setEmbedBlocked(false);
                setEmbedActive(true);
              }}
              className="px-4 py-2.5 bg-tertiary text-on-tertiary rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-tertiary-fixed transition-colors shadow-sm cursor-pointer inline-flex items-center gap-1.5"
            >
              <Play size={13} fill="currentColor" /> {isReel ? 'Play Reel' : 'Load Post'}
            </button>
            <a
              href={originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 rounded-lg text-xs font-semibold text-on-surface transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>View on Instagram</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 4. Active Embed Mode. iframe onLoad only confirms the frame document arrived — a
  // private or deleted post still "loads" (Instagram shows its own notice inside), so
  // the Open-on-Instagram fallback stays visible at all times.
  const mediaRatio = MEDIA_RATIO[effectiveOrientation];
  const frameStyle = frameHeight
    ? { height: `${frameHeight}px` }
    : { paddingBottom: `calc(${(100 / mediaRatio).toFixed(3)}% + ${EMBED_CHROME_PX}px)` };

  return (
    <div
      className={`space-y-3 w-full mx-auto ${className}`}
      style={{
        maxWidth: `min(100%, clamp(${IG_MIN_EMBED_WIDTH_PX}px, calc((88vh - ${EMBED_CHROME_PX + 150}px) * ${mediaRatio.toFixed(4)}), ${FRAME_MAX_WIDTH_PX[effectiveOrientation]}px))`,
      }}
    >
      <div
        className="relative w-full rounded-xl overflow-hidden border border-outline-variant/30 bg-white shadow-lg"
        style={frameStyle}
      >
        {loading && (
          <div className="absolute inset-0 z-10 bg-surface-container-lowest flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="animate-spin text-tertiary" />
            <p className="text-xs text-on-surface-variant font-medium">Connecting to Instagram...</p>
          </div>
        )}

        <iframe
          key={reloadKey}
          ref={iframeRef}
          src={parsed.embedUrl}
          title={title}
          className="absolute inset-0 w-full h-full border-0"
          scrolling="no"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setEmbedBlocked(true);
          }}
        />

        {embedBlocked && (
          <div className="absolute inset-0 z-20 bg-surface-container-low p-6 flex flex-col items-center justify-center text-center gap-3">
            <AlertCircle size={32} className="text-tertiary" />
            <h4 className="font-display font-semibold text-on-surface text-base">Instagram content unavailable</h4>
            <p className="text-on-surface-variant text-xs max-w-xs leading-relaxed">
              The post may be private or removed, or your browser's privacy settings blocked Instagram.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <a
                href={originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-tertiary text-on-tertiary rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
              >
                <span>Open on Instagram</span>
                <ExternalLink size={12} />
              </a>
              {fallbackThumbnail && (
                <button
                  type="button"
                  onClick={() => setEmbedActive(false)}
                  className="px-3 py-2 bg-surface-container border border-outline-variant/40 rounded-lg text-xs font-semibold text-on-surface hover:bg-surface-container-high cursor-pointer"
                >
                  Show Photo
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        <div className="flex items-center gap-3">
          <a
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-tertiary hover:underline font-semibold"
          >
            <InstagramIcon size={13} />
            <span>Watch / View on Instagram</span>
            <ExternalLink size={12} />
          </a>

          {fallbackThumbnail && (
            <button
              type="button"
              onClick={() => setEmbedActive(false)}
              className="inline-flex items-center gap-1 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              <ImageIcon size={13} />
              <span>Switch to Photo</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setEmbedBlocked(false);
            setFrameHeight(null);
            setReloadKey(k => k + 1);
          }}
          className="inline-flex items-center gap-1 text-[11px] text-on-surface-variant/70 hover:text-on-surface transition-colors cursor-pointer"
          title="Reload embed frame"
        >
          <RefreshCw size={11} />
          <span>Reload Embed</span>
        </button>
      </div>
    </div>
  );
}
