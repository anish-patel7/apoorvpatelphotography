/**
 * Makes an oversized photo fit under `maxBytes` in the browser before uploading, so phone
 * photos (often 10–20 MB) can be added without the admin resizing them first.
 * The long edge is capped at 4096 px — far larger than the site ever displays — and the
 * JPEG/WebP quality is stepped down only as far as needed. Files already under the limit,
 * and formats the browser can't re-encode, are returned unchanged.
 */

const SHRINKABLE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_EDGES = [4096, 3200, 2560, 2048, 1600];
const QUALITIES = [0.9, 0.85, 0.8, 0.7];

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === 'function') {
    // 'from-image' applies the camera's EXIF rotation so portrait photos stay upright.
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  await img.decode();
  return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
}

function encode(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, type, quality));
}

export async function shrinkImageToFit(file: File, maxBytes: number): Promise<File> {
  if (file.size <= maxBytes || !SHRINKABLE_TYPES.includes(file.type)) return file;

  const image = await decode(file);
  try {
    // PNGs are re-encoded as JPEG (photos) — WebP stays WebP.
    const outType = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
    const outExt = outType === 'image/webp' ? 'webp' : 'jpg';
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    for (const edge of MAX_EDGES) {
      const scale = Math.min(1, edge / Math.max(image.width, image.height));
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      if (outType === 'image/jpeg') {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(image.source, 0, 0, canvas.width, canvas.height);
      for (const quality of QUALITIES) {
        const blob = await encode(canvas, outType, quality);
        if (blob && blob.size <= maxBytes) {
          const name = `${file.name.replace(/\.[^/.]+$/, '')}.${outExt}`;
          return new File([blob], name, { type: outType, lastModified: file.lastModified });
        }
      }
    }
    return file;
  } finally {
    image.close();
  }
}
