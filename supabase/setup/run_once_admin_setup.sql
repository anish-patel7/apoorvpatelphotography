-- ==============================================================================
-- Apoorv Patel Photography — ONE-TIME ADMIN SETUP (generated file, do not edit)
--
-- Run this whole file once in Supabase → SQL Editor → New query → Run.
-- It is safe to run again: nothing is deleted and existing work is preserved.
-- Contains migrations: 008_reels_video_storage_and_publishing.sql, 009_portfolio_sync_integrity.sql, 010_admin_managed_portfolio.sql, 011_admin_managed_services_training.sql, 012_reels_youtube_and_description.sql
-- Regenerate with: node scripts/build-setup-sql.mjs
-- ==============================================================================


-- >>>>>>>>>>>>>>>>>>>> 008_reels_video_storage_and_publishing.sql >>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- Apoorv Patel Photography — Instagram Reels: Uploaded Video Support,
-- Independent Publish/Feature Flags, Dedicated Video Storage
-- Migration: 008_reels_video_storage_and_publishing.sql
--
-- Safe & incremental:
--   * Never drops the table or deletes rows.
--   * Works whether instagram_reels was created by 001 (legacy columns) or 003.
--   * Re-runnable (every statement is guarded / idempotent).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Make sure every column used by the app exists (legacy 001 tables lack them)
-- ------------------------------------------------------------------------------
alter table public.instagram_reels
  add column if not exists title text not null default '',
  add column if not exists instagram_url text,
  add column if not exists thumbnail_url text,
  add column if not exists content_type text not null default 'reel',
  add column if not exists status text not null default 'configured',
  add column if not exists is_featured boolean not null default false,
  add column if not exists display_order int not null default 0,
  add column if not exists updated_at timestamptz not null default now(),
  -- New: separate field for directly uploaded video files (Supabase Storage URL)
  add column if not exists video_url text,
  -- New: what the entry plays — an Instagram embed or an uploaded video
  add column if not exists media_type text not null default 'instagram';

-- Backfill from legacy 001 columns (url / thumbnail / featured / sort_order) when present
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'instagram_reels' and column_name = 'url') then
    execute 'update public.instagram_reels set instagram_url = url
             where (instagram_url is null or instagram_url = '''') and url is not null';
    execute 'alter table public.instagram_reels alter column url drop not null';
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'instagram_reels' and column_name = 'thumbnail') then
    execute 'update public.instagram_reels set thumbnail_url = thumbnail
             where (thumbnail_url is null or thumbnail_url = '''') and thumbnail is not null';
    execute 'alter table public.instagram_reels alter column thumbnail drop not null';
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'instagram_reels' and column_name = 'featured') then
    execute 'update public.instagram_reels set is_featured = featured where featured is true and is_featured is false';
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'instagram_reels' and column_name = 'sort_order') then
    execute 'update public.instagram_reels set display_order = sort_order where display_order = 0 and sort_order <> 0';
  end if;
end $$;

-- Uploaded-video entries have no Instagram URL, so it must be optional now.
alter table public.instagram_reels alter column instagram_url drop not null;

-- Thumbnails stay optional at the DB level (the UI falls back to a placeholder).
update public.instagram_reels set thumbnail_url = '' where thumbnail_url is null;
alter table public.instagram_reels alter column thumbnail_url set default '';

-- Primary key default so inserts never depend on client-generated ids
do $$
declare
  id_type text;
begin
  select data_type into id_type from information_schema.columns
  where table_schema = 'public' and table_name = 'instagram_reels' and column_name = 'id';
  if id_type = 'text' then
    execute 'alter table public.instagram_reels alter column id set default gen_random_uuid()::text';
  elsif id_type = 'uuid' then
    execute 'alter table public.instagram_reels alter column id set default gen_random_uuid()';
  end if;
end $$;

