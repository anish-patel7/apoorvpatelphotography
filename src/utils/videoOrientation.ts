/**
 * Video Orientation & Dimensions Detection Utilities
 * Detects actual videoWidth and videoHeight from HTMLVideoElement,
 * calculates aspect ratio, and classifies orientation as portrait, landscape, or square.
 */

export type VideoOrientation = 'portrait' | 'landscape' | 'square';

export interface VideoDimensionsMetadata {
  video_width: number;
  video_height: number;
  aspect_ratio: number;
  orientation: VideoOrientation;
  aspect_ratio_label: string; // e.g. "9:16", "16:9", "1:1" or "4:5"
  /** false when the browser could not read real dimensions and defaults were used */
  detected?: boolean;
}

/**
 * Classifies width and height into 'portrait', 'landscape', or 'square'
 * using a tolerance threshold for approximately equal dimensions.
 */
export function classifyOrientation(width: number, height: number, tolerance = 0.05): VideoOrientation {
  if (!width || !height) return 'portrait';
  const ratio = width / height;

  // If width and height are within tolerance, it is considered square
  if (Math.abs(ratio - 1) <= tolerance) {
    return 'square';
  }

  // Portrait: height > width
  if (height > width) {
    return 'portrait';
  }

  // Landscape: width > height
  return 'landscape';
}

/**
 * Formats a user-friendly aspect ratio label from dimensions
 */
export function getAspectRatioLabel(width: number, height: number, orientation: VideoOrientation): string {
  if (!width || !height) {
    return orientation === 'portrait' ? '9:16' : orientation === 'landscape' ? '16:9' : '1:1';
  }

  const ratio = width / height;
  if (orientation === 'square') return '1:1';

  // Common standard aspect ratio approximations
  if (Math.abs(ratio - 9 / 16) < 0.08) return '9:16';
  if (Math.abs(ratio - 16 / 9) < 0.08) return '16:9';
  if (Math.abs(ratio - 4 / 5) < 0.06) return '4:5';
  if (Math.abs(ratio - 5 / 4) < 0.06) return '5:4';
  if (Math.abs(ratio - 2 / 3) < 0.06) return '2:3';
  if (Math.abs(ratio - 3 / 2) < 0.06) return '3:2';

  return `${width}:${height}`;
}

const FALLBACK_VIDEO_DIMENSIONS: VideoDimensionsMetadata = {
  video_width: 1080,
  video_height: 1920,
  aspect_ratio: 0.56,
  orientation: 'portrait',
  aspect_ratio_label: '9:16',
  detected: false,
};

/**
 * Reads actual video dimensions from a File or URL using an in-memory HTMLVideoElement.
 * Waits for the `loadedmetadata` event. When the browser cannot read the file
 * (e.g. an unsupported codec) it resolves with portrait defaults and `detected: false`.
 */
export function detectVideoDimensions(source: File | string): Promise<VideoDimensionsMetadata> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve(FALLBACK_VIDEO_DIMENSIONS);
      return;
    }

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    let objectUrl: string | null = null;
    if (typeof source === 'string') {
      video.src = source;
    } else if (source && typeof (source as Blob).size === 'number') {
      objectUrl = URL.createObjectURL(source);
      video.src = objectUrl;
    } else {
      reject(new Error('Invalid video source provided.'));
      return;
    }

    let settled = false;
    const finish = (result: VideoDimensionsMetadata) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      video.removeAttribute('src');
      video.load();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(result);
    };

    const handleSuccess = () => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) {
        finish(FALLBACK_VIDEO_DIMENSIONS);
        return;
      }
      const orientation = classifyOrientation(width, height);
      finish({
        video_width: width,
        video_height: height,
        aspect_ratio: Number((width / height).toFixed(2)),
        orientation,
        aspect_ratio_label: getAspectRatioLabel(width, height, orientation),
        detected: true,
      });
    };

    video.onloadedmetadata = handleSuccess;
    video.onerror = () => finish(FALLBACK_VIDEO_DIMENSIONS);

    // Safety timeout in case metadata loading stalls
    const timer = setTimeout(() => {
      if (video.videoWidth && video.videoHeight) handleSuccess();
      else finish(FALLBACK_VIDEO_DIMENSIONS);
    }, 8000);
  });
}

