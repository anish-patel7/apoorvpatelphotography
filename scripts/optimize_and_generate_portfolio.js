import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const WORK_DIR = 'g:\\Anish Project\\apoorvpatelphotography\\Work';
const PUBLIC_PORTFOLIO_DIR = path.join(process.cwd(), 'public', 'images', 'portfolio');

const folderProjectConfig = {
  'wedding': {
    slug: 'wedding-collection',
    title: 'Wedding Collection',
    category: 'Wedding',
    description: 'Timeless moments of romance, ritual, and celebration captured with emotional depth and authentic artistry.',
    location: 'Gujarat, India',
    date: '2026',
    featured: true,
    coverFile: 'IMG_5756.JPEG'
  },
  'prewedding': {
    slug: 'pre-wedding-collection',
    title: 'Pre-Wedding Collection',
    category: 'Pre-Wedding',
    description: 'Intimate pre-wedding visual stories celebrating the love, joy, and anticipation of couples.',
    location: 'Gujarat, India',
    date: '2026',
    featured: true,
    coverFile: 'IMG_0628.JPG.jpeg'
  },
  'engajment': {
    slug: 'engagement-session',
    title: 'Engagement Session',
    category: 'Engagement',
    description: 'Vibrant candid frames capturing heartfelt vows, smiles, and family warmth during the engagement ceremony.',
    location: 'Gujarat, India',
    date: '2026',
    featured: true,
    coverFile: 'IMG_1570.JPG.jpeg'
  },
  'baby shower': {
    slug: 'baby-shower-celebration',
    title: 'Baby Shower Celebration',
    category: 'Baby Shower',
    description: 'Graceful ceremony portraits and joyous festive moments celebrating the arrival of new life.',
    location: 'Gujarat, India',
    date: '2026',
    featured: false,
    coverFile: 'IMG_1287.JPG.jpeg'
  }
};

async function processAll() {
  if (!fs.existsSync(PUBLIC_PORTFOLIO_DIR)) {
    fs.mkdirSync(PUBLIC_PORTFOLIO_DIR, { recursive: true });
  }

  const generatedProjects = [];

  for (const [folderName, config] of Object.entries(folderProjectConfig)) {
    const folderPath = path.join(WORK_DIR, folderName);
    const destFolder = path.join(PUBLIC_PORTFOLIO_DIR, config.slug);
    if (!fs.existsSync(destFolder)) {
      fs.mkdirSync(destFolder, { recursive: true });
    }

    const files = fs.readdirSync(folderPath).filter(f => {
      const ext = path.extname(f).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext);
    });

    console.log(`Processing folder "${folderName}" (${files.length} images)...`);

    const projectImages = [];
    let coverImageUrl = '';
    let projectOrientation = 'portrait';
    let projectWidth = 0;
    let projectHeight = 0;

    for (let i = 0; i < files.length; i++) {
      const fileName = files[i];
      const srcPath = path.join(folderPath, fileName);
      const rawBuffer = fs.readFileSync(srcPath);

      const baseName = `photo_${String(i + 1).padStart(2, '0')}`;
      const galleryFileName = `${baseName}.webp`;
      const thumbFileName = `${baseName}_thumb.webp`;

      const galleryDest = path.join(destFolder, galleryFileName);
      const thumbDest = path.join(destFolder, thumbFileName);

      // 1. Process Gallery Display (Auto-rotate by EXIF, max 2048px, quality 85, strip private EXIF)
      const gallerySharp = sharp(rawBuffer)
        .rotate()
        .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85, effort: 4 });

      const galleryBuffer = await gallerySharp.toBuffer();
      fs.writeFileSync(galleryDest, galleryBuffer);

      // Read dimensions of the rotated & resized result
      const meta = await sharp(galleryBuffer).metadata();
      const visualWidth = meta.width || 0;
      const visualHeight = meta.height || 0;

      let orientation = 'landscape';
      if (visualHeight > visualWidth) orientation = 'portrait';
      else if (visualHeight === visualWidth) orientation = 'square';

      // 2. Process Thumbnail (max 600px, quality 80)
      await sharp(rawBuffer)
        .rotate()
        .resize({ width: 600, height: 600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80, effort: 4 })
        .toFile(thumbDest);

      const publicGalleryUrl = `/images/portfolio/${config.slug}/${galleryFileName}`;
      const publicThumbUrl = `/images/portfolio/${config.slug}/${thumbFileName}`;

      const imageRecord = {
        id: `${config.slug}-img-${i + 1}`,
        originalFileName: fileName,
        imageUrl: publicGalleryUrl,
        thumbUrl: publicThumbUrl,
        width: visualWidth,
        height: visualHeight,
        aspectRatio: visualWidth && visualHeight ? Number((visualWidth / visualHeight).toFixed(2)) : 1,
        orientation,
        displayOrder: i + 1,
        altText: `${config.title} - Photograph ${i + 1}`
      };

      projectImages.push(imageRecord);

      // Check if this is the chosen cover image
      if (fileName === config.coverFile || !coverImageUrl) {
        coverImageUrl = publicGalleryUrl;
        projectOrientation = orientation;
        projectWidth = visualWidth;
        projectHeight = visualHeight;
      }
    }

    generatedProjects.push({
      id: config.slug,
      slug: config.slug,
      title: config.title,
      category: config.category,
      description: config.description,
      location: config.location,
      date: config.date,
      coverImage: coverImageUrl,
      coverImageUrl: coverImageUrl,
      images: projectImages.map(img => img.imageUrl),
      detailedImages: projectImages,
      featured: config.featured,
      isFeatured: config.featured,
      isRealWork: true,
      isPublished: true,
      displayOrder: generatedProjects.length + 1,
      videoWidth: projectWidth,
      videoHeight: projectHeight,
      aspectRatio: projectWidth && projectHeight ? Number((projectWidth / projectHeight).toFixed(2)) : 1,
      orientation: projectOrientation,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  fs.writeFileSync('scripts/imported_portfolio_data.json', JSON.stringify(generatedProjects, null, 2));
  console.log('Successfully optimized and created all 46 web assets and metadata!');
}

processAll().catch(err => {
  console.error('Processing error:', err);
});
