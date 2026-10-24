-- Lead statuses, lost reason, proformas and accept_proforma (E11-05).
-- Run with `pnpm db:test`.
begin;
create extension if not exists pgtap with schema extensions;

select * from no_plan();

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000f501', 'admin@test.siete8.com'),
  ('00000000-0000-0000-0000-00000000f502', 'user@test.siete8.com');
update public.profile set role = 'admin' where id = '00000000-0000-0000-0000-00000000f501';

-- Fixtures: a test service with one plan, and leads (inserted with the secret
-- key by the form, so they bypass RLS).
insert into public.service (id, category_id, name, slug) values (
  '00000000-0000-0000-0000-00000000f5a1',
  (select id from public.category order by sort_order limit 1),
  'Servicio de prueba', 'test-proforma-service'
);
insert into public.plan (id, service_id, name, price_without_vat, vat_rate, duration_value, duration_unit) values
  ('00000000-0000-0000-0000-00000000f5b1', '00000000-0000-0000-0000-00000000f5a1', 'Anual', 50, 0.15, 1, 'year');

insert into public.lead (id, name, phone, email, source, status, consent_at) values
  ('00000000-0000-0000-0000-00000000f5c1', 'Ana Prueba', '0991234567', 'ana@prueba.test', 'form', 'new', now()),
  ('00000000-0000-0000-0000-00000000f5c2', 'Luis Prueba', '0997654321', null, 'whatsapp', 'won', now()),
  ('00000000-0000-0000-0000-00000000f5c3', 'Eva Prueba', '0990000000', null, 'form', 'contacted', now());

-- Statuses and lost reason ----------------------------------------------------

select is(
  enum_range(null::public.lead_status)::text[],
  array['new', 'contacted', 'proposal_sent', 'won', 'lost'],
  'lead statuses, in the order a lead moves through'
);
select throws_ok(
  $$update public.lead set status = 'lost' where id = '00000000-0000-0000-0000-00000000f5c3'$$,
  '23514', null, 'a lost lead needs a reason'
);
select lives_ok(
  $$update public.lead set status = 'lost', lost_reason = 'Eligió otro proveedor.'
    where id = '00000000-0000-0000-0000-00000000f5c3'$$,
  'a lost lead with a reason is saved'
);
select throws_ok(
  $$update public.lead set lost_reason = '   ' where id = '00000000-0000-0000-0000-00000000f5c3'$$,
  '23514', null, 'the reason is not blank'
);

-- Proforma constraints ---------------------------------------------------------

select throws_ok(
  $$insert into public.proforma (lead_id, service_id, plan_id, price_without_vat, vat_rate, sent_on) values (
    '00000000-0000-0000-0000-00000000f5c1', (select id from public.service where slug = 'hosting'),
    '00000000-0000-0000-0000-00000000f5b1', 50, 0.15, '2026-10-24')$$,
  '23503', null, 'the plan must belong to the service'
);
select throws_ok(
  $$insert into public.proforma (lead_id, service_id, price_without_vat, vat_rate, sent_on) values (
    '00000000-0000-0000-0000-00000000f5c1', '00000000-0000-0000-0000-00000000f5a1', 0, 0.15, '2026-10-24')$$,
  '23514', null, 'the price is above zero'
);
select throws_ok(
  $$insert into public.proforma (lead_id, service_id, price_without_vat, vat_rate, sent_on) values (
    '00000000-0000-0000-0000-00000000f5c1', '00000000-0000-0000-0000-00000000f5a1', 50, 1.5, '2026-10-24')$$,
  '23514', null, 'the VAT rate is a fraction below 1'
);

-- Anonymous and signed-in user without a role ---------------------------------

