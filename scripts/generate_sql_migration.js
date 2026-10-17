import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('scripts/imported_portfolio_data.json', 'utf8'));

let sql = `-- ==============================================================================
-- Apoorv Patel Photography — Imported Photography Projects & Images
-- Migration: 007_import_portfolio_photography.sql
-- ==============================================================================

-- 1. Insert Portfolio Projects
`;

for (const p of data) {
  const safeTitle = p.title.replace(/'/g, "''");
  const safeDesc = p.description.replace(/'/g, "''");
  const safeLocation = p.location.replace(/'/g, "''");

  sql += `
insert into public.portfolio_projects (
  slug,
  title,
  category,
  description,
  location,
  event_date,
  cover_image_url,
  content_type,
  is_real_work,
  is_featured,
  is_published,
  display_order,
  video_width,
  video_height,
  aspect_ratio,
  orientation
)
values (
  '${p.slug}',
  '${safeTitle}',
  '${p.category}',
  '${safeDesc}',
  '${safeLocation}',
  '${p.date}',
  '${p.coverImageUrl}',
  'photo',
  true,
  ${p.featured},
  true,
  ${p.displayOrder},
  ${p.videoWidth},
  ${p.videoHeight},
  ${p.aspectRatio},
  '${p.orientation}'
)
on conflict (slug) do update set
  title = excluded.title,
  category = excluded.category,
  cover_image_url = excluded.cover_image_url,
  orientation = excluded.orientation;
`;
}

sql += `\n-- 2. Insert Normalized Portfolio Images\n`;

for (const p of data) {
  sql += `\n-- Images for project: ${p.slug}\n`;
  for (const img of p.detailedImages) {
    const safeAlt = img.altText.replace(/'/g, "''");
    sql += `
insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '${img.imageUrl}', '${safeAlt}', ${img.displayOrder}
from public.portfolio_projects
where slug = '${p.slug}'
on conflict do nothing;
`;
  }
}

fs.writeFileSync('supabase/migrations/007_import_portfolio_photography.sql', sql, 'utf8');
console.log('supabase/migrations/007_import_portfolio_photography.sql generated successfully!');
