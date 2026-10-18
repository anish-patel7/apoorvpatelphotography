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
