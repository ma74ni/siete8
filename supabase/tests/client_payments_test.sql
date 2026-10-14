-- Client payments and "no pagará" (E11-02). Run with `pnpm db:test`.
begin;
create extension if not exists pgtap with schema extensions;

select * from no_plan();

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000e201', 'admin@test.siete8.com'),
  ('00000000-0000-0000-0000-00000000e202', 'user@test.siete8.com');
update public.profile set role = 'admin' where id = '00000000-0000-0000-0000-00000000e201';

insert into public.client (id, name) values ('00000000-0000-0000-0000-00000000e2c1', 'Cliente de prueba');
insert into public.client_service (id, client_id, service_id) values (
  '00000000-0000-0000-0000-00000000e2d1', '00000000-0000-0000-0000-00000000e2c1',
  (select id from public.service where slug = 'hosting')
);
insert into public.client_service_period (id, client_service_id, starts_on, price_without_vat, vat_rate) values
  ('00000000-0000-0000-0000-00000000e2e1', '00000000-0000-0000-0000-00000000e2d1', '2026-10-01', 100, 0.15);
insert into public.client_payment (period_id, paid_on, amount) values
  ('00000000-0000-0000-0000-00000000e2e1', '2026-10-02', 50);

-- Constraints ----------------------------------------------------------------

select throws_ok(
  $$insert into public.client_payment (period_id, amount) values ('00000000-0000-0000-0000-00000000e2e1', 0)$$,
  '23514', null, 'a payment is more than zero'
);
select throws_ok(
  $$update public.client_service_period set written_off_on = '2026-10-10' where id = '00000000-0000-0000-0000-00000000e2e1'$$,
  '23514', null, '"no pagará" needs a reason'
);
select lives_ok(
  $$update public.client_service_period set written_off_on = '2026-10-10', write_off_reason = 'Cerró el negocio'
    where id = '00000000-0000-0000-0000-00000000e2e1'$$,
  '"no pagará" with day and reason'
);

-- Anonymous visitor and user without a role ---------------------------------

set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select throws_ok($$select * from public.client_payment$$, '42501', null, 'anon: cannot read payments');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000e202", "role": "authenticated"}', true);
select is((select count(*) from public.client_payment)::int, 0, 'user: reads no payments');
select throws_ok(
  $$insert into public.client_payment (period_id, amount) values ('00000000-0000-0000-0000-00000000e2e1', 1)$$,
  '42501', null, 'user: cannot record payments'
);
reset role;

-- Admin ------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000e201", "role": "authenticated"}', true);
select is((select count(*) from public.client_payment)::int, 1, 'admin: reads payments');

select is(
  public.import_clients(format($$[{"name": "Importado pagado", "services": [
    {"service_id": "%s", "period": {"sold_on": "2026-01-15", "starts_on": "2026-01-15",
      "price_without_vat": 20, "vat_rate": 0.15, "paid_amount": 23}},
    {"service_id": "%s", "period": {"starts_on": "2026-01-15", "price_without_vat": 5, "vat_rate": 0.15}}]}]$$,
    (select id from public.service where slug = 'hosting'),
    (select id from public.service where slug = 'hosting'))::jsonb) ->> 'services_created',
  '2', 'admin: import with and without payment'
);
select is(
  (select array_agg((p.paid_on, p.amount, p.method)::text)
   from public.client_payment p
   join public.client_service_period csp on csp.id = p.period_id
   join public.client_service cs on cs.id = csp.client_service_id
   join public.client c on c.id = cs.client_id
   where c.name = 'Importado pagado'),
  array['(2026-01-15,23.00,other)'], 'admin: an imported paid period gets one payment on the sale day'
);
reset role;

select is(
  (select count(*) from public.client_payment p
   join public.client_service_period csp on csp.id = p.period_id
   where csp.client_service_id = '00000000-0000-0000-0000-00000000e2d1')::int,
  1, 'fixture payment is kept'
);
delete from public.client_service_period where id = '00000000-0000-0000-0000-00000000e2e1';
select is(
  (select count(*) from public.client_payment where period_id = '00000000-0000-0000-0000-00000000e2e1')::int,
  0, 'deleting a period deletes its payments'
);

select * from finish();
rollback;
