# Admin Dashboard — One-time Setup & Deployment

The website is fully managed from **/admin**: portfolio work, categories, Instagram reels,
services, training and testimonials. Normal content changes never need code changes or a
redeploy.

## 1. One-time database setup (developer, ~2 minutes)

The reels error *"The database is missing the new reel columns…"* meant the database update
that shipped with the reels feature (migration 008) had never been applied to the live
Supabase project. Code was deployed, the database was not.

1. Open **Supabase → SQL Editor → New query**.
2. Paste the **entire** contents of `supabase/setup/run_once_admin_setup.sql` and click **Run**.
   - It contains migrations 008, 009, 010 and 011.
   - Every statement is guarded, so it is safe to run more than once.
   - It never deletes or resets content: existing reels, projects and photos are preserved
     (verified on PostgreSQL 16 against databases with and without earlier migrations).
3. If the four imported collections (Wedding Collection, Pre-Wedding Collection, Engagement Session,
   Baby Shower Celebration) are not listed in **Admin → Portfolio**, also run
   `supabase/migrations/007_import_portfolio_photography.sql`. It's safe to re-run after step 2.
4. Sign in with a developer account (`admin_profiles.role = 'super_admin'`) and open
   **Admin → System Check**. Every row should be green.

### What the setup adds

| Area | Change |
|---|---|
| Reels | `video_url`, `media_type`, safe constraints, `reel-videos` bucket (MP4/WebM/MOV, 50 MB), admin-only writes |
| Portfolio | `portfolio_categories` table, managed in the admin; projects reference it (renames cascade, categories in use can't be deleted) |
| Portfolio | Gallery items can be photos or videos (`media_type`, `poster_url`, `width`, `height`) |
| Portfolio | `external_url` (YouTube/Vimeo/website links) and `is_auto_title` |
| Storage | `portfolio-videos` bucket (50 MB, video types); `portfolio-images` (10 MB, image types) re-asserted |
| Services & Training | Copies today's public services/courses into the database (insert-only, skips existing slugs/titles) so they become editable without anything disappearing |
| Security | RLS: the public reads only published/active content; only active admins can write. Legacy 001-era policies that let any signed-in user write are removed if present |

Until the setup is run, the dashboard keeps working:
- Instagram reel links and portfolio photos still save, in a compatible format.
- Video uploads and category editing show a plain-English message asking for the setup.
- The technical detail is logged to the browser console and shown on **System Check**.

### Recommended Supabase settings (owner/developer)

1. **Authentication → Sign In / Providers → disable "Allow new users to sign up".** Admin access is
   already limited to `admin_profiles`, but there is no reason for public sign-ups on this site.
2. **Optional:** run `supabase/optional/harden_inquiry_inserts.sql`. It stops anyone inserting enquiries
   directly with the public key, so every enquiry goes through the duplicate check and the 5-per-hour limit.
   Read the header first: it changes live permissions and includes an undo line.

## 2. Developer diagnostics

- **System Check** (`/admin/system`) is shown only to `super_admin` accounts and in local development.
  It tests every column and bucket the dashboard needs and lists recent technical errors.
- Standard admins see plain-language messages only, never table names, SQL or service names.
- To make your own account a developer: run
  `update public.admin_profiles set role = 'super_admin' where email = 'you@example.com';`

## 3. Vercel deployment

No new environment variables are required; `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are unchanged.

1. Run the one-time database setup (above). Order relative to deploying doesn't matter, but do it first.
2. Merge the pull request (or push to the production branch). Vercel builds with `npm run build`.
3. Open **Admin → System Check** on the live site and confirm everything is green.

Optional: `VITE_ENABLE_INSTAGRAM_IMPORT=true` shows the "Import from Instagram" button once the
server-side Meta credentials are configured (see `docs/INSTAGRAM_REELS.md`).

## 4. Day-to-day use (for the studio)

**Add work:** Admin → Portfolio → **Add Work** → choose a category → upload photos/videos *or*
paste a link → **Publish Work**. A title is optional.

- **Categories:** Admin → Portfolio → **Categories** to add, rename, reorder, hide or delete
  (only empty categories can be deleted).
- **Edit work:** tap ✏️ to change the category or title, add or remove photos, choose the cover (★),
  or open *Advanced settings* for the description, location, display order, featured and draft options.
- **Publish / Unpublish, Feature:** buttons on each card. The homepage shows featured, published work.
