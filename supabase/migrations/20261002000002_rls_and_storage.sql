-- Row Level Security for every public table, plus storage buckets.

-- Explicit grants (RLS still decides which rows are visible).
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.profiles, public.organisations, public.themes, public.listings,
  public.listing_photos, public.listing_amenities, public.listing_content, public.designs to anon;
grant insert on public.leads to anon;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.increment_listing_view(text) to anon, authenticated;
grant execute on function public.check_rate_limit(text, int, int) to authenticated;
revoke execute on function public.check_rate_limit(text, int, int) from anon;

alter table public.organisations enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.rooms enable row level security;
alter table public.room_photos enable row level security;
alter table public.room_scans enable row level security;
alter table public.themes enable row level security;
alter table public.listings enable row level security;
alter table public.listing_photos enable row level security;
alter table public.listing_amenities enable row level security;
alter table public.listing_content enable row level security;
alter table public.designs enable row level security;
alter table public.design_breakdowns enable row level security;
alter table public.chat_messages enable row level security;
alter table public.collaborations enable row level security;
alter table public.leads enable row level security;
alter table public.notifications enable row level security;
alter table public.generation_jobs enable row level security;
alter table public.usage_events enable row level security;

-- Helper: is a listing published? (security definer avoids recursive RLS lookups)
create or replace function public.listing_is_published(p_listing uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.listings where id = p_listing and status = 'published');
$$;

create or replace function public.owns_listing(p_listing uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.listings where id = p_listing and agent_id = auth.uid());
$$;

create or replace function public.collaborates_on(p_listing uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.collaborations
    where listing_id = p_listing and designer_id = auth.uid() and status = 'accepted'
  );
$$;

create or replace function public.owns_project(p_project uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.projects where id = p_project and owner_id = auth.uid());
$$;

-- ─── organisations ─────────────────────────────────────────────────────
create policy "organisations are public" on public.organisations for select using (true);
create policy "users create organisations" on public.organisations for insert to authenticated
  with check (created_by = auth.uid());
create policy "creators update organisations" on public.organisations for update to authenticated
  using (created_by = auth.uid()) with check (created_by = auth.uid());

-- ─── profiles ──────────────────────────────────────────────────────────
-- Professional profiles (agents and IDs) are public: listings show agent name + CEA number.
create policy "professional profiles are public" on public.profiles for select
  using (role in ('agent', 'interior_designer') and onboarded_at is not null);
create policy "users read own profile" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy "users update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ─── projects / rooms / photos / scans ─────────────────────────────────
create policy "owners manage projects" on public.projects for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "owners manage rooms" on public.rooms for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and public.owns_project(project_id));

create policy "owners manage room photos" on public.room_photos for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "owners manage room scans" on public.room_scans for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ─── themes ────────────────────────────────────────────────────────────
create policy "preset themes are public" on public.themes for select using (owner_id is null);
create policy "owners read own themes" on public.themes for select to authenticated
  using (owner_id = auth.uid());
create policy "owners write own themes" on public.themes for insert to authenticated
  with check (owner_id = auth.uid() and not is_preset);
create policy "owners update own themes" on public.themes for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid() and not is_preset);
create policy "owners delete own themes" on public.themes for delete to authenticated
  using (owner_id = auth.uid());

-- ─── listings ──────────────────────────────────────────────────────────
create policy "published listings are public" on public.listings for select using (status = 'published');
create policy "agents manage own listings" on public.listings for all to authenticated
  using (agent_id = auth.uid()) with check (agent_id = auth.uid());
create policy "collaborators read listings" on public.listings for select to authenticated
  using (public.collaborates_on(id));

create policy "listing photos readable" on public.listing_photos for select
  using (public.listing_is_published(listing_id) or agent_id = auth.uid() or public.collaborates_on(listing_id));
create policy "agents manage listing photos" on public.listing_photos for all to authenticated
  using (agent_id = auth.uid()) with check (agent_id = auth.uid() and public.owns_listing(listing_id));

create policy "listing amenities readable" on public.listing_amenities for select
  using (public.listing_is_published(listing_id) or public.owns_listing(listing_id));
create policy "agents manage amenities" on public.listing_amenities for all to authenticated
  using (public.owns_listing(listing_id)) with check (public.owns_listing(listing_id));

create policy "listing content readable" on public.listing_content for select
  using ((public.listing_is_published(listing_id) and is_current) or agent_id = auth.uid());
