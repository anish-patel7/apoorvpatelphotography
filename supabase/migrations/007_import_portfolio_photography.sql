-- ==============================================================================
-- Apoorv Patel Photography — Imported Photography Projects & Images
-- Migration: 007_import_portfolio_photography.sql
-- ==============================================================================

-- 1. Insert Portfolio Projects

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
  'wedding-collection',
  'Wedding Collection',
  'Wedding',
  'Timeless moments of romance, ritual, and celebration captured with emotional depth and authentic artistry.',
  'Gujarat, India',
  '2026',
  '/images/portfolio/wedding-collection/photo_01.webp',
  'photo',
  true,
  true,
  true,
  1,
  1638,
  2048,
  0.8,
  'portrait'
)
on conflict (slug) do update set
  title = excluded.title,
  category = excluded.category,
  cover_image_url = excluded.cover_image_url,
  orientation = excluded.orientation;

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
  'pre-wedding-collection',
  'Pre-Wedding Collection',
  'Pre-Wedding',
  'Intimate pre-wedding visual stories celebrating the love, joy, and anticipation of couples.',
  'Gujarat, India',
  '2026',
  '/images/portfolio/pre-wedding-collection/photo_01.webp',
  'photo',
  true,
  true,
  true,
  2,
  1365,
  2048,
  0.67,
  'portrait'
)
on conflict (slug) do update set
  title = excluded.title,
  category = excluded.category,
  cover_image_url = excluded.cover_image_url,
  orientation = excluded.orientation;

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
  'engagement-session',
  'Engagement Session',
  'Engagement',
  'Vibrant candid frames capturing heartfelt vows, smiles, and family warmth during the engagement ceremony.',
  'Gujarat, India',
  '2026',
  '/images/portfolio/engagement-session/photo_01.webp',
  'photo',
  true,
  true,
  true,
  3,
  1152,
  2048,
  0.56,
  'portrait'
)
on conflict (slug) do update set
  title = excluded.title,
  category = excluded.category,
  cover_image_url = excluded.cover_image_url,
  orientation = excluded.orientation;

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
  'baby-shower-celebration',
  'Baby Shower Celebration',
  'Baby Shower',
  'Graceful ceremony portraits and joyous festive moments celebrating the arrival of new life.',
  'Gujarat, India',
  '2026',
  '/images/portfolio/baby-shower-celebration/photo_04.webp',
  'photo',
  true,
  false,
  true,
  4,
  1333,
  2000,
  0.67,
  'portrait'
)
on conflict (slug) do update set
  title = excluded.title,
  category = excluded.category,
  cover_image_url = excluded.cover_image_url,
  orientation = excluded.orientation;

-- 2. Insert Normalized Portfolio Images

-- Images for project: wedding-collection

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/wedding-collection/photo_01.webp', 'Wedding Collection - Photograph 1', 1
from public.portfolio_projects
where slug = 'wedding-collection'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/wedding-collection/photo_02.webp', 'Wedding Collection - Photograph 2', 2
from public.portfolio_projects
where slug = 'wedding-collection'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/wedding-collection/photo_03.webp', 'Wedding Collection - Photograph 3', 3
from public.portfolio_projects
where slug = 'wedding-collection'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/wedding-collection/photo_04.webp', 'Wedding Collection - Photograph 4', 4
from public.portfolio_projects
where slug = 'wedding-collection'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/wedding-collection/photo_05.webp', 'Wedding Collection - Photograph 5', 5
from public.portfolio_projects
where slug = 'wedding-collection'
on conflict do nothing;

-- Images for project: pre-wedding-collection

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/pre-wedding-collection/photo_01.webp', 'Pre-Wedding Collection - Photograph 1', 1
from public.portfolio_projects
where slug = 'pre-wedding-collection'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/pre-wedding-collection/photo_02.webp', 'Pre-Wedding Collection - Photograph 2', 2
from public.portfolio_projects
where slug = 'pre-wedding-collection'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/pre-wedding-collection/photo_03.webp', 'Pre-Wedding Collection - Photograph 3', 3
from public.portfolio_projects
where slug = 'pre-wedding-collection'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/pre-wedding-collection/photo_04.webp', 'Pre-Wedding Collection - Photograph 4', 4
from public.portfolio_projects
where slug = 'pre-wedding-collection'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/pre-wedding-collection/photo_05.webp', 'Pre-Wedding Collection - Photograph 5', 5
from public.portfolio_projects
where slug = 'pre-wedding-collection'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/pre-wedding-collection/photo_06.webp', 'Pre-Wedding Collection - Photograph 6', 6
from public.portfolio_projects
where slug = 'pre-wedding-collection'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/pre-wedding-collection/photo_07.webp', 'Pre-Wedding Collection - Photograph 7', 7
from public.portfolio_projects
where slug = 'pre-wedding-collection'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/pre-wedding-collection/photo_08.webp', 'Pre-Wedding Collection - Photograph 8', 8
from public.portfolio_projects
where slug = 'pre-wedding-collection'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/pre-wedding-collection/photo_09.webp', 'Pre-Wedding Collection - Photograph 9', 9
from public.portfolio_projects
where slug = 'pre-wedding-collection'
on conflict do nothing;

