-- E11-02: what clients pay for each period, and periods they will not pay.
-- The total with VAT, the balance and the payment status are computed by
-- the app with the shared VAT function (src/lib/price.ts), not stored.

create type public.payment_method as enum ('transfer', 'cash', 'card', 'other');

-- client_payment ----------------------------------------------------------------

create table public.client_payment (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.client_service_period (id) on delete cascade,
  paid_on date not null default current_date,
  -- What the client paid, VAT included.
  amount numeric(10, 2) not null check (amount > 0),
  method public.payment_method not null default 'transfer',
  notes text check (notes is null or length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index client_payment_period_idx on public.client_payment (period_id);
create index client_payment_paid_on_idx on public.client_payment (paid_on);

create trigger client_payment_set_updated_at before update on public.client_payment
  for each row execute function public.set_updated_at();

alter table public.client_payment enable row level security;

revoke all on public.client_payment from anon;
revoke truncate on public.client_payment from authenticated;

create policy "Admins manage client_payment" on public.client_payment
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- "No pagará" ---------------------------------------------------------------------

-- A period the client will not pay: it leaves the receivables and counts as
-- a loss. Marked with the day and why.
alter table public.client_service_period
  add column written_off_on date,
  add column write_off_reason text
    check (write_off_reason is null or length(trim(write_off_reason)) between 1 and 300),
  add constraint client_service_period_write_off_complete
    check ((written_off_on is null) = (write_off_reason is null));

-- import_clients ----------------------------------------------------------------

-- Same as in 20261013031552_clients, plus an optional payment per period:
-- period.paid_amount, the total with VAT, records it as paid on sold_on.
create or replace function public.import_clients(payload jsonb)
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
  v_period_id uuid;
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
      )
      returning id into v_period_id;

      -- Already paid (the import's "pagado" column): one payment for the
      -- total, computed by the app with the shared VAT function.
      if nullif(p ->> 'paid_amount', '') is not null then
        insert into public.client_payment (period_id, paid_on, amount, method)
        values (
          v_period_id,
          coalesce((p ->> 'sold_on')::date, current_date),
          (p ->> 'paid_amount')::numeric,
          'other'
        );
      end if;
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
