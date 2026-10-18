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
