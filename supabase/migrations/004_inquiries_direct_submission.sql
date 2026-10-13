-- ==============================================================================
-- Apoorv Patel Photography — Direct Customer Inquiry Submission & Security Hardening
-- Migration: 004_inquiries_direct_submission.sql
-- ==============================================================================

-- 1. Ensure 'whatsapp' column exists on public.inquiries
alter table public.inquiries add column if not exists whatsapp text;

-- 2. Update 'leads' view to include dedicated whatsapp column
create or replace view public.leads as
select
  id,
  customer_name as name,
  phone as mobile,
  coalesce(whatsapp, phone) as whatsapp,
  email,
  coalesce(event_type, 'General') as service_type,
  event_type,
  event_date,
  event_location as location,
  budget,
  message,
  inquiry_status as status,
  source,
  notes,
  created_at,
  updated_at
from public.inquiries;

-- 3. Row Level Security & Access Permissions on public.inquiries
alter table public.inquiries enable row level security;

-- Grant INSERT to anon and authenticated so customer inquiries can be recorded
grant insert on public.inquiries to anon, authenticated, service_role;

-- Revoke SELECT, UPDATE, DELETE from public and anon (airtight privacy)
revoke select, update, delete on public.inquiries from public, anon;
revoke select, update, delete on public.leads from public, anon;

-- Inquiries Insert Policy with input bounds
drop policy if exists "Inquiries insert from public" on public.inquiries;
create policy "Inquiries insert from public" on public.inquiries
  for insert with check (
    char_length(customer_name) >= 2 and
    char_length(message) >= 5 and
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

-- Only verified administrators can SELECT, UPDATE, or DELETE inquiries
drop policy if exists "Inquiries admin view" on public.inquiries;
create policy "Inquiries admin view" on public.inquiries
  for select using (public.is_admin());

drop policy if exists "Inquiries admin update" on public.inquiries;
create policy "Inquiries admin update" on public.inquiries
  for update using (public.is_admin());

drop policy if exists "Inquiries admin delete" on public.inquiries;
create policy "Inquiries admin delete" on public.inquiries
  for delete using (public.is_admin());

-- Allow service_role full internal access
grant select, insert, update, delete on public.inquiries to service_role;
grant select, update, delete on public.inquiries to authenticated;

-- 4. Server-Side Stored Function with Persistent Rate Limiting
-- Function is SECURITY DEFINER: executes with owner privileges to safely return ID
-- without exposing SELECT permissions on inquiries to anonymous visitors
create or replace function public.submit_customer_inquiry(
  p_customer_name text,
  p_email text,
  p_phone text default '',
  p_whatsapp text default '',
  p_event_type text default null,
  p_event_date date default null,
  p_event_location text default null,
  p_budget text default null,
  p_message text default '',
  p_source text default 'website'
)
returns jsonb as $$
declare
  v_inquiry_id uuid;
  v_clean_name text;
  v_clean_email text;
  v_clean_msg text;
  v_hourly_count int;
begin
  v_clean_name := trim(p_customer_name);
  v_clean_email := lower(trim(p_email));
  v_clean_msg := trim(p_message);

  -- Input Validation
  if char_length(v_clean_name) < 2 or char_length(v_clean_name) > 100 then
    return jsonb_build_object('success', false, 'error', 'Full name must be between 2 and 100 characters.');
  end if;

  if v_clean_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' or char_length(v_clean_email) > 150 then
    return jsonb_build_object('success', false, 'error', 'Please provide a valid email address.');
  end if;

  if char_length(v_clean_msg) < 5 or char_length(v_clean_msg) > 4000 then
    return jsonb_build_object('success', false, 'error', 'Message must be between 5 and 4000 characters.');
  end if;

  -- 1. Anti-Spam / Duplicate Submission Check (60 seconds)
  if exists (
    select 1 from public.inquiries
    where email = v_clean_email
      and message = v_clean_msg
      and created_at > (now() - interval '60 seconds')
  ) then
    return jsonb_build_object('success', false, 'error', 'A duplicate inquiry was recently received. Please allow a minute before submitting again.');
  end if;

  -- 2. Persistent Database-Backed Rate Limiting (Max 5 submissions per email per hour)
  select count(*) into v_hourly_count
  from public.inquiries
  where email = v_clean_email
    and created_at > (now() - interval '1 hour');

  if v_hourly_count >= 5 then
    return jsonb_build_object('success', false, 'error', 'Submission limit reached for this email. Please contact our studio directly via WhatsApp.');
  end if;

  -- 3. Insert verified record
  insert into public.inquiries (
    customer_name,
    email,
    phone,
    whatsapp,
    event_type,
    event_date,
    event_location,
    budget,
    message,
    inquiry_status,
    source
  ) values (
    v_clean_name,
    v_clean_email,
    trim(p_phone),
    trim(p_whatsapp),
    nullif(trim(p_event_type), ''),
    p_event_date,
    nullif(trim(p_event_location), ''),
    nullif(trim(p_budget), ''),
    v_clean_msg,
    'new',
    coalesce(nullif(trim(p_source), ''), 'website')
  )
  returning id into v_inquiry_id;

  return jsonb_build_object('success', true, 'id', v_inquiry_id);
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

-- Grant execute to anon and service_role so inquiries can be safely submitted
grant execute on function public.submit_customer_inquiry to anon, authenticated, service_role;
