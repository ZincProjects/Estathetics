-- Estathetics core schema
-- Conventions: every row-owning table carries `owner_id`/`agent_id` for cheap RLS checks.


-- ─── Enums ──────────────────────────────────────────────────────────────
create type public.user_role as enum ('interior_designer', 'agent', 'buyer', 'admin');
create type public.org_kind as enum ('design_firm', 'agency');
create type public.property_type as enum ('hdb', 'condo', 'ec', 'landed');
create type public.tenure_type as enum ('leasehold_99', 'leasehold_999', 'freehold', 'leasehold_other');
create type public.listing_status as enum ('draft', 'published', 'archived');
create type public.design_status as enum ('pending', 'ready', 'failed');
create type public.job_status as enum ('queued', 'running', 'succeeded', 'failed');
create type public.collab_status as enum ('invited', 'accepted', 'declined', 'revoked');
create type public.lead_kind as enum ('enquiry', 'get_this_look');
create type public.lead_status as enum ('new', 'contacted', 'won', 'lost');
create type public.content_kind as enum ('listing_copy', 'social_pack', 'utilisation');

-- ─── Helpers ────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ─── Organisations & profiles ───────────────────────────────────────────
create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  kind public.org_kind not null,
  name text not null check (char_length(name) between 1 and 160),
  website text,
  logo_path text,
  cea_licence text, -- agency licence number (L1234567X) for agencies
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role,
  full_name text,
  slug text unique,
  avatar_path text,
  phone text,
  bio text,
  organisation_id uuid references public.organisations (id) on delete set null,
  -- Interior designers
  firm_name text,
  specialties text[] not null default '{}',
  portfolio_urls text[] not null default '{}',
  -- Agents: CEA registration number (e.g. R123456A), required for agents
  agency_name text,
  cea_number text,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agent_requires_cea check (
    role is distinct from 'agent' or onboarded_at is null or cea_number ~ '^[A-Z][0-9]{6}[A-Z]$'
  )
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile row for every new auth user. Role comes from signup metadata if valid.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  requested text := new.raw_user_meta_data ->> 'role';
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    case when requested in ('interior_designer', 'agent', 'buyer')
         then requested::public.user_role else null end
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users may not promote themselves to admin.
create or replace function public.guard_profile_role()
returns trigger language plpgsql as $$
begin
  if new.role = 'admin' and (old.role is distinct from 'admin')
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'cannot self-assign admin role';
  end if;
  return new;
end $$;
create trigger profiles_guard_role before update on public.profiles
  for each row execute function public.guard_profile_role();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ─── ID side: projects → rooms → photos / scans / designs ──────────────
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title text not null check (char_length(title) between 1 and 160),
  client_name text,
  property_type public.property_type,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.projects (owner_id, updated_at desc);
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null check (char_length(name) between 1 and 120),
  room_type text,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.rooms (project_id, sort);

create table public.room_photos (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  storage_path text not null, -- originals bucket: {owner_id}/{room_id}/{uuid}.jpg
  width int,
  height int,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.room_photos (room_id, created_at);

create table public.room_scans (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  photo_id uuid references public.room_photos (id) on delete set null,
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  data jsonb not null,
  prompt_version text not null,
  model text not null,
  edited_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.room_scans (room_id, created_at desc);

create table public.themes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete cascade, -- null for presets
  slug text not null,
  name text not null check (char_length(name) between 1 and 80),
  description text,
  palette text[] not null default '{}',
  materials text[] not null default '{}',
  mood text[] not null default '{}',
  is_preset boolean not null default false,
  created_at timestamptz not null default now(),
  unique (owner_id, slug)
);
create unique index themes_preset_slug on public.themes (slug) where owner_id is null;

-- ─── Agent side: listings ──────────────────────────────────────────────
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  slug text not null unique,
  status public.listing_status not null default 'draft',
  property_type public.property_type not null,
  title text not null check (char_length(title) between 1 and 160),
  address text not null,
  postal_code text check (postal_code ~ '^[0-9]{6}$'),
  block text,
  unit text,
  lat double precision,
  lng double precision,
  size_sqft numeric(8, 1) check (size_sqft > 0),
  bedrooms smallint check (bedrooms between 0 and 20),
  bathrooms smallint check (bathrooms between 0 and 20),
  floor_level text, -- e.g. "High", "12", "07 to 09"
  facing text,
  tenure public.tenure_type,
  lease_start_year smallint check (lease_start_year between 1960 and 2100),
  top_year smallint,
  facilities text[] not null default '{}',
  asking_price numeric(12, 0) check (asking_price >= 0),
  highlights text, -- free-text facts from the agent, used as AI grounding
  cover_photo_path text,
  view_count int not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.listings (agent_id, updated_at desc);
create index on public.listings (status, published_at desc);
create trigger listings_updated_at before update on public.listings
  for each row execute function public.set_updated_at();

create table public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  agent_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  storage_path text not null, -- listings bucket: {agent_id}/{listing_id}/{uuid}.jpg
  room_label text,
  sort int not null default 0,
  width int,
  height int,
  created_at timestamptz not null default now()
);
create index on public.listing_photos (listing_id, sort);