-- ------------------------------------------------------------------------------
-- 2. Repair records saved by the previous admin implementation
-- ------------------------------------------------------------------------------
-- 2a. Videos previously stored in instagram_url (direct file links) move to video_url.
update public.instagram_reels
set video_url = instagram_url,
    instagram_url = null,
    media_type = 'video'
where video_url is null
  and instagram_url is not null
  and instagram_url !~* '(instagram\.com|instagr\.am)/'
  and instagram_url !~* '^blob:'
  and (instagram_url ~* '\.(mp4|mov|webm|m4v)(\?|$)' or instagram_url ~* '/storage/v1/object/');

-- 2b. Temporary browser blob: URLs never work for visitors. Keep the row so the admin
--     can re-upload, but hide it from the public site by moving it to Draft.
update public.instagram_reels
set status = 'incomplete'
where (instagram_url ~* '^blob:' or video_url ~* '^blob:')
  and status <> 'incomplete';

update public.instagram_reels set instagram_url = null where instagram_url ~* '^blob:';
update public.instagram_reels set video_url = null where video_url ~* '^blob:';
update public.instagram_reels set thumbnail_url = '' where thumbnail_url ~* '^(blob|data):';

-- 2c. Every Instagram-linked row is explicitly typed.
update public.instagram_reels
set media_type = case when coalesce(video_url, '') <> '' then 'video' else 'instagram' end
where media_type is null or media_type not in ('instagram', 'video');

-- ------------------------------------------------------------------------------
-- 3. Constraints (NOT VALID = enforced for new writes, existing rows untouched)
-- ------------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'instagram_reels_media_type_check') then
    alter table public.instagram_reels
      add constraint instagram_reels_media_type_check
      check (media_type in ('instagram', 'video')) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'instagram_reels_status_check_v2') then
    alter table public.instagram_reels
      add constraint instagram_reels_status_check_v2
      check (status in ('configured', 'incomplete')) not valid;
  end if;

  -- A published entry must have something to play.
  if not exists (select 1 from pg_constraint where conname = 'instagram_reels_published_has_media') then
    alter table public.instagram_reels
      add constraint instagram_reels_published_has_media
      check (
        status <> 'configured'
        or coalesce(nullif(instagram_url, ''), nullif(video_url, '')) is not null
      ) not valid;
  end if;

  -- Never persist temporary browser object URLs.
  if not exists (select 1 from pg_constraint where conname = 'instagram_reels_no_blob_urls') then
    alter table public.instagram_reels
      add constraint instagram_reels_no_blob_urls
      check (
        coalesce(instagram_url, '') !~* '^(blob|data):'
        and coalesce(video_url, '') !~* '^(blob|data):'
        and coalesce(thumbnail_url, '') !~* '^(blob|data):'
      ) not valid;
  end if;
end $$;

comment on column public.instagram_reels.status is 'Publication status: configured = Published (public), incomplete = Draft (admin only). Independent of is_featured.';
comment on column public.instagram_reels.is_featured is 'Show in the homepage Instagram showcase (only when also Published). Independent of status.';
comment on column public.instagram_reels.video_url is 'Public URL of a video uploaded to the reel-videos storage bucket.';
comment on column public.instagram_reels.media_type is 'instagram = play Instagram embed; video = play uploaded video_url.';

-- ------------------------------------------------------------------------------
-- 4. Indexes
-- ------------------------------------------------------------------------------
create index if not exists idx_reels_public_showcase
  on public.instagram_reels (display_order, created_at desc)
  where status = 'configured' and is_featured = true;

-- Prevent the same Instagram post being added twice (skipped with a notice if
-- duplicates already exist — clean them up in the admin, then re-run).
-- Exact match: the app stores canonical URLs, and Instagram shortcodes are case-sensitive.
do $$
begin
  create unique index if not exists uq_reels_instagram_url
    on public.instagram_reels (instagram_url)
    where instagram_url is not null and instagram_url <> '';
exception when unique_violation then
  raise notice 'uq_reels_instagram_url not created: duplicate Instagram URLs exist in instagram_reels.';
end $$;

