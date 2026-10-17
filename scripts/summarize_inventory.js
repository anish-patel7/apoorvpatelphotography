import fs from 'node:fs';
import path from 'node:path';

const data = JSON.parse(fs.readFileSync('scripts/scan_inventory_result.json', 'utf8'));
const { inventory, errors, duplicates } = data;

const folderSummary = {};

for (const item of inventory) {
  const f = item.folderName;
  if (!folderSummary[f]) {
    folderSummary[f] = {
      folder: f,
      photos: 0,
      videos: 0,
      totalBytes: 0,
      formats: new Set(),
      orientations: { portrait: 0, landscape: 0, square: 0 },
      dimensions: new Set(),
      items: []
    };
  }

  const isVideo = ['.mp4', '.mov', '.avi', '.mkv'].includes(item.ext);
  if (isVideo) {
    folderSummary[f].videos++;
  } else {
    folderSummary[f].photos++;
  }

  folderSummary[f].totalBytes += item.sizeBytes;
  folderSummary[f].formats.add(item.format.toUpperCase());
  folderSummary[f].orientations[item.orientation] = (folderSummary[f].orientations[item.orientation] || 0) + 1;
  folderSummary[f].dimensions.add(`${item.visualWidth}x${item.visualHeight}`);
  folderSummary[f].items.push(item);
}

const report = Object.values(folderSummary).map(f => ({
  folderName: f.folder,
  photoCount: f.photos,
  videoCount: f.videos,
  totalSizeMB: (f.totalBytes / (1024 * 1024)).toFixed(2),
  formats: Array.from(f.formats),
  orientations: f.orientations,
  dimensionsSample: Array.from(f.dimensions).slice(0, 5),
  totalDimensionsCount: f.dimensions.size
}));

console.log(JSON.stringify(report, null, 2));

// Check for similar file sizes (within 100 bytes) across folders or within same folder
const sizeMap = new Map();
const potentialNearDuplicates = [];
for (const item of inventory) {
  for (const [otherSize, otherItem] of sizeMap.entries()) {
    if (Math.abs(item.sizeBytes - otherSize) === 0 && item.relPath !== otherItem.relPath) {
      potentialNearDuplicates.push({ fileA: otherItem.relPath, fileB: item.relPath, size: item.sizeBytes });
    }
  }
  sizeMap.set(item.sizeBytes, item);
}
console.log('Potential exact size matches:', potentialNearDuplicates);
