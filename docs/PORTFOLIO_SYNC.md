# Portfolio — single source of truth

Supabase is the only source for the public portfolio when `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` are set. The built-in `src/data/portfolio.ts` projects are used
**only** when Supabase is not configured (local preview without a database).

## How the pages read data

| View | Source |
|---|---|
| Portfolio → **All** | every project with `is_published = true` plus its `portfolio_images` gallery |
| Portfolio → category tab | the same list, filtered by `category` in the browser |
| All Photos / Projects | the same list, flattened to photos or shown as project cards |
| Homepage **Selected Works** | `is_published = true AND is_featured = true`, first 6 by `display_order` |
| Project page `/portfolio/:slugOrId` | one project (published only for visitors) + its gallery |

Because every tab uses one request, **All always contains every category's items**.
The list refreshes whenever the visitor returns to the browser tab.
A failed query shows an error message and is logged to the console. It never shows stale sample content.

## Admin → Portfolio

- **Cover image** is saved to `portfolio_projects.cover_image_url`.
- **Gallery Photos** (multi-upload) are saved, cover first, to `portfolio_images`.
- **Published** checkbox and **Publish / Unpublish** button control `is_published`.
  Edits no longer republish a draft.
- Duplicate titles get a unique slug (`-2`, `-3`, …).

## One-time database steps (Supabase → SQL Editor)

> Simplest: run `supabase/setup/run_once_admin_setup.sql`, which includes 008, 009 and 010
> (categories, video items, work links). See `docs/ADMIN_SETUP.md`.

1. Run `supabase/migrations/009_portfolio_sync_integrity.sql`. It removes duplicate gallery rows,
   adds a unique key on `(project_id, image_url)`, adds an index, and re-applies the RLS policies.
   It never deletes projects.
2. Open **Admin → Portfolio**. If the imported collections (Wedding Collection, Pre-Wedding Collection,
   Engagement Session, Baby Shower Celebration) are **not** listed, run
   `supabase/migrations/007_import_portfolio_photography.sql`. After step 1 it is safe to re-run
   (no duplicates). Until then those collections will not appear publicly, because the site no longer
   substitutes the static copies.

No Vercel configuration change is needed. Redeploy as usual.
