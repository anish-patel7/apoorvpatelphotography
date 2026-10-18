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