create table public.listing_amenities (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  category text not null, -- mrt, bus, mall, hawker, supermarket, primary_school, park, clinic, hospital
  name text not null,
  lat double precision not null,
  lng double precision not null,
  distance_m int not null,
  walk_minutes int not null,
  source text not null, -- onemap | google | dataset | mock
  created_at timestamptz not null default now()
);
create index on public.listing_amenities (listing_id, category, distance_m);

create table public.listing_content (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  agent_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  kind public.content_kind not null,
  tone text,
  data jsonb not null,
  prompt_version text not null,
  is_current boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.listing_content (listing_id, kind, created_at desc);

-- ─── Designs (ID redesigns; optionally staged onto a listing photo) ────
create table public.designs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  room_id uuid references public.rooms (id) on delete cascade,
  source_photo_id uuid references public.room_photos (id) on delete set null,
  listing_id uuid references public.listings (id) on delete cascade,
  listing_photo_id uuid references public.listing_photos (id) on delete cascade,
  theme_id uuid references public.themes (id) on delete set null,
  theme_name text not null,
  batch_id uuid not null,
  variation smallint not null default 1,
  status public.design_status not null default 'pending',
  storage_path text, -- designs bucket, always watermarked
  prompt text,
  provider text,
  chosen boolean not null default false,
  created_at timestamptz not null default now(),
  constraint design_has_source check (room_id is not null or listing_photo_id is not null)
);
create index on public.designs (room_id, created_at desc);
create index on public.designs (batch_id, variation);
create index on public.designs (listing_id) where listing_id is not null;

create table public.design_breakdowns (
  design_id uuid primary key references public.designs (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  data jsonb not null,
  prompt_version text not null,
  created_at timestamptz not null default now()
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  room_id uuid references public.rooms (id) on delete cascade,
  design_id uuid references public.designs (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index on public.chat_messages (room_id, created_at);

-- ─── The Bridge ─────────────────────────────────────────────────────────
create table public.collaborations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  agent_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  designer_id uuid references auth.users (id) on delete cascade,
  invite_email text,
  status public.collab_status not null default 'invited',
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collab_has_target check (designer_id is not null or invite_email is not null)
);
create unique index on public.collaborations (listing_id, designer_id) where designer_id is not null;
create trigger collaborations_updated_at before update on public.collaborations
  for each row execute function public.set_updated_at();

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  kind public.lead_kind not null,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  listing_id uuid references public.listings (id) on delete set null,
  design_id uuid references public.designs (id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  email text check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text,
  budget text,
  timeline text,
  message text check (char_length(message) <= 2000),
  pdpa_consent boolean not null check (pdpa_consent),
  consent_text text not null,
  status public.lead_status not null default 'new',
  created_at timestamptz not null default now(),
  constraint lead_has_contact check (email is not null or phone is not null)
);
create index on public.leads (recipient_id, created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.notifications (user_id, created_at desc);

-- ─── AI jobs, usage & rate limiting ─────────────────────────────────────
create table public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  kind text not null, -- room_scan | redesign | listing_copy | ...
  status public.job_status not null default 'queued',
  progress smallint not null default 0 check (progress between 0 and 100),
  message text,
  input jsonb not null default '{}',
  output jsonb,
  error text,
  provider_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.generation_jobs (owner_id, created_at desc);
create index on public.generation_jobs (provider_ref) where provider_ref is not null;
create trigger generation_jobs_updated_at before update on public.generation_jobs
  for each row execute function public.set_updated_at();

create table public.usage_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  units int not null default 1,
  input_tokens int,
  output_tokens int,
  est_cost_usd numeric(10, 5),
  mocked boolean not null default false,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index on public.usage_events (user_id, kind, created_at desc);

/**
 * Sliding-window rate limit for the calling user. Returns remaining allowance
 * (>= 0) when the call is allowed, or -1 when the limit is reached.
 */
create or replace function public.check_rate_limit(p_kind text, p_limit int, p_window_seconds int)
returns int language plpgsql stable security definer set search_path = '' as $$
declare
  used int;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  select coalesce(sum(units), 0) into used
  from public.usage_events
  where user_id = auth.uid()
    and kind = p_kind
    and created_at > now() - make_interval(secs => p_window_seconds);
  if used >= p_limit then
    return -1;
  end if;
  return p_limit - used;
end $$;

-- Public listing view counter (callable by anon).
create or replace function public.increment_listing_view(p_slug text)
returns void language sql security definer set search_path = '' as $$
  update public.listings set view_count = view_count + 1
  where slug = p_slug and status = 'published';
$$;
