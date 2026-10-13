-- Clients, their services and periods (E11-01). Run with `pnpm db:test`.
begin;
create extension if not exists pgtap with schema extensions;

select * from no_plan();

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000e101', 'admin@test.siete8.com'),
  ('00000000-0000-0000-0000-00000000e102', 'user@test.siete8.com');
update public.profile set role = 'admin' where id = '00000000-0000-0000-0000-00000000e101';

-- Fixtures: a test service with one plan, and a plan of another service.
insert into public.service (id, category_id, name, slug) values (
  '00000000-0000-0000-0000-00000000e1a1',
  (select id from public.category order by sort_order limit 1),
  'Servicio de prueba', 'test-client-service'
);
insert into public.plan (id, service_id, name, price_without_vat, vat_rate, duration_value, duration_unit) values
  ('00000000-0000-0000-0000-00000000e1b1', '00000000-0000-0000-0000-00000000e1a1', 'Anual', 50, 0.15, 1, 'year');
insert into public.plan_cost (plan_id, cost_without_vat) values ('00000000-0000-0000-0000-00000000e1b1', 30);

insert into public.client (id, kind, name, tax_id, email) values
  ('00000000-0000-0000-0000-00000000e1c1', 'company', 'Heladería de prueba', '1790000000001', 'hola@heladeria.test');
insert into public.client_service (id, client_id, service_id, plan_id, detail, renews_every_value, renews_every_unit) values
  ('00000000-0000-0000-0000-00000000e1d1', '00000000-0000-0000-0000-00000000e1c1', '00000000-0000-0000-0000-00000000e1a1',
   '00000000-0000-0000-0000-00000000e1b1', 'heladeria.test', 1, 'year');
insert into public.client_service_period (client_service_id, sold_on, starts_on, ends_on, price_without_vat, vat_rate, cost_without_vat) values
  ('00000000-0000-0000-0000-00000000e1d1', '2025-10-01', '2025-10-01', '2026-10-01', 45, 0.15, 30),
  ('00000000-0000-0000-0000-00000000e1d1', '2026-10-01', '2026-10-01', '2027-10-01', 50, 0.15, 30);

-- Constraints ----------------------------------------------------------------

select throws_ok(
  $$insert into public.client (name, tax_id) values ('x', '12345')$$,
  '23514', null, 'tax_id is a 10-digit cédula or a 13-digit RUC'
);
select throws_ok(
  $$insert into public.client (kind, name, tax_id) values ('company', 'x', '1700000001')$$,
  '23514', null, 'a company has a RUC, not a cédula'
);
select throws_ok(
  $$insert into public.client (name, tax_id) values ('Otra', '1790000000001')$$,
  '23505', null, 'tax_id is unique'
);
select throws_ok(
  $$insert into public.client_service (client_id, service_id, plan_id) values (
    '00000000-0000-0000-0000-00000000e1c1',
    (select id from public.service where slug = 'hosting'),
    '00000000-0000-0000-0000-00000000e1b1')$$,
  '23503', null, 'the plan must belong to the service'
);
select throws_ok(
  $$insert into public.client_service (client_id, service_id, renews_every_value) values (
    '00000000-0000-0000-0000-00000000e1c1', '00000000-0000-0000-0000-00000000e1a1', 1)$$,
  '23514', null, 'renewal needs value and unit'
);
select throws_ok(
  $$update public.client_service set status = 'cancelled' where id = '00000000-0000-0000-0000-00000000e1d1'$$,
  '23514', null, 'a cancelled service records when'
);
select throws_ok(
  $$insert into public.client_service_period (client_service_id, starts_on, ends_on, price_without_vat, vat_rate)
    values ('00000000-0000-0000-0000-00000000e1d1', '2026-01-01', '2026-01-01', 1, 0.15)$$,
  '23514', null, 'a period ends after it starts'
);
select throws_ok(
  $$insert into public.client_service_period (client_service_id, starts_on, price_without_vat, vat_rate, cost_without_vat)
    values ('00000000-0000-0000-0000-00000000e1d1', '2026-01-01', 1, 0.15, -1)$$,
  '23514', null, 'costs are not negative'
);
select throws_ok(
  $$delete from public.service where id = '00000000-0000-0000-0000-00000000e1a1'$$,
  '23503', null, 'a service with clients cannot be deleted'
);

-- Current period ---------------------------------------------------------------

select is(
  (select (expires_on, price_without_vat)::text from public.client_service_current
   where id = '00000000-0000-0000-0000-00000000e1d1'),
  '(2027-10-01,50.00)', 'the current period is the latest one'
);

