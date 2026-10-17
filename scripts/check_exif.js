import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const data = JSON.parse(fs.readFileSync('scripts/scan_inventory_result.json', 'utf8'));

async function inspectExifDetails() {
  const exifReport = [];

  for (const item of data.inventory) {
    const meta = await sharp(item.filePath).metadata();
    const hasExif = Boolean(meta.exif);
    exifReport.push({
      file: item.relPath,
      hasExif,
      exifLength: meta.exif ? meta.exif.length : 0,
      format: meta.format,
      space: meta.space,
      channels: meta.channels,
      depth: meta.depth,
      density: meta.density,
      orientation: meta.orientation || 1
    });
  }

  const withExif = exifReport.filter(e => e.hasExif);
  console.log(`Files with EXIF metadata: ${withExif.length} / ${exifReport.length}`);
  console.log('Sample EXIF info:', exifReport.slice(0, 5));
}

inspectExifDetails();
