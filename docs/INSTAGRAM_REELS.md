# Films & Reels — Setup and Operations

The homepage **Latest Films & Reels** section is managed from **/admin/reels**.
Changes are read live from Supabase, so no redeploy is needed.

## How visibility works

| Published (status) | Featured | Homepage section | Admin dashboard |
|---|---|---|---|
| Published (`configured`) | Yes | ✅ shown (first 7 by display order) | ✅ |
| Published | No | — | ✅ |
| Draft (`incomplete`) | Yes / No | — (blocked by RLS) | ✅ |

Publishing and featuring are independent. Toggling one never changes the other.

## The three sources

| Admin choice | Saved as | What visitors get |
|---|---|---|
| **Upload video** | `media_type = 'video'`, `video_url` | Thumbnail → press Play → native HTML5 player **inside the card** (sound, seek, replay, fullscreen). The most reliable option. |
| **Instagram reel + original video** | `media_type = 'video'`, `video_url` + `instagram_url` | Same as an uploaded video. The Instagram link stays as a small "Also on Instagram" link. |
| **Instagram reel, link only** | `media_type = 'instagram'`, `instagram_url` | The saved cover image, labelled **Watch on Instagram**. It opens Instagram in a new tab, because Instagram decides whether its reels can play on other sites. It never claims to play on the site. |
| **YouTube Shorts / video** | `media_type = 'youtube'`, `youtube_url` | YouTube's thumbnail → press Play → the official YouTube player **inside the card**. If the owner has turned off embedding, the card says so and offers "Watch on YouTube". |

Playback rules on the homepage:
- Nothing heavy loads until Play is pressed. Cards show images, and uploaded videos use `preload="none"` when a thumbnail exists. YouTube iframes load only on click, so there are no Instagram/YouTube requests on page load.
- Only one card plays at a time. Starting another card stops the first one and frees its media.
- A playing card pauses when it is scrolled out of view.
- There is no popup, modal or new tab for normal playback. The admin preview still uses a popup.

Uploaded videos: MP4 (H.264) recommended, plus WebM and MOV, up to 50 MB, stored in the `reel-videos` bucket.
The thumbnail is created automatically from the video (it skips black fade-in frames), and you can replace it
or pick "Use a frame from the video". A replaced video/thumbnail is deleted only **after** the new one has
uploaded and the save succeeded. Unused uploads are removed when the form is cancelled.

Instagram link only: upload a cover screenshot, since Instagram does not share cover images with other websites.
To make it play on the site, edit it and attach the original video. The record keeps its ID, with no duplicate.

YouTube: paste `youtube.com/shorts/ID`, `youtube.com/watch?v=ID` or `youtu.be/ID`. The link is normalised.
Shorts default to portrait and other videos to landscape. The thumbnail comes from `i.ytimg.com` (public, permanent),
and you can replace it with an uploaded image.

## Thumbnails — never blank

Priority everywhere a reel is shown (homepage cards, mobile, admin previews):

1. **Your thumbnail.** An image uploaded or pasted in the admin is never replaced automatically.
2. **The original Instagram cover**, fetched through Meta's official API and copied to
   `reel-thumbnails/instagram/<shortcode>.jpg`.
3. **An automatic thumbnail.** Uploaded videos use a frame of the video
   (`generated/<id>-frame.jpg`). Instagram links get the branded Apoorv Patel Photography poster
   (`generated/<id>.jpg`).
4. If none of these are saved yet, or the stored image link is broken, the same branded poster
   is drawn live. A card is never black or empty.

**When you save an Instagram reel without a thumbnail**, the dashboard calls `/api/reel-thumbnail`.
It shows "Fetching Reel thumbnail…", then one of these messages:
- "Thumbnail added from the original Instagram cover."
- "Original cover unavailable; branded thumbnail applied."

**Generate Missing Thumbnails** (in Films & Reels) repairs existing reels:
- It finds reels with no thumbnail or a broken image link.
- It tries the original Instagram cover first, then a video frame or the branded poster.
- It refreshes the list and shows a summary.

Files are written to a fixed path per reel and the row is only updated if its thumbnail is still the value that was checked. This means:
- It is safe to run again: it never creates duplicates and never overwrites an image you chose meanwhile.
- A branded poster is upgraded to the original cover once the original becomes available.

**Turning on real covers (one-time, by the developer)**

The status panel at the top of Films & Reels shows whether this is working. Until it reports "Instagram connected", every reel without your own image gets the branded thumbnail.

1. Make sure @apoorvpatel_photography is a **Professional** account (Instagram app → Settings → Account type and tools → Switch to professional account).
2. Create a Meta app at developers.facebook.com:
   - Add the **Instagram API with Instagram Login** product.
   - Add the studio account as an Instagram tester and accept the invite in the Instagram app.
3. Generate a **long-lived access token** with the `instagram_business_basic` permission. Details are in "Optional: importing new reels automatically" below.
4. In **Vercel → Project → Settings → Environment Variables**, add `INSTAGRAM_ACCESS_TOKEN` and redeploy.
5. In Films & Reels, click **Check again**. The panel should now say "Instagram connected (@…)".
6. Click **Generate Missing Thumbnails**. Branded thumbnails are then replaced by the real covers.
7. Refresh the token every 60 days. The panel warns you when it has expired.

Without this setup there is no officially supported way for a website to obtain an Instagram reel's cover image. The other ways to show a reel's real picture are:
- upload the reel's original video (a frame becomes the thumbnail, and the reel plays on the site);
- upload a cover image.

**How the original cover is fetched (server side, `api/reel-thumbnail.ts`)**
- Caller must be a signed-in active admin. Database and storage writes use that admin's own session, so RLS applies and no service-role key is needed.
- Source 1: Instagram API with Instagram Login.
  - Reads the studio account's own recent media (`/me/media`, `thumbnail_url`; up to 200 posts) with `INSTAGRAM_ACCESS_TOKEN` (permission `instagram_business_basic`).
  - Covers **only reels posted by that account**.
- Source 2 (optional): Meta oEmbed Read with `META_APP_ID` + `META_CLIENT_TOKEN`.
  - Meta may leave `thumbnail_url` out of the response, in which case it returns nothing.
- Instagram pages are never scraped and no unofficial endpoints are used.
- Only image URLs returned by Meta on Meta CDN hosts (`*.cdninstagram.com`, `*.fbcdn.net`) are downloaded. The server never fetches user-supplied URLs (SSRF protection).
- Downloads are HTTPS only, with an 8 s timeout, one retry, a 5 MB cap, and JPEG/PNG/WebP type and signature checks.
- Without credentials, or when Meta doesn't return a cover, the branded poster is used and the dashboard explains why.

## One-time Supabase setup

0. **YouTube support needs migration 012** (`supabase/migrations/012_reels_youtube_and_description.sql`,
   also included in the setup bundle). It only adds `youtube_url` and `description`, and widens the
   `media_type` / "published has media" checks. It does not delete or rewrite data, change RLS or touch storage.
   Until it is run, YouTube entries still work: they are saved in `video_url` and recognised by the site.
   Descriptions are skipped until then.
1. Open **Supabase → SQL Editor** and run `supabase/setup/run_once_admin_setup.sql`
   (it includes 008–012; see `docs/ADMIN_SETUP.md`), or run
   `supabase/migrations/008_reels_video_storage_and_publishing.sql` on its own.
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