/**
 * Captures a still frame from a video (a local file, or a stored video URL that allows
 * cross-origin reads, as Supabase Storage does) as a JPEG blob for an automatic thumbnail.
 * Fade-ins often start on black, so several moments are tried and the first frame that
 * isn't almost black is used. Resolves null if the browser cannot decode the video.
 */
export function captureVideoFrame(source: File | string, atSeconds = 1, maxEdge = 1080): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }

    const video = document.createElement('video');
    const objectUrl = typeof source === 'string' ? null : URL.createObjectURL(source);
    if (typeof source === 'string') video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl || (source as string);

    const canvas = document.createElement('canvas');
    let candidates: number[] = [];
    let fallback: Blob | null = null;
    let settled = false;
    const finish = (blob: Blob | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      video.removeAttribute('src');
      video.load();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(blob);
    };
    const next = () => {
      const t = candidates.shift();
      if (t === undefined) finish(fallback);
      else video.currentTime = t;
    };

    /** Average brightness (0–255) of a small copy of the current frame. */
    const brightness = (): number => {
      const probe = document.createElement('canvas');
      probe.width = 32;
      probe.height = 32;
      const pctx = probe.getContext('2d');
      if (!pctx) return 255;
      pctx.drawImage(video, 0, 0, 32, 32);
      const { data } = pctx.getImageData(0, 0, 32, 32);
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      return sum / (data.length / 4);
    };

    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const first = Math.min(atSeconds, Math.max(0, duration / 2));
      candidates = [first, duration * 0.25, duration * 0.5, duration * 0.75].filter((t, i, all) => t >= 0 && all.indexOf(t) === i);
      next();
    };

    video.onseeked = () => {
      const { videoWidth: w, videoHeight: h } = video;
      if (!w || !h) {
        finish(null);
        return;
      }
      const scale = Math.min(1, maxEdge / Math.max(w, h));
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        finish(null);
        return;
      }
      let dark = false;
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        dark = brightness() < 14;
      } catch {
        // Cross-origin video without CORS headers: no frame can be read.
        finish(null);
        return;
      }
      canvas.toBlob(blob => {
        if (!fallback) fallback = blob;
        if (blob && !dark) finish(blob);
        else next();
      }, 'image/jpeg', 0.85);
    };

    video.onerror = () => finish(fallback);
    const timer = setTimeout(() => finish(fallback), 15000);
  });
}

/**
 * Inspects image/thumbnail dimensions as an orientation preview hint
 */
export function detectImageDimensions(source: File | string): Promise<{ width: number; height: number; orientation: VideoOrientation; label: string }> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({ width: 1080, height: 1920, orientation: 'portrait', label: '9:16' });
      return;
    }

    const img = new Image();
    let objectUrl: string | null = null;

    if (typeof source === 'string') {
      img.src = source;
    } else if (source && typeof (source as Blob).size === 'number') {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    }

    const cleanup = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };

    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const orientation = classifyOrientation(width, height);
      const label = getAspectRatioLabel(width, height, orientation);
      cleanup();
      resolve({ width, height, orientation, label });
    };

    img.onerror = () => {
      cleanup();
      resolve({ width: 1080, height: 1920, orientation: 'portrait', label: '9:16' });
    };

    setTimeout(() => {
      cleanup();
      resolve({ width: 1080, height: 1920, orientation: 'portrait', label: '9:16' });
    }, 4000);
  });
}

/**
 * Returns Tailwind aspect ratio class for responsive container based on orientation.
 */
export function getVideoContainerAspectClass(orientation?: VideoOrientation | null): string {
  switch (orientation) {
    case 'landscape':
      return 'aspect-video w-full max-w-[720px] mx-auto min-h-[280px] sm:min-h-[405px]';
    case 'square':
      return 'aspect-square w-full max-w-[480px] sm:max-w-[540px] mx-auto min-h-[340px] sm:min-h-[460px]';
    case 'portrait':
    default:
      return 'aspect-[9/16] w-full max-w-[340px] sm:max-w-[380px] mx-auto min-h-[480px] sm:min-h-[580px]';
  }
}
