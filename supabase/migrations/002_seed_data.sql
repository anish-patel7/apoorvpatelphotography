-- ============================================================
-- SEED DATA — Apoorvpatel Photography
-- ============================================================

-- Portfolio Projects
insert into public.portfolio_projects (slug, title, category, cover_image, images, video_url, description, date, location, featured, sort_order) values
  ('elegant-wedding-ceremony', 'Elegant Wedding Ceremony', 'Wedding',
   'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
   array['https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80', 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1200&q=80', 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80', 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=80'],
   null, 'A beautiful traditional wedding ceremony captured with cinematic elegance.', '2026', 'Gujarat, India', true, 1),

  ('romantic-pre-wedding', 'Romantic Pre-Wedding Shoot', 'Pre-Wedding',
   'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800&q=80',
   array['https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1200&q=80', 'https://images.unsplash.com/photo-1529634597503-139d3726fed5?w=1200&q=80', 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?w=1200&q=80'],
   null, 'A dreamy pre-wedding shoot set against breathtaking landscapes.', '2026', 'Udaipur, India', true, 2),

  ('garden-engagement', 'Garden Engagement Session', 'Engagement',
   'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80',
   array['https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&q=80', 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&q=80', 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=1200&q=80'],
   null, 'An intimate engagement session in a beautiful garden setting.', '2025', 'London, UK', true, 3),

  ('baby-shower-celebration', 'Joyful Baby Shower', 'Baby Shower',
   'https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=800&q=80',
   array['https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=1200&q=80', 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=1200&q=80'],
   null, 'A heartwarming baby shower celebration filled with love and laughter.', '2025', 'Mumbai, India', false, 4),

  ('maternity-glow', 'Maternity Glow', 'Maternity',
   'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
   array['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80'],
   null, 'Elegant maternity photography celebrating the beauty of motherhood.', '2025', 'Ahmedabad, India', false, 5),

  ('family-portrait-session', 'Family Portrait Session', 'Family',
   'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80',
   array['https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200&q=80', 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=1200&q=80'],
   null, 'A warm and candid family portrait session capturing genuine connections.', '2025', 'Birmingham, UK', true, 6),

  ('creative-portrait', 'Creative Portrait Photography', 'Personal',
   'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80',
   array['https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1200&q=80', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80'],
   null, 'A creative portrait session showcasing personality and style.', '2026', 'London, UK', true, 7),

  ('cinematic-wedding-film', 'Cinematic Wedding Film', 'Videography',
   'https://images.unsplash.com/photo-1505932794465-147d1f1b2c97?w=800&q=80',
   array['https://images.unsplash.com/photo-1505932794465-147d1f1b2c97?w=1200&q=80', 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=80'],
   'https://www.instagram.com/apoorvpatel_photography/',
   'A cinematic wedding film that tells the love story beautifully.', '2026', 'Rajasthan, India', true, 8);

-- Services
insert into public.services (title, category, description, icon, features, sort_order) values
  ('Wedding Photography', 'photography', 'Capture every precious moment of your special day with our premium wedding photography services.', 'Heart', array['Full-day coverage', 'Candid & posed shots', 'Traditional & contemporary styles', 'High-resolution edited images', 'Online gallery'], 1),
  ('Pre-Wedding Shoot', 'photography', 'Create beautiful memories before the big day with a styled pre-wedding shoot.', 'Camera', array['Location scouting', 'Outfit guidance', 'Multiple locations', 'Creative concepts', 'Same-day preview'], 2),
  ('Engagement Photography', 'photography', 'Document the start of your journey together with stunning engagement photos.', 'Sparkles', array['Ring ceremony coverage', 'Candid moments', 'Family portraits', 'Quick turnaround'], 3),
  ('Baby Shower Photography', 'photography', 'Preserve the joy and excitement of your baby shower celebration.', 'Baby', array['Event coverage', 'Decor detail shots', 'Group photos', 'Candid moments'], 4),
  ('Maternity Photography', 'photography', 'Celebrate the beauty of motherhood with an elegant maternity shoot.', 'Heart', array['Indoor/outdoor options', 'Partner inclusion', 'Wardrobe guidance', 'Artistic editing'], 5),
  ('Birthday Photography', 'photography', 'Make birthday celebrations unforgettable with professional photography.', 'Cake', array['Event coverage', 'Candid & group shots', 'Cake smash setups', 'Quick delivery'], 6),
  ('Family Photography', 'photography', 'Capture the love and connection of your family in a beautiful portrait session.', 'Users', array['Home or outdoor sessions', 'Multi-generation shots', 'Candid & posed', 'Print-ready files'], 7),
  ('Couple Photography', 'photography', 'Celebrate your love story with a romantic couple photography session.', 'Heart', array['Location options', 'Golden hour shoots', 'Creative direction', 'Same-day previews'], 8),
  ('Portrait Photography', 'photography', 'Professional portraits for personal branding, social media, or keepsakes.', 'User', array['Studio or outdoor', 'Professional lighting', 'Multiple looks', 'Retouched finals'], 9),
  ('Wedding Videography', 'videography', 'Cinematic wedding films that bring your special day to life.', 'Video', array['Full-day filming', 'Cinematic editing', 'Highlight reel', 'Drone footage', 'Audio mixing'], 10),
  ('Event Videography', 'videography', 'Professional video coverage for corporate events, parties, and celebrations.', 'Film', array['Multi-camera setup', 'Live event coverage', 'Edited highlights', 'Social media cuts'], 11),
  ('Instagram Reels & Content', 'videography', 'Trendy, engaging video content for your social media presence.', 'Smartphone', array['Concept development', 'Professional filming', 'Trending audio/effects', 'Optimized for engagement'], 12),
  ('Photo Editing & Retouching', 'editing', 'Professional photo editing to make your images picture-perfect.', 'Palette', array['Color correction', 'Skin retouching', 'Background editing', 'Batch processing', 'Album design'], 13),
  ('Video Editing', 'editing', 'Professional video editing and post-production for any project.', 'Scissors', array['Color grading', 'Transitions & effects', 'Audio sync', 'Format optimization'], 14),
  ('Reel & Short Video Editing', 'editing', 'Quick-turnaround editing for Instagram Reels and short-form content.', 'Zap', array['Trending templates', 'Text & graphics', 'Music sync', 'Platform optimization'], 15);

-- Training Courses
insert into public.training_courses (title, description, duration, level, curriculum, tools, fee, mode, image, sort_order) values
  ('Photography Masterclass', 'Comprehensive photography training from basics to advanced techniques.', '8 Weeks', 'Beginner to Advanced',
   array['Camera basics & settings', 'Composition & framing', 'Lighting techniques', 'Portrait photography', 'Wedding photography', 'Outdoor & landscape', 'Post-processing introduction', 'Building your portfolio'],
   array['DSLR/Mirrorless Camera', 'Lightroom', 'Photoshop basics'],
   'Contact for pricing', 'Online & Offline',
   'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&q=80', 1),

  ('Videography & Filmmaking', 'Learn cinematic videography and filmmaking from scratch.', '10 Weeks', 'Beginner to Advanced',
   array['Camera movement & stabilization', 'Cinematic composition', 'Audio recording', 'Interview techniques', 'Wedding filmmaking', 'Drone videography basics', 'Storytelling through video', 'Client workflow'],
   array['Camera with video capability', 'Gimbal/Stabilizer', 'Premiere Pro / DaVinci Resolve'],
   'Contact for pricing', 'Online & Offline',
   'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80', 2),

  ('Photo Editing & Retouching', 'Master professional photo editing and retouching techniques.', '6 Weeks', 'Beginner to Intermediate',
   array['Lightroom workflow', 'Color correction & grading', 'Skin retouching techniques', 'Background editing', 'Batch processing', 'Album design & layout', 'Export & delivery workflow'],
   array['Adobe Lightroom', 'Adobe Photoshop', 'Capture One (overview)'],
   'Contact for pricing', 'Online & Offline',
   'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80', 3),

  ('Video Editing & Post-Production', 'Complete video editing course for beginners and professionals.', '8 Weeks', 'Beginner to Advanced',
   array['Editing software setup', 'Timeline & workflow', 'Cutting techniques', 'Color grading', 'Audio editing & mixing', 'Motion graphics basics', 'Reel & short-form editing', 'Export for platforms'],
   array['Premiere Pro', 'DaVinci Resolve', 'After Effects basics', 'CapCut (mobile)'],
   'Contact for pricing', 'Online & Offline',
   'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80', 4);

-- Testimonials
insert into public.testimonials (name, review, service, date, rating, approved, sort_order) values
  ('Priya & Ravi Sharma', 'Apoorv captured our wedding beautifully. Every photo tells a story. His attention to detail and creative vision made our special day truly memorable.', 'Wedding Photography', '2025', 5, true, 1),
  ('James & Emma Wilson', 'Incredible pre-wedding shoot in London. Apoorv made us feel so comfortable and the results were stunning. Highly recommend!', 'Pre-Wedding Photography', '2025', 5, true, 2),
  ('Neha Patel', 'The maternity shoot was so elegant and beautiful. Apoorv has a wonderful ability to capture emotion and make you feel at ease.', 'Maternity Photography', '2025', 5, true, 3),
  ('Vikram Mehta', 'Outstanding video editing skills! Apoorv transformed our raw footage into a cinematic masterpiece. Quick turnaround and very professional.', 'Video Editing', '2025', 5, true, 4),
  ('Sarah Thompson', 'The photography training course was fantastic. I learned so much about composition and lighting. Apoorv is a patient and knowledgeable teacher.', 'Photography Training', '2024', 5, true, 5),
  ('Amit & Pooja Desai', 'Our engagement ceremony photos are absolutely beautiful. The candid shots especially are priceless. Thank you, Apoorv!', 'Engagement Photography', '2025', 5, true, 6);

-- Instagram Reels
insert into public.instagram_reels (thumbnail, url, title, featured, sort_order) values
  ('https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80', 'https://www.instagram.com/reel/DT_jYyIE_B0/', 'Wedding Highlights', true, 1),
  ('https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=400&q=80', 'https://www.instagram.com/reel/DTrp3jEDCNl/', 'Pre-Wedding Magic', true, 2),
  ('https://images.unsplash.com/photo-1505932794465-147d1f1b2c97?w=400&q=80', 'https://www.instagram.com/reel/DTg86w9CFEd/', 'Cinematic Film', true, 3),
  ('https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&q=80', 'https://www.instagram.com/reel/DTZYfsCD6Lk/', 'Behind the Scenes', true, 4),
  ('https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80', 'https://www.instagram.com/apoorvpatel_photography/', 'Portrait Session', true, 5),
  ('https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&q=80', 'https://www.instagram.com/apoorvpatel_photography/', 'Family Moments', true, 6);

-- Sample Leads
insert into public.leads (name, mobile, whatsapp, email, service_type, event_type, event_date, location, message, status, source) values
  ('Priya Sharma', '+91 98765 43210', '+91 98765 43210', 'priya@example.com', 'Wedding Photography', 'Wedding', '2026-12-15', 'Gujarat, India', 'Looking for full-day wedding photography coverage.', 'new', 'website'),
  ('James Wilson', '+44 7700 900123', '+44 7700 900123', 'james@example.com', 'Photo Editing', null, null, 'London, UK', 'Need editing for 200+ wedding photos.', 'contacted', 'instagram'),
  ('Neha Patel', '+91 99887 76655', '+91 99887 76655', 'neha@example.com', 'Pre-Wedding Shoot', 'Pre-Wedding', '2026-11-20', 'Udaipur, India', 'Pre-wedding shoot at heritage locations.', 'quotation_sent', 'whatsapp'),
  ('Ravi Kumar', '+91 88776 65544', '+91 88776 65544', 'ravi@example.com', 'Photography Training', null, null, 'Mumbai, India', 'Interested in the photography masterclass.', 'new', 'website'),
  ('Sarah Thompson', '+44 7911 123456', '+44 7911 123456', 'sarah@example.com', 'Wedding Videography', 'Wedding', '2026-09-10', 'Birmingham, UK', 'Need cinematic wedding video.', 'confirmed', 'website');
