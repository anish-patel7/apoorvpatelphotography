-- ==============================================================================
-- Apoorv Patel Photography — UK Positioning, Multimedia & Graphic Design Services
-- Migration: 006_uk_positioning_and_design_services.sql
-- ==============================================================================

-- 1. Safely expand category check constraint on public.services
alter table public.services drop constraint if exists services_category_check;
alter table public.services add constraint services_category_check 
  check (category in ('photography', 'videography', 'editing', 'multimedia', 'design', 'graphic_design'));

-- 2. Mark historical Maternity Photography service records as inactive (preserve data & inquiries)
update public.services
set is_active = false, updated_at = now()
where slug ilike '%maternity%' or title ilike '%maternity%';

-- 3. Upsert Multimedia Design service
insert into public.services (
  slug,
  title,
  category,
  description,
  icon,
  features,
  price_label,
  is_active,
  display_order
)
values (
  'multimedia-design',
  'Multimedia Design',
  'multimedia',
  'Creative multimedia solutions including video editing, motion graphics, digital content creation and visual storytelling.',
  'Film',
  array[
    'Motion graphics & animation',
    'Video editing & highlight reels',
    'Digital content creation',
    'Visual storytelling',
    'Brand media packages'
  ],
  'Contact for Quote',
  true,
  10
)
on conflict (slug) do update set
  title = excluded.title,
  category = excluded.category,
  description = excluded.description,
  features = excluded.features,
  is_active = true,
  updated_at = now();

-- 4. Upsert Graphic Design service
insert into public.services (
  slug,
  title,
  category,
  description,
  icon,
  features,
  price_label,
  is_active,
  display_order
)
values (
  'graphic-design',
  'Graphic Design',
  'design',
  'Professional graphic design for branding, promotional materials, social media creatives and digital visual communication.',
  'Palette',
  array[
    'Brand identity & logo design',
    'Promotional materials & brochures',
    'Social media creative assets',
    'Digital visual communication',
    'Print & marketing collateral'
  ],
  'Contact for Quote',
  true,
  11
)
on conflict (slug) do update set
  title = excluded.title,
  category = excluded.category,
  description = excluded.description,
  features = excluded.features,
  is_active = true,
  updated_at = now();

-- 5. Update website settings for UK positioning
update public.website_settings
set 
  public_description = 'UK-Based Photography & Creative Design. Capturing Timeless Moments. Creating Inspiring Visuals. Based in the United Kingdom.',
  tagline = 'Capturing Timeless Moments. Creating Inspiring Visuals. Based in the United Kingdom.',
  updated_at = now()
where id is not null;
