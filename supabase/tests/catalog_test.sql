-- E1-02: catalog schema. Run with `pnpm db:test`.
begin;
create extension if not exists pgtap with schema extensions;

select plan(23);

-- Tables and RLS
select has_table('public', t, t || ' exists')
from unnest(array['category', 'service', 'plan', 'requirement']) as t;

select ok(
  (select relrowsecurity from pg_class where oid = ('public.' || t)::regclass),
  t || ' has RLS enabled'
)
from unnest(array['category', 'service', 'plan', 'requirement']) as t;

-- Fixtures
insert into public.category (id, name, slug)
values ('00000000-0000-0000-0000-000000000001', 'Trámites', 'tramites');

insert into public.service (id, category_id, name, slug)
values ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Firma electrónica', 'firma-electronica');

-- Valid plan: price without VAT plus VAT rate
select lives_ok(
  $$insert into public.plan (id, service_id, name, holder_type, duration_value, duration_unit, price_without_vat, vat_rate)
    values ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', '1 año', 'natural', 1, 'year', 17.99, 0.15)$$,
  'accepts a valid plan'
);

select is(
  (select round(price_without_vat * (1 + vat_rate), 2) from public.plan where id = '00000000-0000-0000-0000-000000000003'),
  20.69::numeric,
  'stored price and VAT rate give the published total'
);

select lives_ok(
  $$insert into public.requirement (plan_id, text) values ('00000000-0000-0000-0000-000000000003', 'Cédula vigente')$$,
  'accepts a requirement'
);

-- Rejected values
select throws_ok(
  $$insert into public.plan (service_id, name, price_without_vat, vat_rate) values ('00000000-0000-0000-0000-000000000002', 'x', -1, 0.15)$$,
  '23514', null, 'rejects a negative price'
);

select throws_ok(
  $$insert into public.plan (service_id, name, price_without_vat, vat_rate) values ('00000000-0000-0000-0000-000000000002', 'x', 10, 1.5)$$,
  '23514', null, 'rejects a VAT rate above 1'
);

select throws_ok(
  $$insert into public.plan (service_id, name, price_without_vat) values ('00000000-0000-0000-0000-000000000002', 'x', 10)$$,
  '23502', null, 'requires an explicit VAT rate'
);

select throws_ok(
  $$insert into public.plan (service_id, name, duration_value, price_without_vat, vat_rate) values ('00000000-0000-0000-0000-000000000002', 'x', 1, 10, 0.15)$$,
  '23514', null, 'rejects a duration without unit'
);

select throws_ok(
  $$insert into public.category (name, slug) values ('x', 'Con Espacios')$$,
  '23514', null, 'rejects an invalid slug'
);

select throws_ok(
  $$insert into public.category (name, slug) values ('x', 'tramites')$$,
  '23505', null, 'rejects a duplicate slug'
);

select throws_ok(
  $$insert into public.service (category_id, kind, name, slug) values ('00000000-0000-0000-0000-000000000001', 'own_product', 'Facturador', 'facturador')$$,
  '23514', null, 'own_product requires external_app_url'
);

select throws_ok(
  $$delete from public.category where id = '00000000-0000-0000-0000-000000000001'$$,
  '23503', null, 'cannot delete a category that has services'
);

-- Visibility and order are per record
select is(
  (select visible from public.service where id = '00000000-0000-0000-0000-000000000002'),
  false,
  'services are hidden by default'
);

update public.plan set sort_order = 5 where id = '00000000-0000-0000-0000-000000000003';
select is(
  (select sort_order from public.plan where id = '00000000-0000-0000-0000-000000000003'),
  5,
  'sort_order is stored per record'
);

-- Cascades
delete from public.service where id = '00000000-0000-0000-0000-000000000002';
select is((select count(*) from public.plan)::int, 0, 'deleting a service deletes its plans');
select is((select count(*) from public.requirement)::int, 0, 'deleting a plan deletes its requirements');

select * from finish();
rollback;
