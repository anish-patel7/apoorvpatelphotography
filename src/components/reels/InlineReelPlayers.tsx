import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { getYouTubeEmbedUrl } from '../../utils/youtube';

/**
 * Players that live inside a homepage reel card. Each one fills its card, starts after
 * the visitor's click, pauses when scrolled out of view, and is unmounted (releasing
 * the media) when another card starts playing.
 */

/** Calls `onHidden` when less than a quarter of the element is on screen. */
function usePauseWhenHidden(ref: React.RefObject<HTMLElement | null>, onHidden: () => void) {
  const callback = useRef(onHidden);
  useEffect(() => { callback.current = onHidden; });
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (!entry.isIntersecting || entry.intersectionRatio < 0.25) callback.current(); },
      { threshold: [0, 0.25] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
}

function PlayerError({ title, message, externalUrl, externalLabel }: { title: string; message: string; externalUrl?: string; externalLabel?: string }) {
  return (
    <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center bg-surface-container-lowest">
      <AlertCircle size={24} className="text-tertiary" />
      <p className="font-display text-sm font-semibold text-on-surface">{title}</p>
      <p className="text-[11px] text-on-surface-variant leading-relaxed">{message}</p>
      {externalUrl && (
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 bg-tertiary text-on-tertiary rounded-md text-[10px] font-bold uppercase tracking-wider"
        >
          {externalLabel} <ExternalLink size={11} />
        </a>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <span className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
      <Loader2 size={28} className="animate-spin text-tertiary" />
    </span>
  );
}

interface InlineVideoPlayerProps {
  src: string;
  poster?: string;
  title: string;
  /** 'cover' fills a portrait card; 'contain' keeps landscape/square videos uncropped. */
  fit: 'cover' | 'contain';
  instagramUrl?: string;
}

/** Native HTML5 player: play/pause, sound, seek bar, replay and fullscreen come from the browser. */
export function InlineVideoPlayer({ src, poster, title, fit, instagramUrl }: InlineVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.focus({ preventScroll: true });
    // Started by a click, so browsers normally allow sound. If not, play muted;
    // the visitor can unmute from the controls.
    v.play().catch(() => {
      v.muted = true;
      v.play().catch(() => setLoading(false));
    });
  }, [src]);

  usePauseWhenHidden(videoRef, () => videoRef.current?.pause());

  if (failed) {
    return (
      <PlayerError
        title="This video can't be played here"
        message="Your browser may not support this video format, or the file is no longer available."
        externalUrl={instagramUrl}
        externalLabel="Watch on Instagram"
      />
    );
  }

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        poster={poster || undefined}
        title={title}
        aria-label={title}
        controls
        playsInline
        preload="auto"
        controlsList="nodownload"
        onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        onPlaying={() => setLoading(false)}
        onError={() => setFailed(true)}
        className={`absolute inset-0 w-full h-full bg-black ${fit === 'cover' ? 'object-cover' : 'object-contain'}`}
      >
        Your browser does not support HTML5 video.
      </video>
      {loading && <Spinner />}
    </>
  );
}

const YT_ORIGIN = 'https://www.youtube-nocookie.com';

/** YouTube's player error codes that mean "not playable on other websites". */
const YT_ERRORS: Record<number, string> = {
  2: 'This YouTube link is not valid.',
  5: 'This video can\'t be played in this browser.',
  100: 'This video has been removed or made private on YouTube.',
  101: 'The owner of this video doesn\'t allow it to be played on other websites.',
  150: 'The owner of this video doesn\'t allow it to be played on other websites.',
  153: 'YouTube couldn\'t verify this website, so the video can\'t be played here.',
};

interface InlineYouTubePlayerProps {
  videoId: string;
  title: string;
  watchUrl: string;
}

/** Official YouTube embed, loaded only after the visitor presses Play. */
export function InlineYouTubePlayer({ videoId, title, watchUrl }: InlineYouTubePlayerProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [src] = useState(() => getYouTubeEmbedUrl(videoId));

  const send = (message: Record<string, unknown>) => {
    frameRef.current?.contentWindow?.postMessage(JSON.stringify({ ...message, id: videoId, channel: 'widget' }), YT_ORIGIN);
  };

  // YouTube's embed reports errors (e.g. embedding disabled) through postMessage
  // once the page says it is listening — the same protocol as the official IFrame API.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frameRef.current?.contentWindow || typeof e.data !== 'string') return;
      try {
        const data = JSON.parse(e.data);
        if (data?.event === 'onError') setErrorCode(Number(data.info));
        if (data?.event === 'onReady' || data?.event === 'initialDelivery') setLoading(false);
      } catch {
        // Not a YouTube player message.
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  usePauseWhenHidden(frameRef, () => send({ event: 'command', func: 'pauseVideo', args: [] }));

  if (errorCode !== null) {
    return (
      <PlayerError
        title="Can't play this video here"
        message={YT_ERRORS[errorCode] || 'YouTube is not allowing this video to play on this website right now.'}
        externalUrl={watchUrl}
        externalLabel="Watch on YouTube"
      />
    );
  }

  return (
    <>
      <iframe
        ref={frameRef}
        src={src}
        title={title}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => {
          setLoading(false);
          send({ event: 'listening' });
        }}
        className="absolute inset-0 w-full h-full bg-black border-0"
      />
      {loading && <Spinner />}
    </>
  );
}
