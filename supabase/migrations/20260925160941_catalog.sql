-- E1-02: service catalog (category > service > plan > requirement).
-- Prices are stored without VAT together with the VAT rate; the site shows
-- the total. Row Level Security is enabled with no policies: nothing is
-- readable or writable through the API until E1-05 adds the policies.

-- Enums --------------------------------------------------------------------

create type public.service_kind as enum ('service', 'own_product', 'resale');

create type public.holder_type as enum ('natural', 'legal_entity', 'not_applicable');

create type public.duration_unit as enum ('day', 'month', 'year');

-- updated_at trigger -------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- category -----------------------------------------------------------------

create table public.category (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  visible boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index category_sort_order_idx on public.category (sort_order);

-- service ------------------------------------------------------------------

create table public.service (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.category (id) on delete restrict,
  kind public.service_kind not null default 'service',
  name text not null check (length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  summary text,
  body_md text,
  icon text,
  featured boolean not null default false,
  visible boolean not null default false,
  external_app_url text check (external_app_url ~ '^https://'),
  sort_order integer not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_own_product_needs_app_url
    check (kind <> 'own_product' or external_app_url is not null)
);

create index service_category_sort_idx on public.service (category_id, sort_order);

-- plan ---------------------------------------------------------------------

create table public.plan (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.service (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  holder_type public.holder_type not null default 'not_applicable',
  duration_value integer check (duration_value > 0),
  duration_unit public.duration_unit,
  price_without_vat numeric(10, 2) not null check (price_without_vat >= 0),
  vat_rate numeric(5, 4) not null check (vat_rate >= 0 and vat_rate <= 1),
  visible boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plan_duration_complete
    check ((duration_value is null) = (duration_unit is null))
);

create index plan_service_sort_idx on public.plan (service_id, sort_order);

-- requirement --------------------------------------------------------------

create table public.requirement (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plan (id) on delete cascade,
  text text not null check (length(trim(text)) > 0),
  required boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index requirement_plan_sort_idx on public.requirement (plan_id, sort_order);

-- Triggers -----------------------------------------------------------------

create trigger category_set_updated_at before update on public.category
  for each row execute function public.set_updated_at();

create trigger service_set_updated_at before update on public.service
  for each row execute function public.set_updated_at();

create trigger plan_set_updated_at before update on public.plan
  for each row execute function public.set_updated_at();

create trigger requirement_set_updated_at before update on public.requirement
  for each row execute function public.set_updated_at();

-- Row Level Security (policies in E1-05) -----------------------------------

alter table public.category enable row level security;
alter table public.service enable row level security;
alter table public.plan enable row level security;
alter table public.requirement enable row level security;