-- ------------------------------------------------------------------------------
-- 5. Row Level Security
-- ------------------------------------------------------------------------------
alter table public.instagram_reels enable row level security;

-- Legacy 001 policies allowed public reads of drafts and writes by ANY signed-in
-- user. Policies are OR-ed, so they must be removed for drafts to stay private.
drop policy if exists "Reels public read" on public.instagram_reels;
drop policy if exists "Reels admin write" on public.instagram_reels;

drop policy if exists "Reels public read configured" on public.instagram_reels;
create policy "Reels public read configured" on public.instagram_reels
  for select using (status = 'configured' or public.is_admin());

drop policy if exists "Reels admin full access" on public.instagram_reels;
create policy "Reels admin full access" on public.instagram_reels
  for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. Dedicated video storage bucket
-- ------------------------------------------------------------------------------
-- 50 MB matches the Supabase Free plan global upload cap. On Pro you can raise
-- both this value and Storage > Settings > "Upload file size limit", then update
-- MAX_REEL_VIDEO_BYTES in src/utils/reelMedia.ts to match.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'reel-videos',
  'reel-videos',
  true,
  52428800,
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Thumbnails: same bucket as before, now also accepting AVIF.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reel-thumbnails', 'reel-thumbnails', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Reel videos public read" on storage.objects;
create policy "Reel videos public read" on storage.objects
  for select using (bucket_id = 'reel-videos');

drop policy if exists "Reel videos admin upload" on storage.objects;
create policy "Reel videos admin upload" on storage.objects
  for insert with check (bucket_id = 'reel-videos' and public.is_admin());

drop policy if exists "Reel videos admin update" on storage.objects;
create policy "Reel videos admin update" on storage.objects
  for update using (bucket_id = 'reel-videos' and public.is_admin());

drop policy if exists "Reel videos admin delete" on storage.objects;
create policy "Reel videos admin delete" on storage.objects
  for delete using (bucket_id = 'reel-videos' and public.is_admin());

-- Tell the API layer about schema changes immediately
notify pgrst, 'reload schema';


-- >>>>>>>>>>>>>>>>>>>> 009_portfolio_sync_integrity.sql >>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- Apoorv Patel Photography — Portfolio data integrity for the unified public gallery
-- Migration: 009_portfolio_sync_integrity.sql
--
-- Safe & incremental: never deletes projects. Re-runnable.
-- ==============================================================================

-- 1. Remove duplicate gallery rows (same photo attached to the same project twice).
--    Migration 007 used "on conflict do nothing" without a unique key, so running it
--    more than once duplicated every photo in "All Photos". Keeps the earliest row.
delete from public.portfolio_images a
using public.portfolio_images b
where a.project_id = b.project_id
  and a.image_url = b.image_url
  and (a.created_at, a.id::text) > (b.created_at, b.id::text);

