-- E1-03: content (blog and portfolio).
-- A post is scheduled when it is published with a future published_at; the
-- public read policy (E1-05) only returns posts whose date has passed.
-- A project's status describes its real situation (SRS 3.7) and is
-- independent of `published` and `show_client_name`. Row Level Security is
-- enabled with no policies until E1-05.

-- Enums --------------------------------------------------------------------

create type public.post_status as enum ('draft', 'published');

create type public.project_status as enum ('in_development', 'active', 'internal', 'replaced', 'archived');

create type public.image_device as enum ('desktop', 'mobile');

-- post ---------------------------------------------------------------------

create table public.post (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profile (id) on delete set null,
  title text not null check (length(trim(title)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  excerpt text,
  body_md text,
  cover_url text,
  status public.post_status not null default 'draft',
  published_at timestamptz,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint post_published_needs_date
    check (status <> 'published' or published_at is not null)
);

create index post_status_published_at_idx on public.post (status, published_at desc);
create index post_author_id_idx on public.post (author_id);

create trigger post_set_updated_at before update on public.post
  for each row execute function public.set_updated_at();

-- post_service -------------------------------------------------------------

create table public.post_service (
  post_id uuid not null references public.post (id) on delete cascade,
  service_id uuid not null references public.service (id) on delete cascade,
  primary key (post_id, service_id)
);

create index post_service_service_id_idx on public.post_service (service_id);

-- project ------------------------------------------------------------------

create table public.project (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  client_name text,
  show_client_name boolean not null default false,
  sector text,
  year integer check (year between 2000 and 2100),
  summary text,
  challenge_md text,
  solution_md text,
  results_md text,
  tech_stack text[] not null default '{}',
  cover_url text,
  live_url text check (live_url ~ '^https://'),
  status public.project_status not null,
  link_checked_at timestamptz,
  link_ok boolean,
  featured boolean not null default false,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- The card shows either the client's name or its sector.
  constraint project_shows_client_or_sector
    check ((show_client_name and client_name is not null) or (not show_client_name and sector is not null))
);

create index project_sort_order_idx on public.project (sort_order);

create trigger project_set_updated_at before update on public.project
  for each row execute function public.set_updated_at();

-- project_image ------------------------------------------------------------

create table public.project_image (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project (id) on delete cascade,
  url text not null,
  alt text not null check (length(trim(alt)) > 0),
  device public.image_device not null default 'desktop',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index project_image_project_sort_idx on public.project_image (project_id, sort_order);

create trigger project_image_set_updated_at before update on public.project_image
  for each row execute function public.set_updated_at();

-- project_service ----------------------------------------------------------

create table public.project_service (
  project_id uuid not null references public.project (id) on delete cascade,
  service_id uuid not null references public.service (id) on delete cascade,
  primary key (project_id, service_id)
);

create index project_service_service_id_idx on public.project_service (service_id);

-- Row Level Security (policies in E1-05) -----------------------------------

alter table public.post enable row level security;
alter table public.post_service enable row level security;
alter table public.project enable row level security;
alter table public.project_image enable row level security;
alter table public.project_service enable row level security;
