-- ============================================================
-- Apoorvpatel Photography — Supabase Database Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PORTFOLIO PROJECTS
-- ============================================================
create table public.portfolio_projects (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text unique not null,
  category text not null,
  cover_image text not null,
  images text[] not null default '{}',
  video_url text,
  reel_url text,
  description text not null default '',
  date text not null default '',
  location text not null default '',
  featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_portfolio_category on public.portfolio_projects(category);
create index idx_portfolio_featured on public.portfolio_projects(featured) where featured = true;

-- ============================================================
-- 2. SERVICES
-- ============================================================
create table public.services (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  category text not null check (category in ('photography', 'videography', 'editing')),
  description text not null default '',
  icon text not null default 'Camera',
  features text[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_services_category on public.services(category);

-- ============================================================
-- 3. TRAINING COURSES
-- ============================================================
create table public.training_courses (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null default '',
  duration text not null default '',
  level text not null default 'Beginner',
  curriculum text[] not null default '{}',
  tools text[] not null default '{}',
  fee text not null default '',
  mode text not null default 'Online & Offline',
  image text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 4. TESTIMONIALS
-- ============================================================
create table public.testimonials (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  review text not null,
  service text not null default '',
  date text not null default '',
  rating int not null default 5 check (rating >= 1 and rating <= 5),
  approved boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_testimonials_approved on public.testimonials(approved) where approved = true;

-- ============================================================
-- 5. INSTAGRAM REELS
-- ============================================================
create table public.instagram_reels (
  id uuid primary key default uuid_generate_v4(),
  thumbnail text not null,
  url text not null,
  title text not null default '',
  featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 6. LEADS / INQUIRIES
-- ============================================================
create type public.lead_status as enum (
  'new', 'contacted', 'requirement_confirmed', 'quotation_sent',
  'follow_up', 'confirmed', 'completed', 'lost', 'cancelled'
);

create table public.leads (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  mobile text not null default '',
  whatsapp text not null default '',
  email text not null default '',
  service_type text not null default '',
  event_type text,
  event_date date,
  location text,
  budget text,
  message text not null default '',
  status public.lead_status not null default 'new',
  source text not null default 'website',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_leads_status on public.leads(status);
create index idx_leads_created on public.leads(created_at desc);

-- ============================================================
-- 7. LEAD NOTES
-- ============================================================
create table public.lead_notes (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index idx_lead_notes_lead on public.lead_notes(lead_id);

-- ============================================================
-- 8. SITE SETTINGS (key-value for stats, contact info, etc.)
-- ============================================================
create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_portfolio_updated before update on public.portfolio_projects
  for each row execute function public.update_updated_at();

create trigger trg_services_updated before update on public.services
  for each row execute function public.update_updated_at();

create trigger trg_training_updated before update on public.training_courses
  for each row execute function public.update_updated_at();

create trigger trg_leads_updated before update on public.leads
  for each row execute function public.update_updated_at();

create trigger trg_settings_updated before update on public.site_settings
  for each row execute function public.update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Portfolio: public read, admin write
alter table public.portfolio_projects enable row level security;
create policy "Portfolio public read" on public.portfolio_projects
  for select using (true);
create policy "Portfolio admin write" on public.portfolio_projects
  for all using (auth.role() = 'authenticated');

-- Services: public read, admin write
alter table public.services enable row level security;
create policy "Services public read" on public.services
  for select using (true);
create policy "Services admin write" on public.services
  for all using (auth.role() = 'authenticated');

-- Training: public read, admin write
alter table public.training_courses enable row level security;
create policy "Training public read" on public.training_courses
  for select using (true);
create policy "Training admin write" on public.training_courses
  for all using (auth.role() = 'authenticated');

-- Testimonials: public read approved only, admin full access
alter table public.testimonials enable row level security;
create policy "Testimonials public read approved" on public.testimonials
  for select using (approved = true or auth.role() = 'authenticated');
create policy "Testimonials admin write" on public.testimonials
  for all using (auth.role() = 'authenticated');

-- Reels: public read, admin write
alter table public.instagram_reels enable row level security;
create policy "Reels public read" on public.instagram_reels
  for select using (true);
create policy "Reels admin write" on public.instagram_reels
  for all using (auth.role() = 'authenticated');

-- Leads: admin only
alter table public.leads enable row level security;
create policy "Leads insert from website" on public.leads
  for insert with check (true);
create policy "Leads admin access" on public.leads
  for all using (auth.role() = 'authenticated');

-- Lead notes: admin only
alter table public.lead_notes enable row level security;
create policy "Lead notes admin access" on public.lead_notes
  for all using (auth.role() = 'authenticated');

-- Site settings: public read, admin write
alter table public.site_settings enable row level security;
create policy "Settings public read" on public.site_settings
  for select using (true);
create policy "Settings admin write" on public.site_settings
  for all using (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('reels', 'reels', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('general', 'general', true)
on conflict (id) do nothing;

-- Storage policies: public read, admin upload
create policy "Portfolio images public read" on storage.objects
  for select using (bucket_id = 'portfolio');
create policy "Portfolio images admin upload" on storage.objects
  for insert with check (bucket_id = 'portfolio' and auth.role() = 'authenticated');
create policy "Portfolio images admin delete" on storage.objects
  for delete using (bucket_id = 'portfolio' and auth.role() = 'authenticated');

create policy "Reels thumbnails public read" on storage.objects
  for select using (bucket_id = 'reels');
create policy "Reels thumbnails admin upload" on storage.objects
  for insert with check (bucket_id = 'reels' and auth.role() = 'authenticated');
create policy "Reels thumbnails admin delete" on storage.objects
  for delete using (bucket_id = 'reels' and auth.role() = 'authenticated');

create policy "General images public read" on storage.objects
  for select using (bucket_id = 'general');
create policy "General images admin upload" on storage.objects
  for insert with check (bucket_id = 'general' and auth.role() = 'authenticated');
create policy "General images admin delete" on storage.objects
  for delete using (bucket_id = 'general' and auth.role() = 'authenticated');

-- ============================================================
-- SEED: Default site settings
-- ============================================================
insert into public.site_settings (key, value) values
  ('stats', '{"projects": "500+", "clients": "300+", "experience": "10+", "countries": "2"}'::jsonb),
  ('contact', '{"email": "contact@apoorvpatelphotography.com", "phone": "", "whatsapp": "", "instagram": "apoorvpatel_photography", "location_india": "India", "location_uk": "United Kingdom"}'::jsonb)
on conflict (key) do nothing;
