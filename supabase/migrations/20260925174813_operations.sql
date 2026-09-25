-- E1-04: operations (leads, site settings, admin profiles).
-- A lead is never stored without consent (LOPDP, RNF-19) and only holds the
-- data declared in docs/COPY.md section 7: no free-text message and no
-- identity documents (RNF-20). Row Level Security is enabled with no
-- policies until E1-05.

-- Enums --------------------------------------------------------------------

create type public.lead_source as enum ('assistant', 'form', 'whatsapp');

create type public.lead_status as enum ('new', 'contacted', 'closed', 'lost');

create type public.app_role as enum ('admin');

-- lead ---------------------------------------------------------------------

create table public.lead (
  id uuid primary key default gen_random_uuid(),
  name text check (length(trim(name)) > 0),
  phone text check (phone ~ '^\+?[0-9 ]{7,20}$'),
  email text check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  service_id uuid references public.service (id) on delete set null,
  plan_id uuid references public.plan (id) on delete set null,
  source public.lead_source not null,
  utm jsonb not null default '{}'::jsonb check (jsonb_typeof(utm) = 'object'),
  status public.lead_status not null default 'new',
  notes text,
  consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lead_has_contact check (phone is not null or email is not null)
);

create index lead_created_at_idx on public.lead (created_at desc);
create index lead_status_idx on public.lead (status);
create index lead_service_id_idx on public.lead (service_id);
create index lead_plan_id_idx on public.lead (plan_id);

create trigger lead_set_updated_at before update on public.lead
  for each row execute function public.set_updated_at();

-- site_settings ------------------------------------------------------------

create table public.site_settings (
  key text primary key check (key ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  value jsonb not null,
  -- Public settings (WhatsApp, social links) can be read by the site; the
  -- rest (e.g. the assistant prompt) stay private. Enforced in E1-05.
  is_public boolean not null default false,
  updated_at timestamptz not null default now()
);

create trigger site_settings_set_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

-- profile ------------------------------------------------------------------

create table public.profile (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  -- Null means no access. The admin role is granted manually.
  role public.app_role,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profile_set_updated_at before update on public.profile
  for each row execute function public.set_updated_at();

-- Every new Auth user gets a profile without a role.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profile (id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security (policies in E1-05) -----------------------------------

alter table public.lead enable row level security;
alter table public.site_settings enable row level security;
alter table public.profile enable row level security;
