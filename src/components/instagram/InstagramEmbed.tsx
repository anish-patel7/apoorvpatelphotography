import { useState, useEffect } from 'react';
import { ExternalLink, Image as ImageIcon, AlertCircle, RefreshCw, Play, Loader2 } from 'lucide-react';
import InstagramIcon from '../icons/InstagramIcon';
import { parseInstagramUrl } from '../../utils/instagram';

interface InstagramEmbedProps {
  url: string;
  fallbackThumbnail?: string;
  title?: string;
  aspectRatio?: 'square' | 'reel' | 'auto';
  autoLoad?: boolean;
  className?: string;
}

export default function InstagramEmbed({
  url,
  fallbackThumbnail,
  title = 'Instagram Post',
  aspectRatio = 'auto',
  autoLoad = false,
  className = '',
}: InstagramEmbedProps) {
  const parsed = parseInstagramUrl(url);
  const [embedActive, setEmbedActive] = useState<boolean>(autoLoad);
  const [loading, setLoading] = useState<boolean>(true);
  const [embedBlocked, setEmbedBlocked] = useState<boolean>(false);

  // Safety timer: Never leave a permanent loading spinner if network stalls or iframe fails to notify
  useEffect(() => {
    if (embedActive && loading) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [embedActive, loading]);

  // Determine responsive aspect ratio class
  const detectedType = parsed.type;
  const isReel = aspectRatio === 'reel' || (aspectRatio === 'auto' && detectedType === 'reel');
  const aspectClass = isReel
    ? 'aspect-[9/16] w-full max-w-[340px] sm:max-w-[380px] mx-auto min-h-[480px] sm:min-h-[580px]'
    : 'aspect-square sm:aspect-[4/5] w-full max-w-[480px] sm:max-w-[540px] mx-auto min-h-[360px] sm:min-h-[460px]';

  // 1. Invalid Instagram URL state
  if (!parsed.isValid || !parsed.embedUrl) {
    return (
      <div className={`bg-surface-container-low border border-outline-variant/30 rounded-xl p-6 text-center space-y-4 ${className}`}>
        {fallbackThumbnail && (
          <div className="aspect-video max-w-md mx-auto rounded-lg overflow-hidden bg-surface-container-lowest">
            <img src={fallbackThumbnail} alt={title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="space-y-1">
          <p className="font-display font-semibold text-on-surface text-lg">{title}</p>
          <p className="text-on-surface-variant text-xs">
            Direct Instagram embed is unavailable for this link.
          </p>
        </div>
        <a
          href={url || 'https://www.instagram.com/apoorvpatel_photography/'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-tertiary/15 hover:bg-tertiary/25 text-tertiary border border-tertiary/30 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          <InstagramIcon size={14} /> Open on Instagram <ExternalLink size={12} />
        </a>
      </div>
    );
  }

  // 2. Cover Thumbnail Preview Mode (Privacy-conscious click-to-load)
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
            <p className="text-white/70 text-xs">Click below to load interactive Instagram content</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setEmbedActive(true);
              }}
              className="px-4 py-2.5 bg-tertiary text-on-tertiary rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-tertiary-fixed transition-colors shadow-sm cursor-pointer"
            >
              Load Interactive Embed
            </button>
            <a
              href={parsed.canonicalUrl || url}
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

  // 3. Active Embed Mode (Interactive iframe with fallback toolbar)
  // Note: iframe onLoad confirms document frame receipt, but does not guarantee Meta third-party rendering.
  // The fallback toolbar remains permanently accessible so the user is never stranded.
  return (
    <div className={`space-y-3 ${className}`}>
      <div className={`relative rounded-xl overflow-hidden border border-outline-variant/30 bg-surface-container-lowest shadow-lg ${aspectClass}`}>
        {/* Loading Spinner overlay */}
        {loading && (
          <div className="absolute inset-0 z-10 bg-surface-container-lowest flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="animate-spin text-tertiary" />
            <p className="text-xs text-on-surface-variant font-medium">Connecting to Instagram...</p>
          </div>
        )}

        {/* Sandboxed Embed Iframe */}
        <iframe
          src={parsed.embedUrl}
          title={title}
          className="w-full h-full border-0"
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setEmbedBlocked(true);
          }}
        />

        {/* Blocked Embed Overlay (If cross-site cookies / privacy policy prevented frame rendering) */}
        {embedBlocked && (
          <div className="absolute inset-0 z-20 bg-surface-container-low p-6 flex flex-col items-center justify-center text-center gap-3">
            <AlertCircle size={32} className="text-tertiary" />
            <h4 className="font-display font-semibold text-on-surface text-base">Embed Blocked by Browser</h4>
            <p className="text-on-surface-variant text-xs max-w-xs leading-relaxed">
              Your browser privacy settings or ad-blocker prevented the Instagram frame from displaying.
            </p>
            <div className="flex gap-2 pt-2">
              <a
                href={parsed.canonicalUrl || url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-tertiary text-on-tertiary rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
              >
                <span>Open Post on Instagram</span>
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

      {/* Embed Controls & Fallback Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        <div className="flex items-center gap-3">
          <a
            href={parsed.canonicalUrl || url}
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
