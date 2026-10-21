-- E11-03: what Siete8 buys from providers and has to renew (DreamHost,
-- Microsoft 365, Namecheap), the payments with the taxes paid here, and the
-- licenses of a shared purchase assigned to an email and/or a client's
-- service. Admin only (SRS 3.9).

-- provider ----------------------------------------------------------------------

create table public.provider (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  website text check (website is null or website ~ '^https?://\S+$'),
  notes text check (notes is null or length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index provider_name_key on public.provider (lower(trim(name)));

create trigger provider_set_updated_at before update on public.provider
  for each row execute function public.set_updated_at();

-- purchase --------------------------------------------------------------------

create table public.purchase (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider (id) on delete restrict,
  concept text not null check (length(trim(concept)) between 1 and 200),
  -- Of one client (a domain): its service. Null: shared, charged to the
  -- services in purchase_service, or general if there are none.
  client_service_id uuid references public.client_service (id) on delete set null,
  -- How often it renews; both null: one-off.
  renews_every_value integer check (renews_every_value > 0),
  renews_every_unit public.duration_unit,
  -- Charged automatically to the card: the reminder is to cancel in time.
  auto_renew boolean not null default false,
  quantity integer not null default 1 check (quantity between 1 and 10000),
  -- What the platform charges per unit, without the taxes paid here.
  unit_cost numeric(10, 2) not null check (unit_cost >= 0),
  status public.client_service_status not null default 'active',
  cancelled_at timestamptz,
  notes text check (notes is null or length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint purchase_renewal_complete
    check ((renews_every_value is null) = (renews_every_unit is null)),
  constraint purchase_cancelled_at
    check ((status = 'cancelled') = (cancelled_at is not null))
);

create index purchase_provider_idx on public.purchase (provider_id);
create index purchase_client_service_idx on public.purchase (client_service_id);

create trigger purchase_set_updated_at before update on public.purchase
  for each row execute function public.set_updated_at();

-- Services a shared purchase is charged to (DreamHost: hosting and email).
create table public.purchase_service (
  purchase_id uuid not null references public.purchase (id) on delete cascade,
  service_id uuid not null references public.service (id) on delete restrict,
  primary key (purchase_id, service_id)
);

create index purchase_service_service_idx on public.purchase_service (service_id);

-- purchase_payment ----------------------------------------------------------------

-- Each payment to the provider: what the platform charged plus the VAT and
-- ISD paid here, as they appear on the card statement. The purchase expires
-- at the end of the period its last payment covers.
create table public.purchase_payment (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchase (id) on delete cascade,
  paid_on date not null default current_date,
  covers_from date not null,
  -- Null: it does not expire.
  covers_to date,
  quantity integer not null default 1 check (quantity between 1 and 10000),
  amount numeric(10, 2) not null check (amount >= 0),
  vat_amount numeric(10, 2) not null default 0 check (vat_amount >= 0),
  isd_amount numeric(10, 2) not null default 0 check (isd_amount >= 0),
  notes text check (notes is null or length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint purchase_payment_dates check (covers_to is null or covers_to > covers_from)
);

create index purchase_payment_purchase_idx
  on public.purchase_payment (purchase_id, covers_from desc);
create index purchase_payment_paid_on_idx on public.purchase_payment (paid_on);

create trigger purchase_payment_set_updated_at before update on public.purchase_payment
  for each row execute function public.set_updated_at();

-- license_assignment ----------------------------------------------------------

-- One license of a shared purchase, used by an email, a client's service or
-- both. A client's license cost is the unit cost times its licenses.
create table public.license_assignment (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchase (id) on delete cascade,
  client_service_id uuid references public.client_service (id) on delete set null,
  email text check (email is null or email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  notes text check (notes is null or length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index license_assignment_purchase_idx on public.license_assignment (purchase_id);
create index license_assignment_client_service_idx on public.license_assignment (client_service_id);
create unique index license_assignment_email_key
  on public.license_assignment (purchase_id, lower(email)) where email is not null;

create trigger license_assignment_set_updated_at before update on public.license_assignment
  for each row execute function public.set_updated_at();

-- A license needs an email or a client. Checked on insert only: deleting the
-- client keeps the license (client_service_id set null) so it shows as unused.
create function public.check_license_assignment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.client_service_id is null and new.email is null then
    raise exception 'a license needs an email or a client'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger license_assignment_needs_owner before insert on public.license_assignment
  for each row execute function public.check_license_assignment();

-- Each purchase with its latest payment: what the panel lists.
create view public.purchase_current
with (security_invoker = true) as
select
  pu.id,
  pu.provider_id,
  pu.concept,
  pu.client_service_id,
  pu.renews_every_value,
  pu.renews_every_unit,
  pu.auto_renew,
  pu.quantity,
  pu.unit_cost,
  pu.status,
  pu.cancelled_at,
  pp.id as payment_id,
  pp.paid_on,
  pp.covers_from,
  pp.covers_to as expires_on,
  pp.amount,
  pp.vat_amount,
  pp.isd_amount
from public.purchase pu
left join lateral (
  select *
  from public.purchase_payment p
  where p.purchase_id = pu.id
  order by p.covers_from desc, p.created_at desc
  limit 1
) pp on true;

-- Row Level Security ----------------------------------------------------------

alter table public.provider enable row level security;
alter table public.purchase enable row level security;
alter table public.purchase_service enable row level security;
alter table public.purchase_payment enable row level security;
alter table public.license_assignment enable row level security;

revoke all on public.provider, public.purchase, public.purchase_service,
  public.purchase_payment, public.license_assignment, public.purchase_current from anon;
revoke truncate on public.provider, public.purchase, public.purchase_service,
  public.purchase_payment, public.license_assignment from authenticated;

create policy "Admins manage provider" on public.provider
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Admins manage purchase" on public.purchase
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Admins manage purchase_service" on public.purchase_service
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Admins manage purchase_payment" on public.purchase_payment
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Admins manage license_assignment" on public.license_assignment
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- create_purchase -------------------------------------------------------------

-- A new purchase in one transaction: its provider (an existing one by id, or
-- a new one by name, reused if the name already exists), the services it is
-- charged to and its first payment. Runs as the caller, so RLS applies; the
-- input is validated with Zod on the server first.
--
-- payload: { provider_id | provider_name, concept, client_service_id,
--   renews_every_value, renews_every_unit, auto_renew, quantity, unit_cost,
--   notes, service_ids: [uuid], payment: null | { paid_on, covers_from,
--   covers_to, quantity, amount, vat_amount, isd_amount } }
create function public.create_purchase(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_provider_id uuid;
  v_purchase_id uuid;
  p jsonb := payload -> 'payment';
begin
  if not public.is_admin() then
    raise exception 'only admins can create purchases' using errcode = '42501';
  end if;

  v_provider_id := nullif(payload ->> 'provider_id', '')::uuid;
  if v_provider_id is null then
    select id into v_provider_id from public.provider
    where lower(trim(name)) = lower(trim(payload ->> 'provider_name'));
    if v_provider_id is null then
      insert into public.provider (name) values (trim(payload ->> 'provider_name'))
      returning id into v_provider_id;
    end if;
  end if;

  insert into public.purchase (
    provider_id, concept, client_service_id, renews_every_value, renews_every_unit,
    auto_renew, quantity, unit_cost, notes
  )
  values (
    v_provider_id,
    payload ->> 'concept',
    nullif(payload ->> 'client_service_id', '')::uuid,
    (payload ->> 'renews_every_value')::integer,
    nullif(payload ->> 'renews_every_unit', '')::public.duration_unit,
    coalesce((payload ->> 'auto_renew')::boolean, false),
    coalesce((payload ->> 'quantity')::integer, 1),
    (payload ->> 'unit_cost')::numeric,
    nullif(payload ->> 'notes', '')
  )
  returning id into v_purchase_id;

  insert into public.purchase_service (purchase_id, service_id)
  select v_purchase_id, value::uuid
  from jsonb_array_elements_text(coalesce(payload -> 'service_ids', '[]'::jsonb));

  if p is not null and jsonb_typeof(p) = 'object' then
    insert into public.purchase_payment (
      purchase_id, paid_on, covers_from, covers_to, quantity, amount, vat_amount, isd_amount
    )
    values (
      v_purchase_id,
      coalesce((p ->> 'paid_on')::date, current_date),
      (p ->> 'covers_from')::date,
      nullif(p ->> 'covers_to', '')::date,
      coalesce((p ->> 'quantity')::integer, 1),
      (p ->> 'amount')::numeric,
      coalesce((p ->> 'vat_amount')::numeric, 0),
      coalesce((p ->> 'isd_amount')::numeric, 0)
    );
  end if;

  return v_purchase_id;
end;
$$;

revoke execute on function public.create_purchase(jsonb) from public, anon;
grant execute on function public.create_purchase(jsonb) to authenticated;
