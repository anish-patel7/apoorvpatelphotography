import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';
import InstagramIcon from '../icons/InstagramIcon';

interface ReelVideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  /** Width / height. Defaults to 9:16. */
  aspectRatio?: number;
  /** CSS length capping the player height, e.g. "70vh". */
  maxHeight?: string;
  /** Try to start playback (with sound) as soon as the player mounts. */
  autoPlay?: boolean;
  /** Optional original Instagram post shown if the file cannot be played. */
  instagramUrl?: string;
  className?: string;
}

/**
 * Native HTML5 player for uploaded reels. The browser supplies play/pause,
 * volume and fullscreen controls; the box keeps the video's real aspect ratio
 * and scales down to fit the viewport so nothing is cropped.
 */
export default function ReelVideoPlayer({
  src,
  poster,
  title = 'Video',
  aspectRatio = 9 / 16,
  maxHeight = '72vh',
  autoPlay = false,
  instagramUrl,
  className = '',
}: ReelVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!autoPlay || !videoRef.current) return;
    // Opening the viewer is a user gesture, so most browsers allow playback with sound.
    // If they don't, the visitor can press play on the native controls.
    videoRef.current.play().catch(() => {});
  }, [autoPlay, src]);

  const ratio = aspectRatio > 0 ? aspectRatio : 9 / 16;
  const style = {
    aspectRatio: String(ratio),
    width: `min(100%, calc(${maxHeight} * ${ratio.toFixed(4)}))`,
  };

  if (failed) {
    return (
      <div
        className={`mx-auto rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex flex-col items-center justify-center gap-3 p-6 text-center ${className}`}
        style={style}
      >
        <AlertCircle size={28} className="text-tertiary" />
        <p className="font-display font-semibold text-on-surface">This video can't be played here</p>
        <p className="text-xs text-on-surface-variant max-w-xs">
          Your browser may not support this video format, or the file is no longer available.
        </p>
        {instagramUrl && (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-tertiary text-on-tertiary rounded-lg text-xs font-semibold uppercase tracking-wider"
          >
            <InstagramIcon size={13} /> Watch on Instagram <ExternalLink size={12} />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className={`relative mx-auto rounded-xl overflow-hidden border border-outline-variant/30 bg-black shadow-lg ${className}`} style={style}>
      <video
        ref={videoRef}
        src={src}
        poster={poster || undefined}
        title={title}
        controls
        playsInline
        preload="metadata"
        controlsList="nodownload"
        onError={() => setFailed(true)}
        className="absolute inset-0 w-full h-full object-contain"
      >
        Your browser does not support HTML5 video.
      </video>
    </div>
  );
}