-- 2. Prevent future duplicates (also makes 007's "on conflict do nothing" effective).
create unique index if not exists uq_portfolio_images_project_url
  on public.portfolio_images (project_id, image_url);

-- 3. Index for the public portfolio query (published projects in display order).
create index if not exists idx_portfolio_projects_published_order
  on public.portfolio_projects (is_published, display_order, created_at desc);

-- 4. Row Level Security (re-asserted; matches migration 003).
alter table public.portfolio_projects enable row level security;
alter table public.portfolio_images enable row level security;

-- Legacy 001 policies (if present) let any signed-in user write and exposed drafts.
drop policy if exists "Portfolio public read" on public.portfolio_projects;
drop policy if exists "Portfolio admin write" on public.portfolio_projects;

drop policy if exists "Portfolio public read published" on public.portfolio_projects;
create policy "Portfolio public read published" on public.portfolio_projects
  for select using (is_published = true or public.is_admin());

drop policy if exists "Portfolio admin full access" on public.portfolio_projects;
create policy "Portfolio admin full access" on public.portfolio_projects
  for all using (public.is_admin()) with check (public.is_admin());

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
  for all using (public.is_admin()) with check (public.is_admin());

-- Tell the API layer about schema changes immediately
notify pgrst, 'reload schema';


-- >>>>>>>>>>>>>>>>>>>> 010_admin_managed_portfolio.sql >>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- Apoorv Patel Photography — Fully admin-managed portfolio
-- Migration: 010_admin_managed_portfolio.sql
--
-- Adds admin-managed categories, video/photo media items, external work links and
-- automatic titles. Safe & incremental: never deletes projects or photos. Re-runnable.
-- Requires migration 003 (portfolio tables, is_admin()).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Portfolio categories (managed from Admin → Portfolio → Categories)
-- ------------------------------------------------------------------------------
create table if not exists public.portfolio_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(trim(name)) between 1 and 60),
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed the categories the website already uses (existing rows are left untouched).
insert into public.portfolio_categories (name, display_order)
values
  ('Wedding', 1), ('Engagement', 2), ('Pre-Wedding', 3), ('Baby Shower', 4),
  ('Family', 5), ('Personal', 6), ('Videography', 7), ('Multimedia Design', 8),
  ('Graphic Design', 9), ('Photo Editing', 10), ('Video Editing', 11)
on conflict (name) do nothing;

-- Any category already used by a project must exist, so no existing work is orphaned.
insert into public.portfolio_categories (name, display_order)
select distinct trim(p.category), 100
from public.portfolio_projects p
where coalesce(trim(p.category), '') <> ''
on conflict (name) do nothing;

update public.portfolio_projects set category = trim(category) where category <> trim(category);

-- Renaming a category renames it on every project; a category in use cannot be deleted.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'portfolio_projects_category_fkey') then
    alter table public.portfolio_projects
      add constraint portfolio_projects_category_fkey
      foreign key (category) references public.portfolio_categories(name)
      on update cascade on delete restrict;
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_proc where proname = 'handle_updated_at' and pronamespace = 'public'::regnamespace) then
    drop trigger if exists trg_portfolio_categories_updated on public.portfolio_categories;
    create trigger trg_portfolio_categories_updated before update on public.portfolio_categories
      for each row execute function public.handle_updated_at();
  end if;
end $$;

alter table public.portfolio_categories enable row level security;

drop policy if exists "Portfolio categories public read" on public.portfolio_categories;
create policy "Portfolio categories public read" on public.portfolio_categories
  for select using (is_active = true or public.is_admin());

drop policy if exists "Portfolio categories admin full access" on public.portfolio_categories;
create policy "Portfolio categories admin full access" on public.portfolio_categories
  for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------------------------
-- 2. Projects: external work links and automatic titles
-- ------------------------------------------------------------------------------
alter table public.portfolio_projects
  add column if not exists external_url text,
  add column if not exists is_auto_title boolean not null default false;

alter table public.portfolio_projects alter column cover_image_url set default '';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'portfolio_projects_no_blob_urls') then
    alter table public.portfolio_projects
      add constraint portfolio_projects_no_blob_urls
      check (
        coalesce(cover_image_url, '') !~* '^(blob|data):'
        and coalesce(external_url, '') !~* '^(blob|data|javascript):'
      ) not valid;
  end if;
end $$;

comment on column public.portfolio_projects.external_url is 'Optional external work link (YouTube, Vimeo or other website), opened or embedded on the project page.';
comment on column public.portfolio_projects.is_auto_title is 'True when the title was generated automatically because the admin left it blank.';

-- ------------------------------------------------------------------------------
-- 3. Gallery items can be photos or videos
-- ------------------------------------------------------------------------------
alter table public.portfolio_images
  add column if not exists media_type text not null default 'image',
  add column if not exists poster_url text,
  add column if not exists width int,
  add column if not exists height int;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'portfolio_images_media_type_check') then
    alter table public.portfolio_images
      add constraint portfolio_images_media_type_check check (media_type in ('image', 'video')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'portfolio_images_no_blob_urls') then
    alter table public.portfolio_images
      add constraint portfolio_images_no_blob_urls
      check (image_url !~* '^(blob|data):' and coalesce(poster_url, '') !~* '^(blob|data):') not valid;
  end if;