create policy "agents manage listing content" on public.listing_content for all to authenticated
  using (agent_id = auth.uid()) with check (agent_id = auth.uid() and public.owns_listing(listing_id));

-- ─── designs ───────────────────────────────────────────────────────────
create policy "owners manage designs" on public.designs for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and (listing_id is null or public.collaborates_on(listing_id) or public.owns_listing(listing_id)));
create policy "staged designs on published listings are public" on public.designs for select
  using (listing_id is not null and status = 'ready' and public.listing_is_published(listing_id));
create policy "agents see designs on their listings" on public.designs for select to authenticated
  using (listing_id is not null and public.owns_listing(listing_id));

create policy "owners manage breakdowns" on public.design_breakdowns for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "owners manage chat" on public.chat_messages for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ─── collaborations ────────────────────────────────────────────────────
create policy "agents manage collaborations" on public.collaborations for all to authenticated
  using (agent_id = auth.uid()) with check (agent_id = auth.uid() and public.owns_listing(listing_id));
create policy "designers read their invites" on public.collaborations for select to authenticated
  using (designer_id = auth.uid());
create policy "designers respond to invites" on public.collaborations for update to authenticated
  using (designer_id = auth.uid()) with check (designer_id = auth.uid() and status in ('accepted', 'declined'));

-- ─── leads ─────────────────────────────────────────────────────────────
-- Anyone may submit a lead, but only to the agent of a published listing or the
-- owner of a published staged design, and only with PDPA consent.
create or replace function public.lead_target_valid(p_kind public.lead_kind, p_recipient uuid, p_listing uuid, p_design uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select case p_kind
    when 'enquiry' then exists (
      select 1 from public.listings
      where id = p_listing and agent_id = p_recipient and status = 'published')
    when 'get_this_look' then exists (
      select 1 from public.designs d
      where d.id = p_design and d.owner_id = p_recipient and d.status = 'ready')
  end;
$$;
grant execute on function public.lead_target_valid(public.lead_kind, uuid, uuid, uuid) to anon, authenticated;

create policy "anyone submits consented leads" on public.leads for insert
  with check (pdpa_consent and status = 'new' and public.lead_target_valid(kind, recipient_id, listing_id, design_id));
create policy "recipients read leads" on public.leads for select to authenticated
  using (recipient_id = auth.uid());
create policy "recipients update leads" on public.leads for update to authenticated
  using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
create policy "recipients delete leads" on public.leads for delete to authenticated
  using (recipient_id = auth.uid());

-- Notify the recipient of a new lead.
create or replace function public.notify_new_lead()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (user_id, type, title, body, link)
  values (
    new.recipient_id,
    'lead',
    case new.kind when 'enquiry' then 'New listing enquiry' else 'New "Get this look" request' end,
    new.name || coalesce(' · ' || new.budget, ''),
    '/leads'
  );
  return new;
end $$;
create trigger leads_notify after insert on public.leads
  for each row execute function public.notify_new_lead();

-- ─── notifications ─────────────────────────────────────────────────────
create policy "users read notifications" on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy "users mark notifications" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users delete notifications" on public.notifications for delete to authenticated
  using (user_id = auth.uid());

-- ─── jobs & usage ──────────────────────────────────────────────────────
create policy "owners manage jobs" on public.generation_jobs for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "users read own usage" on public.usage_events for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "users record own usage" on public.usage_events for insert to authenticated
  with check (user_id = auth.uid());
-- No update/delete policy: usage rows are append-only for users.

-- ─── Storage ───────────────────────────────────────────────────────────
-- originals: private room photos. designs/listings/avatars: public read, owner-prefixed writes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('originals', 'originals', false, 15728640, array['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('designs',   'designs',   true,  15728640, array['image/jpeg', 'image/png', 'image/webp']),
  ('listings',  'listings',  true,  15728640, array['image/jpeg', 'image/png', 'image/webp']),
  ('avatars',   'avatars',   true,  5242880,  array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "owners read originals" on storage.objects for select to authenticated
  using (bucket_id = 'originals' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "owners upload to own folder" on storage.objects for insert to authenticated
  with check (
    bucket_id in ('originals', 'designs', 'listings', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "owners update own objects" on storage.objects for update to authenticated
  using (
    bucket_id in ('originals', 'designs', 'listings', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "owners delete own objects" on storage.objects for delete to authenticated
  using (
    bucket_id in ('originals', 'designs', 'listings', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
