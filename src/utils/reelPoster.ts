/**
 * Branded fallback poster for reels with no cover image.
 * One layout is shared by the live placeholder (SVG, see BrandedReelPoster) and the
 * JPEG the admin saves to storage (canvas, see renderReelPosterJpeg), so both look the same.
 * Portrait 9:16, Apoorv Patel Photography colours and typography; never a real photo.
 * No title is printed: reel cards already show the title in their caption.
 */

export const POSTER_WIDTH = 1080;
export const POSTER_HEIGHT = 1920;

export const POSTER_COLORS = {
  backgroundTop: '#1d1915',
  backgroundBottom: '#0d0c0b',
  glow: 'rgba(255, 183, 122, 0.22)',
  gold: '#ffb77a',
  goldSoft: 'rgba(255, 183, 122, 0.45)',
  text: '#f4efe8',
  textMuted: 'rgba(244, 239, 232, 0.62)',
};

export const POSTER_FONTS = {
  display: "'Bodoni Moda', Georgia, 'Times New Roman', serif",
  body: "'Montserrat', 'Helvetica Neue', Arial, sans-serif",
};

export const POSTER_BRAND = 'APOORV PATEL PHOTOGRAPHY';
export const POSTER_HANDLE = '@apoorvpatel_photography';
export const POSTER_TAGLINE = 'inspired by innovation';

/** Vertical positions on the 1080×1920 poster. The bottom ~25% is left clear for card captions. */
export const LAYOUT = {
  brandY: 210,
  dividerY: 262,
  labelY: 320,
  emblemY: POSTER_HEIGHT / 2,
  ringR: 150,
  taglineY: POSTER_HEIGHT / 2 + 290,
  handleY: POSTER_HEIGHT / 2 + 360,
};

/** Draws the poster on a 1080×1920 canvas and returns a JPEG blob. */
export async function renderReelPosterJpeg(label = 'REEL'): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = POSTER_WIDTH;
  canvas.height = POSTER_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available in this browser');

  // Use the site fonts when the browser has them loaded.
  try {
    await Promise.all([
      document.fonts?.load(`italic 500 44px ${POSTER_FONTS.display}`),
      document.fonts?.load(`600 30px ${POSTER_FONTS.body}`),
    ]);
  } catch {
    // Fallback fonts are fine.
  }

  const W = POSTER_WIDTH;
  const H = POSTER_HEIGHT;
  const c = POSTER_COLORS;

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, c.backgroundTop);
  bg.addColorStop(1, c.backgroundBottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, LAYOUT.emblemY, 0, W / 2, LAYOUT.emblemY, W * 0.75);
  glow.addColorStop(0, c.glow);
  glow.addColorStop(1, 'rgba(255, 183, 122, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Thin inset frame
  ctx.strokeStyle = c.goldSoft;
  ctx.lineWidth = 3;
  ctx.strokeRect(54, 54, W - 108, H - 108);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Brand + label at the top (the bottom stays clear for card captions)
  ctx.fillStyle = c.text;
  ctx.font = `600 32px ${POSTER_FONTS.body}`;
  drawSpaced(ctx, POSTER_BRAND, W / 2, LAYOUT.brandY, 7);
  ctx.fillStyle = c.gold;
  ctx.fillRect(W / 2 - 60, LAYOUT.dividerY, 120, 3);
  ctx.font = `600 30px ${POSTER_FONTS.body}`;
  drawSpaced(ctx, label, W / 2, LAYOUT.labelY, 12);

  // Centred play emblem (cards place their own button inside this ring)
  const cx = W / 2;
  const cy = LAYOUT.emblemY;
  ctx.lineWidth = 6;
  ctx.strokeStyle = c.gold;
  ctx.beginPath();
  ctx.arc(cx, cy, LAYOUT.ringR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = c.gold;
  ctx.beginPath();
  ctx.moveTo(cx - 34, cy - 56);
  ctx.lineTo(cx - 34, cy + 56);
  ctx.lineTo(cx + 62, cy);
  ctx.closePath();
  ctx.fill();

  // Handle below the emblem
  ctx.fillStyle = c.textMuted;
  ctx.font = `italic 500 44px ${POSTER_FONTS.display}`;
  ctx.fillText(POSTER_TAGLINE, W / 2, LAYOUT.taglineY);
  ctx.font = `400 30px ${POSTER_FONTS.body}`;
  ctx.fillText(POSTER_HANDLE, W / 2, LAYOUT.handleY);

  return new Promise((resolve, reject) =>
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Could not create the poster image'))), 'image/jpeg', 0.88)
  );
}

/** Letter-spaced centred text (canvas letterSpacing is not supported everywhere). */
function drawSpaced(ctx: CanvasRenderingContext2D, text: string, centerX: number, y: number, spacing: number) {
  const chars = [...text];
  const widths = chars.map(ch => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let x = centerX - total / 2;
  const align = ctx.textAlign;
  ctx.textAlign = 'left';
  chars.forEach((ch, i) => {
    ctx.fillText(ch, x, y);
    x += widths[i] + spacing;
  });
  ctx.textAlign = align;
}
