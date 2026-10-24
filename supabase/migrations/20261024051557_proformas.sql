-- E11-05: why a lead was lost, proformas sent to a lead, and accepting one
-- (RF-CRM-18..20). Admin only, like the rest of the CRM (SRS 3.9).

-- lead.lost_reason ------------------------------------------------------------

alter table public.lead
  add column lost_reason text
    check (lost_reason is null or length(trim(lost_reason)) between 1 and 500);

-- A lost lead says why. Not validated against the leads lost before this
-- migration, which have no reason; the panel asks for one when they are saved.
alter table public.lead
  add constraint lead_lost_has_reason
    check (status <> 'lost' or lost_reason is not null) not valid;

-- proforma --------------------------------------------------------------------

create type public.proforma_status as enum ('sent', 'accepted', 'rejected');

create table public.proforma (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.lead (id) on delete cascade,
  service_id uuid not null references public.service (id) on delete restrict,
  plan_id uuid,
  -- What was offered, without VAT; the plan's price may change later. A
  -- proforma always quotes something: zero is a forgotten price.
  price_without_vat numeric(10, 2) not null check (price_without_vat > 0),
  vat_rate numeric(5, 4) not null check (vat_rate >= 0 and vat_rate < 1),
  sent_on date not null,
  status public.proforma_status not null default 'sent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- The plan, when there is one, belongs to the service.
  constraint proforma_plan_of_service foreign key (plan_id, service_id)
    references public.plan (id, service_id) on delete set null (plan_id)
);

create index proforma_lead_id_idx on public.proforma (lead_id, sent_on desc);

create trigger proforma_set_updated_at before update on public.proforma
  for each row execute function public.set_updated_at();

-- Sending a proforma moves a new or contacted lead to "Proforma enviada".
-- Later statuses (won, lost) are left as they are.
create function public.proforma_marks_lead()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status = 'sent' then
    update public.lead
    set status = 'proposal_sent'
    where id = new.lead_id and status in ('new', 'contacted');
  end if;
  return new;
end;
$$;

create trigger proforma_marks_lead after insert on public.proforma
  for each row execute function public.proforma_marks_lead();

-- Row Level Security ----------------------------------------------------------

alter table public.proforma enable row level security;

revoke all on public.proforma from anon;
revoke truncate on public.proforma from authenticated;

create policy "Admins manage proforma" on public.proforma
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- accept_proforma -------------------------------------------------------------

-- Accepts a sent proforma in one transaction (RF-CRM-19): creates the client
-- from `client` (or adds the service to the client already linked to the
-- lead) with its service and first period through import_clients, marks the
-- proforma accepted and the lead won. Returns the client's id. Runs as the
-- caller, so RLS applies; the input is validated with Zod on the server first.
--
-- client: one element of import_clients' payload, with one service.
create function public.accept_proforma(p_proforma_id uuid, client jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_lead_id uuid;
  v_status public.proforma_status;
  v_client_id uuid;
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'only admins can accept proformas' using errcode = '42501';
  end if;

  select lead_id, status into v_lead_id, v_status
  from public.proforma
  where id = p_proforma_id
  for update;
  if v_lead_id is null then
    raise exception 'proforma % not found', p_proforma_id using errcode = 'P0002';
  end if;
  if v_status <> 'sent' then
    raise exception 'proforma % was already %', p_proforma_id, v_status
      using errcode = '55000';
  end if;

  -- The lead's client, if it already has one: the service is added to it.
  select id into v_client_id from public.client where lead_id = v_lead_id;
  -- A new client cannot take a RUC that is already another client's:
  -- import_clients would add the service to that client instead.
  if v_client_id is null and exists (
    select 1 from public.client c
    where c.tax_id = nullif(accept_proforma.client ->> 'tax_id', '')
  ) then
    raise exception 'tax_id % is already registered', client ->> 'tax_id'
      using errcode = '23505';
  end if;
  v_result := public.import_clients(jsonb_build_array(
    case
      when v_client_id is not null
        then (client - 'lead_id') || jsonb_build_object('id', v_client_id)
      else (client - 'id') || jsonb_build_object('lead_id', v_lead_id)
    end
  ));
  v_client_id := coalesce(v_client_id, (v_result ->> 'first_client_id')::uuid);

  update public.proforma set status = 'accepted' where id = p_proforma_id;
  update public.lead set status = 'won', lost_reason = null where id = v_lead_id;
  return v_client_id;
end;
$$;

revoke execute on function public.accept_proforma(uuid, jsonb) from public, anon;
grant execute on function public.accept_proforma(uuid, jsonb) to authenticated;
