-- ==============================================================================
-- OPTIONAL hardening — review before running (changes live permissions)
--
-- Today anonymous visitors may INSERT into public.inquiries directly with the public
-- key, which bypasses the duplicate check and the 5-per-hour limit enforced inside
-- public.submit_customer_inquiry(). The website itself never inserts directly: the
-- /api/submit-inquiry endpoint calls that function (SECURITY DEFINER, so it still works
-- after this change), and only falls back to a direct insert with the server-side
-- service-role key.
--
-- Effect: spam bots can no longer write enquiries without going through the checks.
-- Risk: if SUPABASE_SERVICE_ROLE_KEY is NOT set in Vercel and the function is missing,
-- enquiries would fail — run the System Check (or submit a test enquiry) afterwards.
-- Undo: grant insert on public.inquiries to anon, authenticated;
-- ==============================================================================

revoke insert on public.inquiries from anon, authenticated;
drop policy if exists "Inquiries insert from public" on public.inquiries;

-- The function keeps working for the website:
grant execute on function public.submit_customer_inquiry to anon, authenticated, service_role;
