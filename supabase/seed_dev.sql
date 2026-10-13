-- ==============================================================================
-- DEVELOPMENT-ONLY SEED DATA (Local Testing Sandbox)
-- File: supabase/seed_dev.sql
-- ==============================================================================
-- DO NOT RUN THIS IN PRODUCTION.
-- This script contains sample mock records for development and local testing.
-- ==============================================================================

-- Sample Portfolio Projects
insert into public.portfolio_projects (slug, title, category, description, location, event_date, cover_image_url, is_real_work, is_featured, is_published, display_order)
values
  ('sample-wedding-ceremony', 'Sample Wedding Ceremony', 'Wedding', 'A traditional wedding celebration captured with elegance.', 'Gujarat, India', '2026', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80', false, true, true, 2),
  ('sample-pre-wedding', 'Sample Romantic Shoot', 'Pre-Wedding', 'A picturesque outdoor couples shoot.', 'Udaipur, India', '2026', 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800&q=80', false, true, true, 3)
on conflict (slug) do nothing;

-- Sample Testimonials
insert into public.testimonials (client_name, client_location, testimonial, service, date, rating, is_featured, is_approved, display_order)
values
  ('Priya & Ravi (Sample)', 'Ahmedabad, India', 'Apoorv captured our wedding day with breathtaking grace. Every photo is a work of art.', 'Wedding Photography', '2026', 5, true, true, 1),
  ('James & Emma (Sample)', 'London, UK', 'Incredible pre-wedding shoot in London. Super professional and cinematic results.', 'Pre-Wedding Shoot', '2025', 5, true, true, 2)
on conflict do nothing;

-- Sample Inquiries (Sandbox Testing Only)
insert into public.inquiries (customer_name, email, phone, event_type, event_date, event_location, budget, message, inquiry_status, source)
values
  ('Test Client', 'test@example.com', '+91 98765 43210', 'Wedding', '2026-12-20', 'Ahmedabad', 'Premium', 'This is a sample inquiry for admin dashboard testing.', 'new', 'website')
on conflict do nothing;
