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
