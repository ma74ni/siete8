-- E11-01: clients, the services they have, and each sale or renewal of a
-- service (period) with its price and direct cost. Admin only: nothing here
-- is read by the site, the assistant or anonymous visitors (SRS 3.9).

-- plan_cost -------------------------------------------------------------------

-- What a plan costs Siete8 (the signature to the distributor, for example).
-- Kept apart from `plan`, which is publicly readable.
create table public.plan_cost (
  plan_id uuid primary key references public.plan (id) on delete cascade,
  cost_without_vat numeric(10, 2) not null check (cost_without_vat >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger plan_cost_set_updated_at before update on public.plan_cost
  for each row execute function public.set_updated_at();

-- client ----------------------------------------------------------------------

create type public.client_kind as enum ('person', 'company');

create table public.client (
  id uuid primary key default gen_random_uuid(),
  kind public.client_kind not null default 'person',
  name text not null check (length(trim(name)) between 1 and 200),
  -- Only the number (cédula: 10 digits, RUC: 13), never the document.
  tax_id text unique check (tax_id ~ '^[0-9]{10}([0-9]{3})?$'),
  phone text check (phone ~ '^\+?[0-9 ]{7,20}$'),
  email text check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  notes text check (notes is null or length(notes) <= 4000),
  lead_id uuid unique references public.lead (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_company_has_ruc check (kind <> 'company' or tax_id is null or length(tax_id) = 13)
);

create index client_name_idx on public.client (lower(name));

create trigger client_set_updated_at before update on public.client
  for each row execute function public.set_updated_at();

-- client_service --------------------------------------------------------------

create type public.client_service_status as enum ('active', 'cancelled');

-- Lets client_service check that its plan belongs to its service.
alter table public.plan add constraint plan_id_service_id_key unique (id, service_id);

create table public.client_service (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client (id) on delete cascade,
  service_id uuid not null references public.service (id) on delete restrict,
  plan_id uuid,
  detail text check (detail is null or length(trim(detail)) between 1 and 200),
  -- How often it renews, like a plan's duration; both null: one-off payment.
  renews_every_value integer check (renews_every_value > 0),
  renews_every_unit public.duration_unit,
  status public.client_service_status not null default 'active',
  cancelled_at timestamptz,
  notes text check (notes is null or length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_service_plan_of_service foreign key (plan_id, service_id)
    references public.plan (id, service_id) on delete set null (plan_id),
  constraint client_service_renewal_complete
    check ((renews_every_value is null) = (renews_every_unit is null)),
  constraint client_service_cancelled_at
    check ((status = 'cancelled') = (cancelled_at is not null))
);

create index client_service_client_idx on public.client_service (client_id);
create index client_service_service_idx on public.client_service (service_id);
create index client_service_plan_idx on public.client_service (plan_id);

create trigger client_service_set_updated_at before update on public.client_service
  for each row execute function public.set_updated_at();

-- client_service_period -------------------------------------------------------

-- Each sale or renewal. Changing a price or a cost later never alters the
-- periods already sold. The service expires at the end of its last period.
create table public.client_service_period (
  id uuid primary key default gen_random_uuid(),
  client_service_id uuid not null references public.client_service (id) on delete cascade,
  sold_on date not null default current_date,
  starts_on date not null,
  -- Null: it does not expire (a delivered development, for example).
  ends_on date,
  price_without_vat numeric(10, 2) not null check (price_without_vat >= 0),
  vat_rate numeric(5, 4) not null check (vat_rate >= 0 and vat_rate <= 1),
  cost_without_vat numeric(10, 2) not null default 0 check (cost_without_vat >= 0),
  notes text check (notes is null or length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_service_period_dates check (ends_on is null or ends_on > starts_on)
);

create index client_service_period_service_idx
  on public.client_service_period (client_service_id, starts_on desc);
create index client_service_period_ends_on_idx on public.client_service_period (ends_on);

create trigger client_service_period_set_updated_at before update on public.client_service_period
  for each row execute function public.set_updated_at();

-- Each client service with its current (latest) period: what the panel lists.
create view public.client_service_current
with (security_invoker = true) as
select
  cs.id,
  cs.client_id,
  cs.service_id,
  cs.plan_id,
  cs.detail,
  cs.renews_every_value,
  cs.renews_every_unit,
  cs.status,
  cs.cancelled_at,
  p.id as period_id,
  p.sold_on,
  p.starts_on,
  p.ends_on as expires_on,
  p.price_without_vat,
  p.vat_rate,
  p.cost_without_vat
from public.client_service cs
left join lateral (
  select *
  from public.client_service_period csp
  where csp.client_service_id = cs.id
  order by csp.starts_on desc, csp.created_at desc
  limit 1
) p on true;

-- Row Level Security ----------------------------------------------------------

alter table public.plan_cost enable row level security;
alter table public.client enable row level security;
alter table public.client_service enable row level security;
alter table public.client_service_period enable row level security;

revoke all on public.plan_cost, public.client, public.client_service,
  public.client_service_period, public.client_service_current from anon;
revoke truncate on public.plan_cost, public.client, public.client_service,
  public.client_service_period from authenticated;

create policy "Admins manage plan_cost" on public.plan_cost
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Admins manage client" on public.client
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Admins manage client_service" on public.client_service
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Admins manage client_service_period" on public.client_service_period
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- import_clients --------------------------------------------------------------

-- Creates clients, their services and each service's first period in one
-- transaction: the "new client" form sends one client, the CSV import many.
-- A client whose tax_id already exists gets the services added and keeps its
-- data, and so does one given by id (a service added from its page). Runs
-- as the caller, so RLS applies; the input is validated with Zod
-- on the server first and again here by the table checks.
--
-- payload: [{ id, kind, name, tax_id, phone, email, notes, lead_id,
--   services: [{ service_id, plan_id, detail, renews_every_value,
--     renews_every_unit, notes, period: { sold_on, starts_on, ends_on,
--     price_without_vat, vat_rate, cost_without_vat } }] }]
create function public.import_clients(payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  c jsonb;
  s jsonb;
  p jsonb;
  v_client_id uuid;
  v_service_id uuid;
  v_first_id uuid;
  v_created int := 0;
  v_existing int := 0;
  v_services int := 0;
begin
  if not public.is_admin() then
    raise exception 'only admins can import clients' using errcode = '42501';
  end if;
  if jsonb_typeof(payload) <> 'array' then
    raise exception 'payload must be an array' using errcode = '22023';
  end if;

  for c in select * from jsonb_array_elements(payload) loop
    -- An existing client: by id (adding a service from its page) or by tax_id.
    v_client_id := null;
    if nullif(c ->> 'id', '') is not null then
      select id into v_client_id from public.client where id = (c ->> 'id')::uuid;
      if v_client_id is null then
        raise exception 'client % not found', c ->> 'id' using errcode = 'P0002';
      end if;
    elsif nullif(c ->> 'tax_id', '') is not null then
      select id into v_client_id from public.client where tax_id = c ->> 'tax_id';
    end if;

    if v_client_id is null then
      insert into public.client (kind, name, tax_id, phone, email, notes, lead_id)
      values (
        coalesce(c ->> 'kind', 'person')::public.client_kind,
        c ->> 'name',
        nullif(c ->> 'tax_id', ''),
        nullif(c ->> 'phone', ''),
        nullif(c ->> 'email', ''),
        nullif(c ->> 'notes', ''),
        nullif(c ->> 'lead_id', '')::uuid
      )
      returning id into v_client_id;
      v_created := v_created + 1;
    else
      v_existing := v_existing + 1;
    end if;
    v_first_id := coalesce(v_first_id, v_client_id);

    for s in select * from jsonb_array_elements(coalesce(c -> 'services', '[]'::jsonb)) loop
      insert into public.client_service (
        client_id, service_id, plan_id, detail, renews_every_value, renews_every_unit, notes
      )
      values (
        v_client_id,
        (s ->> 'service_id')::uuid,
        nullif(s ->> 'plan_id', '')::uuid,
        nullif(s ->> 'detail', ''),
        (s ->> 'renews_every_value')::integer,
        nullif(s ->> 'renews_every_unit', '')::public.duration_unit,
        nullif(s ->> 'notes', '')
      )
      returning id into v_service_id;

      p := s -> 'period';
      insert into public.client_service_period (
        client_service_id, sold_on, starts_on, ends_on, price_without_vat, vat_rate, cost_without_vat
      )
      values (
        v_service_id,
        coalesce((p ->> 'sold_on')::date, current_date),
        (p ->> 'starts_on')::date,
        nullif(p ->> 'ends_on', '')::date,
        (p ->> 'price_without_vat')::numeric,
        (p ->> 'vat_rate')::numeric,
        coalesce((p ->> 'cost_without_vat')::numeric, 0)
      );
      v_services := v_services + 1;
    end loop;
  end loop;

  return jsonb_build_object(
    'clients_created', v_created,
    'clients_existing', v_existing,
    'services_created', v_services,
    'first_client_id', v_first_id
  );
end;
$$;

revoke execute on function public.import_clients(jsonb) from public, anon;
grant execute on function public.import_clients(jsonb) to authenticated;