end $$;

comment on column public.portfolio_images.media_type is 'image or video';
comment on column public.portfolio_images.poster_url is 'Still frame shown before a video plays.';

-- ------------------------------------------------------------------------------
-- 4. Storage: photos (existing bucket) and a dedicated video bucket
-- ------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio-images', 'portfolio-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 50 MB matches the Supabase Free plan upload cap (raise on Pro if needed).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio-videos', 'portfolio-videos', true, 52428800, array['video/mp4', 'video/webm', 'video/quicktime'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Portfolio videos public read" on storage.objects;
create policy "Portfolio videos public read" on storage.objects
  for select using (bucket_id = 'portfolio-videos');

drop policy if exists "Portfolio videos admin upload" on storage.objects;
create policy "Portfolio videos admin upload" on storage.objects
  for insert with check (bucket_id = 'portfolio-videos' and public.is_admin());

drop policy if exists "Portfolio videos admin update" on storage.objects;
create policy "Portfolio videos admin update" on storage.objects
  for update using (bucket_id = 'portfolio-videos' and public.is_admin());

drop policy if exists "Portfolio videos admin delete" on storage.objects;
create policy "Portfolio videos admin delete" on storage.objects
  for delete using (bucket_id = 'portfolio-videos' and public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. Tell the API layer about the new columns immediately
-- ------------------------------------------------------------------------------
notify pgrst, 'reload schema';


-- >>>>>>>>>>>>>>>>>>>> 011_admin_managed_services_training.sql >>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- Apoorv Patel Photography — Admin-managed services & training, security cleanup
-- Migration: 011_admin_managed_services_training.sql
--
-- Safe & incremental: inserts only; never updates or deletes existing rows. Re-runnable.
--
-- Why: the website used to read services/courses with a column that does not exist
-- (sort_order instead of display_order), so it always fell back to the list built into
-- the code. Now that the site reads the database, this copies any built-in service or
-- course that is not yet in the database, so nothing visitors see today disappears.
-- Matching is by slug OR title (case-insensitive) to avoid duplicates. After this,
-- everything is edited in Admin → Services / Training.
-- ==============================================================================

-- 1. Services shown on the website today
with incoming(slug, title, category, description, icon, features, display_order) as (
  values
('wedding-photography', 'Wedding Photography', 'photography', 'Complete wedding day coverage capturing every ritual, emotion, and celebration with artistic precision.', 'Heart', array['Full-day coverage', 'Candid & posed shots', 'Traditional & modern styles', 'High-resolution delivery', 'Album design']::text[], 100),
  ('engagement-photography', 'Engagement Photography', 'photography', 'Celebrate your engagement with a beautiful photoshoot that captures the joy and excitement of your commitment.', 'Sparkles', array['Ring ceremony coverage', 'Couple portraits', 'Family group shots', 'Candid moments', 'Quick turnaround']::text[], 101),
  ('pre-wedding-photography', 'Pre-Wedding Shoot', 'photography', 'Creative pre-wedding photoshoots in stunning locations that tell your unique love story.', 'Camera', array['Location scouting', 'Outfit consultation', 'Cinematic compositions', 'Multiple locations', 'Creative concepts']::text[], 102),
  ('baby-shower-photography', 'Baby Shower Photography', 'photography', 'Capture the joy and excitement of your baby shower celebration with candid and styled photography.', 'Baby', array['Event coverage', 'Decoration details', 'Group photos', 'Candid moments', 'Quick delivery']::text[], 103),
  ('birthday-photography', 'Birthday Photography', 'photography', 'Make your birthday celebrations memorable with professional photography that captures all the fun.', 'PartyPopper', array['Full event coverage', 'Cake smash shots', 'Group photos', 'Decoration details', 'Fun candids']::text[], 104),
  ('family-photography', 'Family Photography', 'photography', 'Timeless family portraits that capture the love and bond shared between your family members.', 'Users', array['Group & individual shots', 'Indoor/outdoor', 'Generational photos', 'Candid interactions', 'Print-quality files']::text[], 105),
  ('couple-photography', 'Couple Photography', 'photography', 'Romantic couple photography sessions that beautifully capture your connection and chemistry.', 'HeartHandshake', array['Location shoots', 'Golden hour sessions', 'Romantic compositions', 'Creative concepts', 'High-res delivery']::text[], 106),
  ('portrait-photography', 'Portrait & Personal Photography', 'photography', 'Professional portrait sessions for individuals — headshots, creative portraits, and personal branding.', 'User', array['Professional headshots', 'Creative portraits', 'Personal branding', 'Studio/outdoor', 'Retouched finals']::text[], 107),
  ('wedding-films', 'Wedding Films', 'videography', 'Cinematic wedding films that beautifully narrate your love story through stunning visuals and emotional storytelling.', 'Film', array['Full ceremony coverage', 'Cinematic editing', 'Highlight reel', 'Drone footage', '4K delivery']::text[], 108),
  ('event-videography', 'Event Videography', 'videography', 'Professional video coverage for engagements, pre-weddings, birthdays, and special events.', 'Video', array['Multi-camera setup', 'Professional audio', 'Same-day edits', 'Social media cuts', 'Full event film']::text[], 109),
  ('social-media-videos', 'Social Media & Reels', 'videography', 'Trendy and engaging Instagram Reels and social media video content to boost your online presence.', 'Instagram', array['Trending formats', 'Quick turnaround', 'Music sync', 'Platform-optimized', 'Creative transitions']::text[], 110),
  ('photo-editing', 'Photo Editing & Retouching', 'editing', 'Professional photo editing, retouching, and color correction to make your images look their absolute best.', 'Palette', array['Color correction', 'Skin retouching', 'Background editing', 'Batch processing', 'Album design']::text[], 111),
  ('video-editing', 'Video Editing', 'editing', 'Professional video editing services — from wedding films to highlight reels and social media content.', 'Clapperboard', array['Color grading', 'Sound design', 'Transitions & effects', 'Subtitle/titles', 'Multiple formats']::text[], 112),
  ('creative-editing', 'Creative & Reel Editing', 'editing', 'Creative editing for Instagram Reels, cinematic edits, and artistic photo manipulations.', 'Wand', array['Reel editing', 'Creative composites', 'Artistic effects', 'Trend-based edits', 'Fast delivery']::text[], 113),
  ('multimedia-design', 'Multimedia Design', 'multimedia', 'Creative multimedia solutions including video editing, motion graphics, digital content creation and visual storytelling.', 'Film', array['Motion graphics & animation', 'Video editing & highlight reels', 'Digital content creation', 'Visual storytelling', 'Brand media packages']::text[], 114),
  ('graphic-design', 'Graphic Design', 'design', 'Professional graphic design for branding, promotional materials, social media creatives and digital visual communication.', 'Palette', array['Brand identity & logo design', 'Promotional materials & brochures', 'Social media creative assets', 'Digital visual communication', 'Print & marketing collateral']::text[], 115)
)
insert into public.services (slug, title, category, description, icon, features, price_label, is_active, display_order)
select i.slug, i.title, i.category, i.description, i.icon, i.features, 'Contact for Quote', true, i.display_order
from incoming i
where not exists (
  select 1 from public.services s
  where s.slug = i.slug or lower(trim(s.title)) = lower(trim(i.title))
);

-- 2. Training courses shown on the website today (images use the studio's own photography)
with incoming(slug, title, description, duration, level, curriculum, tools, price_label, mode, image_url, display_order) as (
  values
  ('photography-masterclass', 'Photography Masterclass', 'Learn the art and science of photography from basics to advanced techniques. This comprehensive course covers composition, lighting, camera settings, and creative vision.', '3 Months', 'Beginner to Advanced', array['Camera fundamentals & settings', 'Composition & framing techniques', 'Natural & artificial lighting', 'Portrait photography', 'Event & wedding photography', 'Landscape & street photography', 'Studio setup & equipment', 'Post-processing basics', 'Building your portfolio', 'Business of photography']::text[], array['DSLR/Mirrorless Camera', 'Adobe Lightroom', 'Adobe Photoshop']::text[], 'Contact for details', 'Online & Offline', '/images/portfolio/wedding-collection/photo_04.webp', 100),
  ('videography-course', 'Videography & Filmmaking', 'Master the art of cinematic videography — from camera movement and framing to storytelling through motion pictures.', '3 Months', 'Beginner to Intermediate', array['Video camera fundamentals', 'Cinematic movement & stabilization', 'Audio recording & sound design', 'Wedding & event filming', 'Interview & documentary style', 'Drone videography basics', 'B-roll & storytelling', 'Lighting for video', 'Editing workflow overview', 'Delivering final products']::text[], array['Camera & Gimbal', 'Microphones', 'Adobe Premiere Pro', 'DaVinci Resolve']::text[], 'Contact for details', 'Online & Offline', '/images/portfolio/engagement-session/photo_10.webp', 101),
  ('photo-editing-course', 'Photo Editing & Retouching', 'Learn professional photo editing techniques — from basic corrections to advanced retouching and creative composites.', '2 Months', 'Beginner to Advanced', array['Lightroom workflow & organization', 'Color correction & grading', 'Skin retouching techniques', 'Background editing & compositing', 'Batch editing & presets', 'Album design & layout', 'Photoshop tools & techniques', 'Creative editing & manipulation', 'Export settings & delivery', 'Client workflow management']::text[], array['Adobe Lightroom', 'Adobe Photoshop', 'Capture One']::text[], 'Contact for details', 'Online & Offline', '/images/portfolio/baby-shower-celebration/photo_02.webp', 102),
  ('video-editing-course', 'Video Editing & Post-Production', 'Master video editing from timeline basics to advanced color grading, effects, and delivering polished final cuts.', '2 Months', 'Beginner to Intermediate', array['Premiere Pro / DaVinci interface', 'Timeline editing & workflow', 'Transitions & effects', 'Color grading fundamentals', 'Audio mixing & sound design', 'Title design & motion graphics', 'Social media & Reel editing', 'Wedding film editing', 'Export & delivery formats', 'Building a showreel']::text[], array['Adobe Premiere Pro', 'DaVinci Resolve', 'After Effects basics']::text[], 'Contact for details', 'Online & Offline', '/images/portfolio/wedding-collection/photo_02.webp', 103)
)
insert into public.training_courses (slug, title, description, duration, level, curriculum, tools, price_label, mode, image_url, is_active, display_order)
select i.slug, i.title, i.description, i.duration, i.level, i.curriculum, i.tools, i.price_label, i.mode, i.image_url, true, i.display_order
from incoming i
where not exists (
  select 1 from public.training_courses t
  where t.slug = i.slug or lower(trim(t.title)) = lower(trim(i.title))
);

-- 3. Remove legacy (migration 001) policies that allowed ANY signed-in user to write.
--    Supabase allows public sign-ups by default, so these would let anyone who creates
--    an account edit content. The admin-only policies from migration 003 remain.
do $$
declare
  t record;
begin
  for t in
    select * from (values
      ('services', 'Services admin write'),
      ('services', 'Services public read'),
      ('training_courses', 'Training admin write'),
      ('training_courses', 'Training public read'),
      ('testimonials', 'Testimonials admin write'),
      ('site_settings', 'Settings admin write'),
      ('leads', 'Leads admin access'),
      ('lead_notes', 'Lead notes admin access')
    ) as p(tbl, pol)
  loop
    if to_regclass('public.' || t.tbl) is not null
       and exists (select 1 from pg_policy where polrelid = ('public.' || t.tbl)::regclass and polname = t.pol) then
      execute format('drop policy %I on public.%I', t.pol, t.tbl);
      raise notice 'Removed legacy policy "%" on %', t.pol, t.tbl;
    end if;
  end loop;
end $$;

-- Legacy storage policies for the old "portfolio", "reels" and "general" buckets (authenticated users could upload).
drop policy if exists "Portfolio images admin upload" on storage.objects;
drop policy if exists "Portfolio images admin delete" on storage.objects;
drop policy if exists "Reels thumbnails admin upload" on storage.objects;
drop policy if exists "Reels thumbnails admin delete" on storage.objects;
drop policy if exists "General images admin upload" on storage.objects;
drop policy if exists "General images admin delete" on storage.objects;

-- Re-assert admin-only write policies for services and training (same as migration 003).
alter table public.services enable row level security;
alter table public.training_courses enable row level security;

drop policy if exists "Services public read active" on public.services;
create policy "Services public read active" on public.services
  for select using (is_active = true or public.is_admin());
drop policy if exists "Services admin full access" on public.services;
create policy "Services admin full access" on public.services
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Training public read active" on public.training_courses;
create policy "Training public read active" on public.training_courses
  for select using (is_active = true or public.is_admin());
drop policy if exists "Training admin full access" on public.training_courses;
create policy "Training admin full access" on public.training_courses
  for all using (public.is_admin()) with check (public.is_admin());

notify pgrst, 'reload schema';


-- >>>>>>>>>>>>>>>>>>>> 012_reels_youtube_and_description.sql >>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- Apoorv Patel Photography — Films & Reels: YouTube support + optional description
-- Migration: 012_reels_youtube_and_description.sql
--
-- Safe & incremental:
--   * Never drops the table or deletes rows; existing reels keep working unchanged.
--   * Only ADDS two nullable columns and widens two CHECK constraints.
--   * Re-runnable (every statement is guarded / idempotent).
--   * RLS policies and storage buckets are not changed.
-- Requires migration 008 (media_type / video_url columns).
-- ==============================================================================

alter table public.instagram_reels
  -- Canonical https://www.youtube.com/watch?v=ID (or /shorts/ID) link for media_type 'youtube'.
  add column if not exists youtube_url text,
  -- Optional short description, used for accessibility and search engines.
  add column if not exists description text not null default '';

-- media_type now also accepts 'youtube'. NOT VALID = existing rows are not re-checked.
alter table public.instagram_reels drop constraint if exists instagram_reels_media_type_check;
alter table public.instagram_reels
  add constraint instagram_reels_media_type_check
  check (media_type in ('instagram', 'video', 'youtube')) not valid;

-- A published entry must still have something to play (now including a YouTube link).
alter table public.instagram_reels drop constraint if exists instagram_reels_published_has_media;
alter table public.instagram_reels
  add constraint instagram_reels_published_has_media
  check (
    status <> 'configured'
    or coalesce(nullif(instagram_url, ''), nullif(video_url, ''), nullif(youtube_url, '')) is not null
  ) not valid;

-- Only real YouTube links may be stored in youtube_url.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'instagram_reels_youtube_url_check') then
    alter table public.instagram_reels
      add constraint instagram_reels_youtube_url_check
      check (
        youtube_url is null or youtube_url = ''
        or youtube_url ~* '^https://(www\.)?(youtube\.com|youtu\.be)/'
      ) not valid;
  end if;
end $$;

comment on column public.instagram_reels.media_type is 'instagram = Instagram link (opens on Instagram unless an original video is attached); video = play uploaded video_url on the site; youtube = official YouTube embed of youtube_url.';
comment on column public.instagram_reels.youtube_url is 'YouTube Shorts / video link for media_type youtube.';
comment on column public.instagram_reels.description is 'Optional description (accessibility and search engines).';

notify pgrst, 'reload schema';
