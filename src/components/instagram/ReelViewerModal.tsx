import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, ExternalLink, Film, X } from 'lucide-react';
import InstagramIcon from '../icons/InstagramIcon';
import InstagramEmbed from './InstagramEmbed';
import ReelVideoPlayer from './ReelVideoPlayer';
import { INSTAGRAM_HANDLE, INSTAGRAM_PROFILE_URL, cleanInstagramUrl, isValidInstagramUrl } from '../../utils/instagram';
import { getReelAspectRatio, getReelMediaType } from '../../utils/reelMedia';
import type { InstagramReel } from '../../types';

interface ReelViewerModalProps {
  reels: InstagramReel[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const MODAL_WIDTH = {
  portrait: 'max-w-md',
  square: 'max-w-xl',
  landscape: 'max-w-4xl',
} as const;

export default function ReelViewerModal({ reels, index, onClose, onNavigate }: ReelViewerModalProps) {
  const reel = reels[index];
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const hasPrev = index > 0;
  const hasNext = index < reels.length - 1;

  // Keyboard: Esc closes, arrows move between reels.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate(index - 1);
      if (e.key === 'ArrowRight' && hasNext) onNavigate(index + 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [index, hasPrev, hasNext, onClose, onNavigate]);

  // Lock background scroll and restore focus to the card that opened the viewer.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  if (!reel) return null;

  const mediaType = getReelMediaType(reel);
  const instagramUrl = reel.instagram_url || reel.url || '';
  const hasInstagramLink = isValidInstagramUrl(instagramUrl);
  const canonicalInstagramUrl = hasInstagramLink ? cleanInstagramUrl(instagramUrl) : '';
  const orientation = reel.orientation || 'portrait';
  const thumbnail = reel.thumbnail_url || reel.thumbnail || '';
  const typeLabel = mediaType === 'video' ? 'Studio Video' : reel.content_type === 'post' ? 'Instagram Post' : 'Instagram Reel';

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reel-viewer-title"
    >
      {hasPrev && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onNavigate(index - 1); }}
          aria-label="Previous reel"
          className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-tertiary/30 border border-white/15 text-white items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronLeft size={22} />
        </button>
      )}
      {hasNext && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onNavigate(index + 1); }}
          aria-label="Next reel"
          className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-tertiary/30 border border-white/15 text-white items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronRight size={22} />
        </button>
      )}

      <div
        className={`relative w-full ${MODAL_WIDTH[orientation]} bg-surface-container-low border border-outline-variant/30 rounded-2xl shadow-2xl p-4 sm:p-5 space-y-4 max-h-[94vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
          <div className="flex items-center gap-2.5 min-w-0">
            {mediaType === 'video'
              ? <Film size={18} className="text-tertiary shrink-0" />
              : <InstagramIcon size={18} className="text-tertiary shrink-0" />}
            <div className="min-w-0">
              <h3 id="reel-viewer-title" className="font-display font-semibold text-base text-on-surface truncate">
                {reel.title || typeLabel}
              </h3>
              <span className="text-[11px] text-tertiary uppercase tracking-wider font-semibold">
                {typeLabel}{reels.length > 1 ? ` · ${index + 1} / ${reels.length}` : ''}
              </span>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close viewer"
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {mediaType === 'video' && reel.video_url ? (
          <ReelVideoPlayer
            key={reel.id}
            src={reel.video_url}
            poster={thumbnail}
            title={reel.title}
            aspectRatio={getReelAspectRatio(reel)}
            maxHeight="68vh"
            autoPlay
            instagramUrl={canonicalInstagramUrl || undefined}
          />
        ) : (
          <InstagramEmbed
            key={reel.id}
            url={instagramUrl}
            fallbackThumbnail={thumbnail}
            title={reel.title}
            orientation={orientation}
            aspectRatio={reel.content_type === 'post' ? 'auto' : 'reel'}
            autoLoad
          />
        )}

        <div className="pt-3 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-outline-variant/20">
          {/* Mobile navigation */}
          {reels.length > 1 && (
            <div className="flex md:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => hasPrev && onNavigate(index - 1)}
                disabled={!hasPrev}
                aria-label="Previous reel"
                className="p-2 rounded-lg border border-outline-variant/30 text-on-surface disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => hasNext && onNavigate(index + 1)}
                disabled={!hasNext}
                aria-label="Next reel"
                className="p-2 rounded-lg border border-outline-variant/30 text-on-surface disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
          <a
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline text-on-surface-variant hover:text-tertiary transition-colors text-[11px]"
          >
            Follow {INSTAGRAM_HANDLE}
          </a>
          {hasInstagramLink && (
            <a
              href={canonicalInstagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-tertiary/15 hover:bg-tertiary/25 text-tertiary border border-tertiary/30 rounded-lg font-semibold tracking-wide transition-colors"
            >
              <span>Open on Instagram</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
