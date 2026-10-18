# Instagram Reels & Videos — Setup and Operations

The homepage **Latest from Instagram** showcase is managed from **/admin/reels**.
Changes are read live from Supabase, so no redeploy is needed.

## How visibility works

| Published (status) | Featured | Homepage showcase | Admin dashboard |
|---|---|---|---|
| Published (`configured`) | Yes | ✅ shown (first 7 by display order) | ✅ |
| Published | No | — | ✅ |
| Draft (`incomplete`) | Yes / No | — (blocked by RLS) | ✅ |

Publishing and featuring are independent. Toggling one never changes the other.

## Entry types

- **Instagram link**: a single reel or post URL (`/reel/…`, `/p/…`, `/tv/…`, share links). It plays in
  Instagram's official embed, and only after the visitor clicks **Play Reel** (no Meta requests or
  cookies before that). Instagram does not expose dimensions or thumbnails publicly, so choose the
  orientation yourself and upload a cover screenshot.
- **Uploaded video**: MP4 (H.264 recommended), WebM or MOV, up to 50 MB. It's stored in the `reel-videos`
  bucket and plays with native HTML5 controls (sound, fullscreen). Dimensions and orientation are detected
  automatically, and a thumbnail is generated from the video if you don't upload one. You can add the original
  Instagram URL as well, which shows an "Open on Instagram" button.

## One-time Supabase setup

1. Open **Supabase → SQL Editor** and run
   `supabase/migrations/008_reels_video_storage_and_publishing.sql`.
   It is incremental and re-runnable. It never drops or deletes rows. It:
   - adds `video_url` and `media_type`, makes `instagram_url` optional, and gives `id` a UUID default
   - moves videos previously stored in `instagram_url` to `video_url`
   - sets entries saved with temporary `blob:` URLs to **Draft** (re-upload their video in the admin)
   - adds constraints so that a published entry always has media and `blob:`/`data:` URLs can't be saved
   - drops the legacy 001 policies that exposed drafts to the public
   - creates the public `reel-videos` bucket (50 MB, video MIME types, admin-only writes)
2. If the migration prints `uq_reels_instagram_url not created`, two entries share an Instagram URL.
   Delete one in the admin and re-run the migration.
3. **Supabase Pro only (optional):** to allow videos larger than 50 MB, raise
   *Storage → Settings → Upload file size limit*, update `file_size_limit` of the `reel-videos` bucket, and change
   `MAX_REEL_VIDEO_BYTES` in `src/utils/reelMedia.ts` to match.

## Vercel deployment

No build settings change. Push to the deployment branch, or run `vercel --prod`.
The site still only needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Optional: importing new reels automatically (Meta API)

Automatic sync **is possible**, but only through Meta's official API and with credentials:

- The Instagram account must be a **Professional (Business or Creator)** account.
- Create a Meta app at developers.facebook.com and add the **Instagram API with Instagram Login** product,
  with the `instagram_business_basic` permission. Apps in development mode can read the data of accounts
  that have a role on the app (add the studio account as an Instagram tester). App Review is only needed
  to serve other accounts.
- Generate a **long-lived access token**. These expire after **60 days** and must be refreshed
  (`GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=…`),
  then updated in Vercel.
- The old Instagram Basic Display API was shut down in December 2024. Don't use it, and don't use scraping.

Set these in **Vercel → Settings → Environment Variables** (server-side, never `VITE_`):

| Variable | Purpose |
|---|---|
| `INSTAGRAM_ACCESS_TOKEN` | long-lived Instagram token |
| `SUPABASE_URL` | your project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | lets the function write; never expose it in the browser |
| `CRON_SECRET` | optional; needed only for scheduled syncs |

After redeploying, **Import from Instagram** in /admin/reels calls `/api/instagram-sync`. The function:
checks that the caller is an active admin, reads the 25 most recent posts, picks out reels, skips URLs that
already exist, copies each reel's thumbnail into `reel-thumbnails` (Instagram CDN links expire), and inserts
new entries as **unfeatured drafts**. Nothing is published automatically. Without the variables, the button
explains that sync isn't configured, and manual URL management works as before.

For a daily automatic import, add this to `vercel.json` and set `CRON_SECRET`. Vercel sends it as a bearer token:

```json
"crons": [{ "path": "/api/instagram-sync", "schedule": "0 6 * * *" }]
```

## Known limitations

- Instagram embeds of private, deleted or region-blocked posts show Instagram's own notice inside the frame.
  The browser can't detect this cross-origin, so an **Open on Instagram** link is always shown. If the frame
  doesn't load within 12 s, an "unavailable" panel replaces it.
- MOV files from iPhones (HEVC) may not play in Chrome, Firefox or Android. Export to MP4 (H.264).
- Uploads use a single request (no progress percentage). Keep videos under 50 MB.
