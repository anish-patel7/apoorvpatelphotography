-- ==============================================================================
-- Apoorv Patel Photography — Video Orientation & Aspect Ratio Metadata
-- Migration: 005_video_orientation_metadata.sql
-- ==============================================================================

-- 1. Add video dimension and orientation metadata to instagram_reels
alter table public.instagram_reels
  add column if not exists video_width int,
  add column if not exists video_height int,
  add column if not exists aspect_ratio numeric(5,2),
  add column if not exists orientation text default 'portrait' check (orientation in ('portrait', 'landscape', 'square'));

-- 2. Add video dimension and orientation metadata to portfolio_projects
alter table public.portfolio_projects
  add column if not exists video_width int,
  add column if not exists video_height int,
  add column if not exists aspect_ratio numeric(5,2),
  add column if not exists orientation text check (orientation in ('portrait', 'landscape', 'square'));

-- 3. Comments for documentation
comment on column public.instagram_reels.orientation is 'Detected or configured video orientation: portrait, landscape, or square';
comment on column public.portfolio_projects.orientation is 'Detected or configured video orientation: portrait, landscape, or square';