-- Images for project: engagement-session

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/engagement-session/photo_01.webp', 'Engagement Session - Photograph 1', 1
from public.portfolio_projects
where slug = 'engagement-session'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/engagement-session/photo_02.webp', 'Engagement Session - Photograph 2', 2
from public.portfolio_projects
where slug = 'engagement-session'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/engagement-session/photo_03.webp', 'Engagement Session - Photograph 3', 3
from public.portfolio_projects
where slug = 'engagement-session'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/engagement-session/photo_04.webp', 'Engagement Session - Photograph 4', 4
from public.portfolio_projects
where slug = 'engagement-session'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/engagement-session/photo_05.webp', 'Engagement Session - Photograph 5', 5
from public.portfolio_projects
where slug = 'engagement-session'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/engagement-session/photo_06.webp', 'Engagement Session - Photograph 6', 6
from public.portfolio_projects
where slug = 'engagement-session'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/engagement-session/photo_07.webp', 'Engagement Session - Photograph 7', 7
from public.portfolio_projects
where slug = 'engagement-session'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/engagement-session/photo_08.webp', 'Engagement Session - Photograph 8', 8
from public.portfolio_projects
where slug = 'engagement-session'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/engagement-session/photo_09.webp', 'Engagement Session - Photograph 9', 9
from public.portfolio_projects
where slug = 'engagement-session'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/engagement-session/photo_10.webp', 'Engagement Session - Photograph 10', 10
from public.portfolio_projects
where slug = 'engagement-session'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/engagement-session/photo_11.webp', 'Engagement Session - Photograph 11', 11
from public.portfolio_projects
where slug = 'engagement-session'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/engagement-session/photo_12.webp', 'Engagement Session - Photograph 12', 12
from public.portfolio_projects
where slug = 'engagement-session'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/engagement-session/photo_13.webp', 'Engagement Session - Photograph 13', 13
from public.portfolio_projects
where slug = 'engagement-session'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/engagement-session/photo_14.webp', 'Engagement Session - Photograph 14', 14
from public.portfolio_projects
where slug = 'engagement-session'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/engagement-session/photo_15.webp', 'Engagement Session - Photograph 15', 15
from public.portfolio_projects
where slug = 'engagement-session'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/engagement-session/photo_16.webp', 'Engagement Session - Photograph 16', 16
from public.portfolio_projects
where slug = 'engagement-session'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/engagement-session/photo_17.webp', 'Engagement Session - Photograph 17', 17
from public.portfolio_projects
where slug = 'engagement-session'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/engagement-session/photo_18.webp', 'Engagement Session - Photograph 18', 18
from public.portfolio_projects
where slug = 'engagement-session'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/engagement-session/photo_19.webp', 'Engagement Session - Photograph 19', 19
from public.portfolio_projects
where slug = 'engagement-session'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/engagement-session/photo_20.webp', 'Engagement Session - Photograph 20', 20
from public.portfolio_projects
where slug = 'engagement-session'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/engagement-session/photo_21.webp', 'Engagement Session - Photograph 21', 21
from public.portfolio_projects
where slug = 'engagement-session'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/engagement-session/photo_22.webp', 'Engagement Session - Photograph 22', 22
from public.portfolio_projects
where slug = 'engagement-session'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/engagement-session/photo_23.webp', 'Engagement Session - Photograph 23', 23
from public.portfolio_projects
where slug = 'engagement-session'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/engagement-session/photo_24.webp', 'Engagement Session - Photograph 24', 24
from public.portfolio_projects
where slug = 'engagement-session'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/engagement-session/photo_25.webp', 'Engagement Session - Photograph 25', 25
from public.portfolio_projects
where slug = 'engagement-session'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/engagement-session/photo_26.webp', 'Engagement Session - Photograph 26', 26
from public.portfolio_projects
where slug = 'engagement-session'
on conflict do nothing;

-- Images for project: baby-shower-celebration

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/baby-shower-celebration/photo_01.webp', 'Baby Shower Celebration - Photograph 1', 1
from public.portfolio_projects
where slug = 'baby-shower-celebration'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/baby-shower-celebration/photo_02.webp', 'Baby Shower Celebration - Photograph 2', 2
from public.portfolio_projects
where slug = 'baby-shower-celebration'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/baby-shower-celebration/photo_03.webp', 'Baby Shower Celebration - Photograph 3', 3
from public.portfolio_projects
where slug = 'baby-shower-celebration'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/baby-shower-celebration/photo_04.webp', 'Baby Shower Celebration - Photograph 4', 4
from public.portfolio_projects
where slug = 'baby-shower-celebration'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/baby-shower-celebration/photo_05.webp', 'Baby Shower Celebration - Photograph 5', 5
from public.portfolio_projects
where slug = 'baby-shower-celebration'
on conflict do nothing;

insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/portfolio/baby-shower-celebration/photo_06.webp', 'Baby Shower Celebration - Photograph 6', 6
from public.portfolio_projects
where slug = 'baby-shower-celebration'
on conflict do nothing;
