import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const data = JSON.parse(fs.readFileSync('scripts/scan_inventory_result.json', 'utf8'));

// Test optimization for 1 image from each folder
const sampleFiles = [
  data.inventory.find(i => i.folderName === 'baby shower'),
  data.inventory.find(i => i.folderName === 'engajment'),
  data.inventory.find(i => i.folderName === 'prewedding'),
  data.inventory.find(i => i.folderName === 'wedding')
];

async function benchmark() {
  const testOutputDir = path.join(process.cwd(), 'scripts', 'benchmark_output');
  if (!fs.existsSync(testOutputDir)) fs.mkdirSync(testOutputDir, { recursive: true });

  const results = [];

  for (const item of sampleFiles) {
    const rawBuffer = fs.readFileSync(item.filePath);
    const origSize = rawBuffer.length;

    // Gallery display version: max 2048px on longest side, quality 85 webp, auto-rotate via .rotate(), strip private EXIF
    const galleryWebp = await sharp(rawBuffer)
      .rotate() // auto-rotates based on EXIF orientation tag
      .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85, effort: 4 })
      .toBuffer();

    // Thumbnail version: max 600px, quality 80 webp
    const thumbWebp = await sharp(rawBuffer)
      .rotate()
      .resize({ width: 600, height: 600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })
      .toBuffer();

    const gallerySize = galleryWebp.length;
    const thumbSize = thumbWebp.length;
    const totalOptimized = gallerySize + thumbSize;
    const savingsPercent = (((origSize - totalOptimized) / origSize) * 100).toFixed(1);

    results.push({
      folder: item.folderName,
      file: item.fileName,
      originalMB: (origSize / (1024 * 1024)).toFixed(2),
      galleryWebpKB: (gallerySize / 1024).toFixed(1),
      thumbWebpKB: (thumbSize / 1024).toFixed(1),
      savingsPercent: `${savingsPercent}%`
    });
  }

  console.log(JSON.stringify(results, null, 2));

  // Clean up benchmark folder if needed
  if (fs.existsSync(testOutputDir)) {
    fs.rmSync(testOutputDir, { recursive: true, force: true });
  }
}

benchmark();
