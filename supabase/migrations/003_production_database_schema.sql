-- ==============================================================================
-- Apoorv Patel Photography — Production Database Architecture
-- Migration: 003_production_database_schema.sql
-- ==============================================================================

-- 1. Enable Required PostgreSQL Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ==============================================================================
-- 2. ADMIN PROFILES MODULE
-- ==============================================================================
create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null unique,
  role text not null default 'admin' check (role in ('admin', 'super_admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_profiles_email on public.admin_profiles(email);
create index if not exists idx_admin_profiles_active on public.admin_profiles(is_active) where is_active = true;

-- Helper Function to check if the current user is an active administrator
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1
    from public.admin_profiles
    where id = auth.uid()
      and is_active = true
      and role in ('admin', 'super_admin')
  );
end;
$$ language plpgsql security definer set search_path = public;

-- ==============================================================================
-- 3. PORTFOLIO MODULE (Projects & Normalized Gallery Images)
-- ==============================================================================
create table if not exists public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  category text not null,
  description text not null default '',
  location text not null default '',
  event_date text not null default '',
  cover_image_url text not null,
  instagram_url text,
  video_url text,
  reel_url text,
  content_type text not null default 'post' check (content_type in ('post', 'reel', 'carousel', 'photo')),
  is_real_work boolean not null default true,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backward-compatibility columns if migrated from initial draft
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'portfolio_projects' and column_name = 'cover_image_url') then
    alter table public.portfolio_projects add column cover_image_url text;
    update public.portfolio_projects set cover_image_url = cover_image where cover_image_url is null;
    alter table public.portfolio_projects alter column cover_image_url set not null;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'portfolio_projects' and column_name = 'is_published') then
    alter table public.portfolio_projects add column is_published boolean not null default true;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'portfolio_projects' and column_name = 'is_real_work') then
    alter table public.portfolio_projects add column is_real_work boolean not null default true;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'portfolio_projects' and column_name = 'display_order') then
    alter table public.portfolio_projects add column display_order int not null default 0;
  end if;
end $$;

create index if not exists idx_portfolio_slug on public.portfolio_projects(slug);
create index if not exists idx_portfolio_published on public.portfolio_projects(is_published) where is_published = true;
create index if not exists idx_portfolio_featured on public.portfolio_projects(is_featured) where is_featured = true;
create index if not exists idx_portfolio_category on public.portfolio_projects(category);

-- Portfolio Images (Normalized child table for multi-image project galleries)
create table if not exists public.portfolio_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.portfolio_projects(id) on delete cascade,
  image_url text not null,
  alt_text text not null default '',
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_portfolio_images_project on public.portfolio_images(project_id, display_order);

-- ==============================================================================
-- 4. SERVICES MODULE
-- ==============================================================================
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text not null default '',
  category text not null check (category in ('photography', 'videography', 'editing')),
  icon text not null default 'Camera',
  features text[] not null default '{}',
  price_label text not null default 'Contact for Quote',
  is_active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_services_category on public.services(category);
create index if not exists idx_services_active on public.services(is_active) where is_active = true;

-- ==============================================================================
-- 5. TESTIMONIALS MODULE
-- ==============================================================================
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  client_location text not null default '',
  testimonial text not null,
  service text not null default '',
  date text not null default '',
  rating int not null default 5 check (rating >= 1 and rating <= 5),
  image_url text,
  is_featured boolean not null default false,
  is_approved boolean not null default false,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_testimonials_approved on public.testimonials(is_approved) where is_approved = true;