-- Deleting the plan keeps the client's service.
delete from public.plan where id = '00000000-0000-0000-0000-00000000e1b1';
select is(
  (select plan_id from public.client_service where id = '00000000-0000-0000-0000-00000000e1d1'),
  null::uuid, 'deleting a plan keeps the client service without plan'
);

-- Anonymous visitor ----------------------------------------------------------

set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select throws_ok($$select * from public.client$$, '42501', null, 'anon: cannot read clients');
select throws_ok($$select * from public.client_service$$, '42501', null, 'anon: cannot read client services');
select throws_ok($$select * from public.client_service_period$$, '42501', null, 'anon: cannot read periods');
select throws_ok($$select * from public.client_service_current$$, '42501', null, 'anon: cannot read the current view');
select throws_ok($$select * from public.plan_cost$$, '42501', null, 'anon: cannot read costs');
select throws_ok($$select public.import_clients('[]')$$, '42501', null, 'anon: cannot import');
reset role;

-- Signed-in user without a role ---------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000e102", "role": "authenticated"}', true);
select is((select count(*) from public.client)::int, 0, 'user: reads no clients');
select is((select count(*) from public.client_service_current)::int, 0, 'user: reads no client services');
select is((select count(*) from public.plan_cost)::int, 0, 'user: reads no costs');
select throws_ok(
  $$insert into public.client (name) values ('x')$$,
  '42501', null, 'user: cannot create clients'
);
select throws_ok($$select public.import_clients('[]')$$, '42501', null, 'user: cannot import');
reset role;

-- Admin ------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000e101", "role": "authenticated"}', true);
select is((select count(*) from public.client)::int, 1, 'admin: reads clients');
select is((select count(*) from public.client_service_period)::int, 2, 'admin: reads periods');

select is(
  public.import_clients($$[
    {"kind": "person", "name": "Cliente nuevo", "tax_id": "1700000001", "services": [
      {"service_id": "00000000-0000-0000-0000-00000000e1a1", "detail": "POS", "period":
        {"starts_on": "2026-10-01", "price_without_vat": 800, "vat_rate": 0.15}},
      {"service_id": "00000000-0000-0000-0000-00000000e1a1", "detail": "Mantenimiento del POS",
       "renews_every_value": 1, "renews_every_unit": "month", "period":
        {"starts_on": "2026-10-01", "ends_on": "2026-11-01", "price_without_vat": 20, "vat_rate": 0.15}}]},
    {"kind": "company", "name": "Ya existe", "tax_id": "1790000000001", "services": [
      {"service_id": "00000000-0000-0000-0000-00000000e1a1", "period":
        {"starts_on": "2026-10-01", "price_without_vat": 10, "vat_rate": 0.15, "cost_without_vat": 4}}]}
  ]$$::jsonb) - 'first_client_id',
  '{"clients_created": 1, "clients_existing": 1, "services_created": 3}'::jsonb,
  'admin: import creates new clients and adds services to existing ones'
);
select is(
  (select name from public.client where tax_id = '1790000000001'),
  'Heladería de prueba', 'admin: import keeps the data of an existing client'
);

select is(
  public.import_clients($$[{"id": "00000000-0000-0000-0000-00000000e1c1", "services": [
    {"service_id": "00000000-0000-0000-0000-00000000e1a1", "period":
      {"starts_on": "2026-10-01", "price_without_vat": 5, "vat_rate": 0.15}}]}]$$::jsonb) ->> 'services_created',
  '1', 'admin: adds a service to a client given by id'
);
select throws_ok(
  $$select public.import_clients('[{"id": "00000000-0000-0000-0000-00000000e1ff", "services": []}]')$$,
  'P0002', null, 'admin: an unknown client id fails'
);

-- One bad row rolls back the whole import.
select throws_ok(
  $$select public.import_clients($j$[
    {"name": "Bien", "services": []},
    {"name": "Mal", "tax_id": "123", "services": []}
  ]$j$::jsonb)$$,
  '23514', null, 'admin: a bad row fails the import'
);
select is((select count(*) from public.client where name = 'Bien')::int, 0, 'admin: nothing from a failed import is saved');

select lives_ok(
  $$delete from public.client where id = '00000000-0000-0000-0000-00000000e1c1'$$,
  'admin: can delete a client'
);
reset role;
select is(
  (select count(*) from public.client_service_period csp
   join public.client_service cs on cs.id = csp.client_service_id
   where cs.client_id = '00000000-0000-0000-0000-00000000e1c1')::int,
  0, 'deleting a client deletes its services and periods'
);

select * from finish();
rollback;
