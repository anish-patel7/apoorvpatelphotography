import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const WORK_DIR = 'g:\\Anish Project\\apoorvpatelphotography\\Work';

async function scanWorkDirectory(rootDir) {
  const inventory = [];
  const errors = [];
  const hashMap = new Map();
  const duplicates = [];

  function walk(dir) {
    let files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(walk(fullPath));
      } else {
        files.push(fullPath);
      }
    }
    return files;
  }

  const allFilePaths = walk(rootDir);

  for (const filePath of allFilePaths) {
    const relPath = path.relative(rootDir, filePath);
    const folderName = path.dirname(relPath);
    const fileName = path.basename(filePath);
    const ext = path.extname(fileName).toLowerCase();
    const stats = fs.statSync(filePath);
    const sizeBytes = stats.size;

    // Compute SHA-256
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    if (hashMap.has(hash)) {
      duplicates.push({
        fileA: hashMap.get(hash),
        fileB: relPath,
        sizeBytes,
        hash
      });
    } else {
      hashMap.set(hash, relPath);
    }

    try {
      const metadata = await sharp(fileBuffer).metadata();
      
      // Calculate true visual dimensions taking EXIF orientation into account
      // Orientations 5, 6, 7, 8 swap width and height
      let visualWidth = metadata.width || 0;
      let visualHeight = metadata.height || 0;
      const exifOrientation = metadata.orientation || 1;
      
      if (exifOrientation >= 5 && exifOrientation <= 8) {
        visualWidth = metadata.height || 0;
        visualHeight = metadata.width || 0;
      }

      let orientation = 'landscape';
      if (visualHeight > visualWidth) {
        orientation = 'portrait';
      } else if (visualHeight === visualWidth) {
        orientation = 'square';
      }

      const aspectRatio = visualWidth && visualHeight ? (visualWidth / visualHeight).toFixed(2) : null;
      const hasGps = Boolean(metadata.exif && metadata.exif.length > 0); // we will verify exif details

      inventory.push({
        filePath,
        relPath,
        folderName,
        fileName,
        ext,
        format: metadata.format,
        sizeBytes,
        sizeMB: (sizeBytes / (1024 * 1024)).toFixed(2),
        width: metadata.width,
        height: metadata.height,
        visualWidth,
        visualHeight,
        exifOrientation,
        orientation,
        aspectRatio,
        hasExif: Boolean(metadata.exif),
        hasGps,
        hash
      });
    } catch (err) {
      errors.push({
        filePath,
        relPath,
        folderName,
        fileName,
        sizeBytes,
        error: err.message
      });
    }
  }

  return { inventory, errors, duplicates };
}

scanWorkDirectory(WORK_DIR).then(res => {
  const outputPath = path.join(process.cwd(), 'scripts', 'scan_inventory_result.json');
  fs.writeFileSync(outputPath, JSON.stringify(res, null, 2));
  console.log(`Scan completed! Analyzed ${res.inventory.length} valid files, found ${res.errors.length} errors, and ${res.duplicates.length} exact duplicates.`);
}).catch(err => {
  console.error('Scan error:', err);
});