set local role anon;
select throws_ok($$select count(*) from public.proforma$$, '42501', null, 'anon: cannot read proformas');
select throws_ok(
  $$select public.accept_proforma('00000000-0000-0000-0000-00000000f5d1', '{}')$$,
  '42501', null, 'anon: cannot accept proformas'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000f502", "role": "authenticated"}', true);
select is((select count(*) from public.proforma)::int, 0, 'user: sees no proformas');
select throws_ok(
  $$insert into public.proforma (lead_id, service_id, price_without_vat, vat_rate, sent_on) values (
    '00000000-0000-0000-0000-00000000f5c1', '00000000-0000-0000-0000-00000000f5a1', 50, 0.15, '2026-10-24')$$,
  '42501', null, 'user: cannot create proformas'
);
select throws_ok(
  $$select public.accept_proforma('00000000-0000-0000-0000-00000000f5d1', '{}')$$,
  '42501', null, 'user: cannot accept proformas'
);
reset role;

-- Admin -------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000f501", "role": "authenticated"}', true);

insert into public.proforma (id, lead_id, service_id, plan_id, price_without_vat, vat_rate, sent_on) values
  ('00000000-0000-0000-0000-00000000f5d1', '00000000-0000-0000-0000-00000000f5c1',
   '00000000-0000-0000-0000-00000000f5a1', '00000000-0000-0000-0000-00000000f5b1', 45, 0.15, '2026-10-24');
select is(
  (select status::text from public.lead where id = '00000000-0000-0000-0000-00000000f5c1'),
  'proposal_sent', 'admin: sending a proforma moves a new lead to proposal_sent'
);

insert into public.proforma (lead_id, service_id, price_without_vat, vat_rate, sent_on) values
  ('00000000-0000-0000-0000-00000000f5c2', '00000000-0000-0000-0000-00000000f5a1', 45, 0.15, '2026-10-24');
select is(
  (select status::text from public.lead where id = '00000000-0000-0000-0000-00000000f5c2'),
  'won', 'admin: a won lead keeps its status when a proforma is sent'
);

-- Accept first and keep what it returns: in one statement, the client lookup
-- could run before the client exists.
select set_config('test.accepted_client', public.accept_proforma(
    '00000000-0000-0000-0000-00000000f5d1',
    $${"kind": "person", "name": "Ana Prueba", "phone": "0991234567", "email": "ana@prueba.test",
       "services": [{"service_id": "00000000-0000-0000-0000-00000000f5a1",
         "plan_id": "00000000-0000-0000-0000-00000000f5b1", "detail": "anaprueba.test",
         "renews_every_value": 1, "renews_every_unit": "year",
         "period": {"sold_on": "2026-10-24", "starts_on": "2026-10-24", "ends_on": "2027-10-24",
           "price_without_vat": 45, "vat_rate": 0.15, "cost_without_vat": 30}}]}$$::jsonb
  )::text, true);
select is(
  current_setting('test.accepted_client')::uuid,
  (select id from public.client where lead_id = '00000000-0000-0000-0000-00000000f5c1'),
  'admin: accepting returns the new client, linked to the lead'
);
select is(
  (select price_without_vat from public.client_service_period csp
   join public.client_service cs on cs.id = csp.client_service_id
   join public.client c on c.id = cs.client_id
   where c.lead_id = '00000000-0000-0000-0000-00000000f5c1'),
  45.00::numeric, 'admin: the first period has the offered price'
);
select is(
  (select status::text from public.proforma where id = '00000000-0000-0000-0000-00000000f5d1'),
  'accepted', 'admin: the proforma is accepted'
);
select is(
  (select array_agg(status::text order by created_at, status)
   from public.lead_status_event where lead_id = '00000000-0000-0000-0000-00000000f5c1'),
  array['new', 'proposal_sent', 'won'], 'admin: the lead is won and its history is kept'
);
select throws_ok(
  $$select public.accept_proforma('00000000-0000-0000-0000-00000000f5d1', '{"name": "Otra"}')$$,
  '55000', null, 'admin: a proforma is accepted only once'
);

-- A second proforma for the same lead adds the service to its client.
insert into public.proforma (id, lead_id, service_id, price_without_vat, vat_rate, sent_on) values
  ('00000000-0000-0000-0000-00000000f5d2', '00000000-0000-0000-0000-00000000f5c1',
   '00000000-0000-0000-0000-00000000f5a1', 20, 0.15, '2026-10-24');
select lives_ok(
  $$select public.accept_proforma(
    '00000000-0000-0000-0000-00000000f5d2',
    '{"kind": "person", "name": "Ignorado", "services": [{"service_id": "00000000-0000-0000-0000-00000000f5a1",
      "period": {"starts_on": "2026-10-24", "price_without_vat": 20, "vat_rate": 0.15}}]}')$$,
  'admin: accepts a second proforma of the same lead'
);
select is(
  (select count(*) from public.client where lead_id = '00000000-0000-0000-0000-00000000f5c1')::int,
  1, 'admin: the lead still has one client'
);
select is(
  (select count(*) from public.client_service cs join public.client c on c.id = cs.client_id
   where c.lead_id = '00000000-0000-0000-0000-00000000f5c1')::int,
  2, 'admin: the second service is added to that client'
);

-- A lead without a client cannot take another client's RUC.
insert into public.client (id, kind, name, tax_id) values
  ('00000000-0000-0000-0000-00000000f5e1', 'company', 'Otra empresa', '1790000000001');
insert into public.proforma (id, lead_id, service_id, price_without_vat, vat_rate, sent_on) values
  ('00000000-0000-0000-0000-00000000f5d3', '00000000-0000-0000-0000-00000000f5c2',
   '00000000-0000-0000-0000-00000000f5a1', 20, 0.15, '2026-10-24');
select throws_ok(
  $$select public.accept_proforma(
    '00000000-0000-0000-0000-00000000f5d3',
    '{"kind": "company", "name": "Luis Prueba", "tax_id": "1790000000001",
      "services": [{"service_id": "00000000-0000-0000-0000-00000000f5a1",
      "period": {"starts_on": "2026-10-24", "price_without_vat": 20, "vat_rate": 0.15}}]}')$$,
  '23505', null, 'admin: a new client cannot take another client''s RUC'
);
select is(
  (select count(*) from public.client_service
   where client_id = '00000000-0000-0000-0000-00000000f5e1')::int,
  0, 'admin: nothing is added to the client that owns that RUC'
);

update public.proforma set status = 'rejected'
where lead_id = '00000000-0000-0000-0000-00000000f5c2';
select is(
  (select status::text from public.lead where id = '00000000-0000-0000-0000-00000000f5c2'),
  'won', 'admin: rejecting a proforma does not change the lead'
);
reset role;

select * from finish();
rollback;