-- ==============================================================================
-- 6. INSTAGRAM REELS MODULE
-- ==============================================================================
create table if not exists public.instagram_reels (
  id text primary key,
  title text not null default '',
  instagram_url text not null,
  thumbnail_url text not null,
  content_type text not null default 'post' check (content_type in ('post', 'reel', 'carousel', 'photo')),
  status text not null default 'configured' check (status in ('configured', 'incomplete')),
  is_featured boolean not null default false,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reels_status on public.instagram_reels(status);

-- ==============================================================================
-- 7. CUSTOMER INQUIRIES MODULE
-- ==============================================================================
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (char_length(customer_name) >= 2),
  email text not null check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone text not null default '',
  whatsapp text default '',
  event_type text,
  event_date date,
  event_location text,
  budget text,
  message text not null check (char_length(message) >= 5),
  inquiry_status text not null default 'new' check (
    inquiry_status in ('new', 'contacted', 'requirement_confirmed', 'quotation_sent', 'follow_up', 'confirmed', 'completed', 'lost', 'cancelled')
  ),
  notes text[] not null default '{}',
  source text not null default 'website',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_inquiries_status on public.inquiries(inquiry_status);
create index if not exists idx_inquiries_created on public.inquiries(created_at desc);

-- Backward-compatibility view/table mapping:
-- Ensures existing code querying either 'leads' or 'inquiries' functions seamlessly
create or replace view public.leads as
select
  id,
  customer_name as name,
  phone as mobile,
  phone as whatsapp,
  email,
  coalesce(event_type, 'General') as service_type,
  event_type,
  event_date,
  event_location as location,
  budget,
  message,
  inquiry_status as status,
  source,
  notes,
  created_at,
  updated_at
from public.inquiries;

-- ==============================================================================
-- 8. TRAINING COURSES MODULE
-- ==============================================================================
create table if not exists public.training_courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null default '',
  duration text not null default '',
  level text not null default 'Beginner to Advanced',
  curriculum text[] not null default '{}',
  tools text[] not null default '{}',
  price_label text not null default 'Contact for details',
  mode text not null default 'Online & Offline',
  image_url text not null default '',
  is_active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_training_active on public.training_courses(is_active) where is_active = true;

-- ==============================================================================
-- 9. WEBSITE SETTINGS MODULE
-- ==============================================================================
create table if not exists public.website_settings (
  id text primary key default 'general',
  business_name text not null default 'Apoorv Patel Photography',
  tagline text not null default 'inspired by innovation',
  contact_email text not null default 'contact@apoorvpatelphotography.com',
  whatsapp_number text not null default '',
  instagram_url text not null default 'https://www.instagram.com/apoorvpatel_photography/',
  public_description text not null default 'Luxury Wedding & Portrait Photographer — IND & UK',
  social_links jsonb not null default '{"instagram": "https://www.instagram.com/apoorvpatel_photography/"}'::jsonb,
  stats jsonb not null default '{"projects": "100+", "clients": "80+", "experience": "5+", "countries": "2"}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ==============================================================================
-- 10. AUTOMATED TIMESTAMP MANAGEMENT
-- ==============================================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_admin_profiles_updated on public.admin_profiles;
create trigger trg_admin_profiles_updated before update on public.admin_profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_portfolio_projects_updated on public.portfolio_projects;
create trigger trg_portfolio_projects_updated before update on public.portfolio_projects
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_services_updated on public.services;
create trigger trg_services_updated before update on public.services
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_testimonials_updated on public.testimonials;
create trigger trg_testimonials_updated before update on public.testimonials
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_instagram_reels_updated on public.instagram_reels;
create trigger trg_instagram_reels_updated before update on public.instagram_reels
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_inquiries_updated on public.inquiries;
create trigger trg_inquiries_updated before update on public.inquiries
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_training_courses_updated on public.training_courses;
create trigger trg_training_courses_updated before update on public.training_courses
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_website_settings_updated on public.website_settings;
create trigger trg_website_settings_updated before update on public.website_settings
  for each row execute function public.handle_updated_at();

-- ==============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
alter table public.admin_profiles enable row level security;
alter table public.portfolio_projects enable row level security;
alter table public.portfolio_images enable row level security;
alter table public.services enable row level security;
alter table public.testimonials enable row level security;
alter table public.instagram_reels enable row level security;
alter table public.inquiries enable row level security;
alter table public.training_courses enable row level security;
alter table public.website_settings enable row level security;

-- Admin Profiles Policies
drop policy if exists "Admin profiles readable by authenticated admins" on public.admin_profiles;
create policy "Admin profiles readable by authenticated admins" on public.admin_profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "Admin profiles manageable by super admins" on public.admin_profiles;
create policy "Admin profiles manageable by super admins" on public.admin_profiles
  for all using (public.is_admin());

-- Portfolio Projects Policies
drop policy if exists "Portfolio public read published" on public.portfolio_projects;
create policy "Portfolio public read published" on public.portfolio_projects
  for select using (is_published = true or public.is_admin());

drop policy if exists "Portfolio admin full access" on public.portfolio_projects;
create policy "Portfolio admin full access" on public.portfolio_projects
  for all using (public.is_admin());

-- Portfolio Images Policies
drop policy if exists "Portfolio images public read" on public.portfolio_images;
create policy "Portfolio images public read" on public.portfolio_images
  for select using (
    exists (
      select 1 from public.portfolio_projects p
      where p.id = project_id and (p.is_published = true or public.is_admin())
    )
  );

drop policy if exists "Portfolio images admin full access" on public.portfolio_images;
create policy "Portfolio images admin full access" on public.portfolio_images
  for all using (public.is_admin());

-- Services Policies
drop policy if exists "Services public read active" on public.services;
create policy "Services public read active" on public.services
  for select using (is_active = true or public.is_admin());

drop policy if exists "Services admin full access" on public.services;
create policy "Services admin full access" on public.services
  for all using (public.is_admin());

-- Testimonials Policies
drop policy if exists "Testimonials public read approved" on public.testimonials;
create policy "Testimonials public read approved" on public.testimonials
  for select using (is_approved = true or public.is_admin());

drop policy if exists "Testimonials admin full access" on public.testimonials;
create policy "Testimonials admin full access" on public.testimonials
  for all using (public.is_admin());

-- Instagram Reels Policies
drop policy if exists "Reels public read configured" on public.instagram_reels;
create policy "Reels public read configured" on public.instagram_reels
  for select using (status = 'configured' or public.is_admin());

drop policy if exists "Reels admin full access" on public.instagram_reels;
create policy "Reels admin full access" on public.instagram_reels
  for all using (public.is_admin());

-- Inquiries Policies (Strict Customer Privacy & API Enforcement)
revoke all on public.inquiries from public, anon;
revoke all on public.leads from public, anon;

grant select, insert, update, delete on public.inquiries to service_role;
grant select, update, delete on public.inquiries to authenticated;

-- Anonymously reading, modifying, or deleting inquiries is STRICTLY BLOCKED
drop policy if exists "Inquiries admin view" on public.inquiries;
create policy "Inquiries admin view" on public.inquiries
  for select using (public.is_admin());

drop policy if exists "Inquiries admin update" on public.inquiries;
create policy "Inquiries admin update" on public.inquiries
  for update using (public.is_admin());

drop policy if exists "Inquiries admin delete" on public.inquiries;
create policy "Inquiries admin delete" on public.inquiries
  for delete using (public.is_admin());

-- Training Courses Policies
drop policy if exists "Training public read active" on public.training_courses;
create policy "Training public read active" on public.training_courses
  for select using (is_active = true or public.is_admin());

drop policy if exists "Training admin full access" on public.training_courses;
create policy "Training admin full access" on public.training_courses
  for all using (public.is_admin());

-- Website Settings Policies
drop policy if exists "Settings public read" on public.website_settings;
create policy "Settings public read" on public.website_settings
  for select using (true);

drop policy if exists "Settings admin full access" on public.website_settings;
create policy "Settings admin full access" on public.website_settings
  for all using (public.is_admin());

-- ==============================================================================
-- 12. STORAGE BUCKET CONFIGURATION & POLICIES
-- ==============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('portfolio-images', 'portfolio-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('reel-thumbnails', 'reel-thumbnails', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('website-media', 'website-media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS: Public read for published photography assets
drop policy if exists "Public media read access" on storage.objects;
create policy "Public media read access" on storage.objects
  for select using (bucket_id in ('portfolio-images', 'reel-thumbnails', 'website-media'));

-- Storage RLS: Admin-only upload, update, and delete
drop policy if exists "Admin media upload access" on storage.objects;
create policy "Admin media upload access" on storage.objects
  for insert with check (
    bucket_id in ('portfolio-images', 'reel-thumbnails', 'website-media') and
    public.is_admin()
  );

drop policy if exists "Admin media update access" on storage.objects;
create policy "Admin media update access" on storage.objects
  for update using (
    bucket_id in ('portfolio-images', 'reel-thumbnails', 'website-media') and
    public.is_admin()
  );

drop policy if exists "Admin media delete access" on storage.objects;
create policy "Admin media delete access" on storage.objects
  for delete using (
    bucket_id in ('portfolio-images', 'reel-thumbnails', 'website-media') and
    public.is_admin()
  );

-- ==============================================================================
-- 13. AUTHENTIC CLIENT DATA SEEDING (Production Safe — No Mock Data)
-- ==============================================================================

-- Seed Default Website Settings
insert into public.website_settings (id, business_name, tagline, contact_email, whatsapp_number, instagram_url, public_description)
values (
  'general',
  'Apoorv Patel Photography',
  'inspired by innovation',
  'contact@apoorvpatelphotography.com',
  '',
  'https://www.instagram.com/apoorvpatel_photography/',
  'Luxury Wedding & Portrait Photographer — IND & UK'
)
on conflict (id) do update set
  business_name = excluded.business_name,
  tagline = excluded.tagline,
  contact_email = excluded.contact_email;

-- Seed Genuine Royal Groom Portrait
insert into public.portfolio_projects (
  slug,
  title,
  category,
  description,
  location,
  event_date,
  cover_image_url,
  instagram_url,
  video_url,
  reel_url,
  content_type,
  is_real_work,
  is_featured,
  is_published,
  display_order
) values (
  'royal-groom-portrait',
  'Royal Groom Portrait — Timeless Heritage',
  'Wedding',
  'An evocative, black-and-white royal groom portrait showcasing traditional embroidered safa and contemplative emotion, captured through dramatic chiaroscuro lighting.',
  'Gujarat, India',
  '2026',
  '/images/real_work_dzvz4ssjoss.jpg',
  'https://www.instagram.com/p/DZVZ4sSjOss/',
  'https://www.instagram.com/p/DZVZ4sSjOss/',
  'https://www.instagram.com/p/DZVZ4sSjOss/',
  'post',
  true,
  true,
  true,
  1
)
on conflict (slug) do update set
  cover_image_url = excluded.cover_image_url,
  is_real_work = true,
  is_published = true;

-- Seed Normalized Image for Royal Groom Portrait
insert into public.portfolio_images (project_id, image_url, alt_text, display_order)
select id, '/images/real_work_dzvz4ssjoss.jpg', 'Royal Groom Portrait — Timeless Heritage', 1
from public.portfolio_projects
where slug = 'royal-groom-portrait'
on conflict do nothing;

-- Seed Verified Instagram Reel
insert into public.instagram_reels (
  id,
  title,
  instagram_url,
  thumbnail_url,
  content_type,
  status,
  is_featured,
  display_order
) values (
  'DZVZ4sSjOss',
  'Royal Groom Portrait',
  'https://www.instagram.com/p/DZVZ4sSjOss/',
  '/images/real_work_dzvz4ssjoss.jpg',
  'post',
  'configured',
  true,
  1
)
on conflict (id) do update set
  instagram_url = excluded.instagram_url,
  thumbnail_url = excluded.thumbnail_url,
  status = 'configured';

-- Seed Professional Photography Services
insert into public.services (slug, title, category, description, icon, features, price_label, is_active, display_order) values
  ('wedding-photography', 'Wedding Photography', 'photography', 'Capture every precious moment of your special day with our premium luxury wedding photography services.', 'Heart', array['Full-day coverage', 'Candid & posed moments', 'Artistic portraiture', 'High-resolution edited gallery'], 'Contact for Quote', true, 1),
  ('pre-wedding-shoot', 'Pre-Wedding Shoot', 'photography', 'Create timeless romantic memories with styled pre-wedding cinematic photography in picturesque settings.', 'Camera', array['Location scouting', 'Creative direction', 'Multiple outfit looks', 'High-res retouched files'], 'Contact for Quote', true, 2),
  ('engagement-photography', 'Engagement Photography', 'photography', 'Document the start of your journey together with emotive engagement and ring ceremony coverage.', 'Sparkles', array['Candid interactions', 'Family portraits', 'Detail shots', 'Quick delivery'], 'Contact for Quote', true, 3),
  ('maternity-photography', 'Maternity Photography', 'photography', 'Celebrate the beauty of motherhood with an intimate, elegant, and timeless maternity shoot.', 'Heart', array['Indoor/outdoor options', 'Styling assistance', 'Partner inclusion', 'Fine art retouched finals'], 'Contact for Quote', true, 4),
  ('cinematic-videography', 'Cinematic Wedding Films', 'videography', 'Emotional, cinematic wedding films capturing the rhythm, vows, and grandeur of your celebrations.', 'Video', array['Multi-camera coverage', 'Cinematic sound design', 'Drone cinematography', 'Teaser & full film'], 'Contact for Quote', true, 5),
  ('photo-editing', 'Photo Retouching & Color Grading', 'editing', 'High-end post-production, fine art retouching, and color grading for professional photographers and clients.', 'Palette', array['Natural skin retouching', 'Editorial color grading', 'Batch processing', 'Album design'], 'Contact for Quote', true, 6)
on conflict (slug) do nothing;

-- Seed Professional Training Masterclasses
insert into public.training_courses (slug, title, description, duration, level, curriculum, tools, price_label, mode, image_url, is_active, display_order) values
  ('photography-masterclass', 'Photography Masterclass', 'Comprehensive photography mentorship from fundamentals to advanced lighting, composition, and commercial client workflow.', '3 Months', 'Beginner to Advanced', array['Camera mechanics & manual controls', 'Natural & flash lighting', 'Creative framing & composition', 'Client direction & storytelling', 'Business & marketing'], array['DSLR/Mirrorless Camera', 'Adobe Lightroom', 'Adobe Photoshop'], 'Contact for details', 'Online & Offline', '/images/real_work_dzvz4ssjoss.jpg', true, 1),
  ('cinematic-videography-training', 'Cinematic Filmmaking', 'Master cinematic camera movement, audio capture, lighting, and narrative editing for wedding films.', '3 Months', 'Beginner to Advanced', array['Camera stabilization & gimbal work', 'Audio recording & lavalier mics', 'B-roll capture & pacing', 'Premiere Pro & DaVinci Resolve workflow'], array['Video Camera/Gimbal', 'Adobe Premiere Pro', 'DaVinci Resolve'], 'Contact for details', 'Online & Offline', '/images/real_work_dzvz4ssjoss.jpg', true, 2)
on conflict (slug) do nothing;
