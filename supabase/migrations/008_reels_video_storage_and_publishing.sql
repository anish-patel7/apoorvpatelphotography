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
