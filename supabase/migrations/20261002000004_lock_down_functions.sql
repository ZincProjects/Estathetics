-- Functions get EXECUTE for PUBLIC by default. Move RLS helpers out of the exposed
-- `public` schema and revoke direct execution of trigger functions.

create schema if not exists private;
grant usage on schema private to anon, authenticated;

alter function public.is_admin() set schema private;
alter function public.listing_is_published(uuid) set schema private;
alter function public.owns_listing(uuid) set schema private;
alter function public.collaborates_on(uuid) set schema private;
alter function public.owns_project(uuid) set schema private;
alter function public.lead_target_valid(public.lead_kind, uuid, uuid, uuid) set schema private;

-- Policies call these as the requesting role, so they need EXECUTE (but are no longer RPC-exposed).
grant execute on all functions in schema private to anon, authenticated;

-- Trigger functions never need to be called directly.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.notify_new_lead() from public, anon, authenticated;
revoke execute on function public.guard_profile_role() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- Intentional RPCs.
revoke execute on function public.check_rate_limit(text, int, int) from public, anon;
grant execute on function public.check_rate_limit(text, int, int) to authenticated;
revoke execute on function public.increment_listing_view(text) from public;
grant execute on function public.increment_listing_view(text) to anon, authenticated;

-- Future functions: no implicit PUBLIC execute.
alter default privileges in schema public revoke execute on functions from public;
