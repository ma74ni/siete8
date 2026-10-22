-- Providers, purchases, their payments and licenses (E11-03). Run with `pnpm db:test`.
begin;
create extension if not exists pgtap with schema extensions;

select * from no_plan();

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000e301', 'admin@test.siete8.com'),
  ('00000000-0000-0000-0000-00000000e302', 'user@test.siete8.com');
update public.profile set role = 'admin' where id = '00000000-0000-0000-0000-00000000e301';

insert into public.client (id, name) values ('00000000-0000-4000-8000-00000000e3c1', 'Cliente de prueba');
insert into public.client_service (id, client_id, service_id) values (
  '00000000-0000-4000-8000-00000000e3d1', '00000000-0000-4000-8000-00000000e3c1',
  (select id from public.service where slug = 'correo-corporativo')
);
insert into public.provider (id, name) values ('00000000-0000-4000-8000-00000000e3a1', 'Proveedor de prueba');
insert into public.purchase (id, provider_id, concept, quantity, unit_cost, renews_every_value, renews_every_unit) values
  ('00000000-0000-4000-8000-00000000e3b1', '00000000-0000-4000-8000-00000000e3a1', 'Licencias', 10, 6, 1, 'year');
insert into public.purchase_payment (purchase_id, paid_on, covers_from, covers_to, quantity, amount, vat_amount, isd_amount) values
  ('00000000-0000-4000-8000-00000000e3b1', '2025-10-01', '2025-10-01', '2026-10-01', 8, 48, 7.2, 2.4),
  ('00000000-0000-4000-8000-00000000e3b1', '2026-10-01', '2026-10-01', '2027-10-01', 10, 60, 9, 3);

-- Constraints ----------------------------------------------------------------

select throws_ok(
  $$insert into public.provider (name) values (' proveedor de PRUEBA ')$$,
  '23505', null, 'provider names are unique, ignoring case and spaces'
);
select throws_ok(
  $$insert into public.purchase_payment (purchase_id, covers_from, covers_to, amount)
    values ('00000000-0000-4000-8000-00000000e3b1', '2026-01-01', '2025-01-01', 1)$$,
  '23514', null, 'a payment covers a period that ends after it starts'
);
select throws_ok(
  $$insert into public.purchase_payment (purchase_id, covers_from, amount, isd_amount)
    values ('00000000-0000-4000-8000-00000000e3b1', '2026-01-01', 1, -1)$$,
  '23514', null, 'taxes are not negative'
);
select throws_ok(
  $$insert into public.license_assignment (purchase_id) values ('00000000-0000-4000-8000-00000000e3b1')$$,
  '23514', null, 'a license needs an email or a client'
);
select lives_ok(
  $$insert into public.license_assignment (purchase_id, email, client_service_id) values
    ('00000000-0000-4000-8000-00000000e3b1', 'ventas@cliente.test', '00000000-0000-4000-8000-00000000e3d1'),
    ('00000000-0000-4000-8000-00000000e3b1', 'hola@siete8.test', null)$$,
  'licenses by email and client, or email only'
);
select throws_ok(
  $$insert into public.license_assignment (purchase_id, email) values ('00000000-0000-4000-8000-00000000e3b1', 'VENTAS@cliente.test')$$,
  '23505', null, 'one license per email in a purchase'
);
select throws_ok(
  $$delete from public.provider where id = '00000000-0000-4000-8000-00000000e3a1'$$,
  '23503', null, 'a provider with purchases cannot be deleted'
);

select is(
  (select (expires_on, amount, isd_amount)::text from public.purchase_current
   where id = '00000000-0000-4000-8000-00000000e3b1'),
  '(2027-10-01,60.00,3.00)', 'the purchase expires at the end of its latest payment'
);

-- Deleting the client keeps its license, without client.
delete from public.client where id = '00000000-0000-4000-8000-00000000e3c1';
select is(
  (select count(*) from public.license_assignment
   where purchase_id = '00000000-0000-4000-8000-00000000e3b1' and client_service_id is null)::int,
  2, 'deleting a client keeps its licenses, unassigned'
);

-- Anonymous visitor and user without a role ---------------------------------

set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select throws_ok($$select * from public.purchase$$, '42501', null, 'anon: cannot read purchases');
select throws_ok($$select * from public.purchase_payment$$, '42501', null, 'anon: cannot read provider payments');
select throws_ok($$select * from public.purchase_current$$, '42501', null, 'anon: cannot read the purchases view');
select throws_ok($$select * from public.license_assignment$$, '42501', null, 'anon: cannot read licenses');
select throws_ok($$select public.create_purchase('{}')$$, '42501', null, 'anon: cannot create purchases');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000e302", "role": "authenticated"}', true);
select is((select count(*) from public.provider)::int, 0, 'user: reads no providers');
select is((select count(*) from public.purchase_current)::int, 0, 'user: reads no purchases');
select throws_ok($$select public.create_purchase('{}')$$, '42501', null, 'user: cannot create purchases');
reset role;

-- Admin ------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000e301", "role": "authenticated"}', true);

select isnt(
  public.create_purchase(format($$
    {"provider_name": "DreamHost de prueba", "concept": "Hosting compartido", "renews_every_value": 1,
     "renews_every_unit": "year", "auto_renew": true, "unit_cost": 120,
     "service_ids": ["%s", "%s"],
     "payment": {"paid_on": "2026-01-05", "covers_from": "2026-01-05", "covers_to": "2027-01-05",
                 "amount": 120, "vat_amount": 18, "isd_amount": 6}}$$,
    (select id from public.service where slug = 'hosting'),
    (select id from public.service where slug = 'correo-corporativo'))::jsonb),
  null, 'admin: creates a shared purchase with a new provider'
);
select is(
  (select (pc.expires_on, pc.auto_renew, count(ps.*))::text
   from public.purchase_current pc
   join public.purchase_service ps on ps.purchase_id = pc.id
   where pc.concept = 'Hosting compartido'
   group by pc.expires_on, pc.auto_renew),
  '(2027-01-05,t,2)', 'admin: with its services and first payment'
);
select isnt(
  public.create_purchase($${"provider_name": "dreamhost de prueba", "concept": "Otro", "unit_cost": 1}$$::jsonb),
  null, 'admin: a purchase without payment'
);
select is(
  (select count(*) from public.provider where lower(name) = 'dreamhost de prueba')::int,
  1, 'admin: an existing provider name is reused'
);
select throws_ok(
  $$select public.create_purchase('{"provider_name": "X", "concept": "Mal", "unit_cost": -1}')$$,
  '23514', null, 'admin: a bad purchase fails'
);
select is(
  (select count(*) from public.provider where name = 'X')::int, 0,
  'admin: nothing from a failed purchase is saved'
);
reset role;

select * from finish();
rollback;
