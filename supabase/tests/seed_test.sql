-- E1-09: initial catalog loaded by supabase/seed.sql. Run with `pnpm db:test`.
begin;
create extension if not exists pgtap with schema extensions;

select plan(12);

select is((select count(*) from public.category)::int, 5, '5 categories');
select is((select count(*) from public.service)::int, 15, '15 services (annex D)');
select is((select count(*) from public.service where visible)::int, 10, '10 services visible at launch');

select set_eq(
  $$select slug from public.service where not visible$$,
  array['facturacion-electronica', 'asesoria-y-contabilidad', 'plataformas-virtuales-de-educacion', 'redes-sociales', 'mailing'],
  'hidden services match annex D'
);

select is(
  (select kind::text from public.service where slug = 'facturacion-electronica'),
  'own_product', 'invoicing is an own product'
);

-- Signature plans: 7 natural + 5 legal entity, all visible at 15 % VAT
select is(
  (select count(*) from public.plan p join public.service s on s.id = p.service_id
   where s.slug = 'firma-electronica' and p.visible and p.vat_rate = 0.15)::int,
  12, '12 visible signature plans at 15 % VAT'
);

-- Totals with VAT match annex A and docs/COPY.md
select set_eq(
  $$select p.holder_type::text, p.name, round(p.price_without_vat * (1 + p.vat_rate), 2)
    from public.plan p join public.service s on s.id = p.service_id
    where s.slug = 'firma-electronica'$$,
  $$values
    ('natural', '7 días', 8.04), ('natural', '30 días', 11.49),
    ('natural', '1 año', 20.69), ('natural', '2 años', 31.04), ('natural', '3 años', 42.54),
    ('natural', '4 años', 55.19), ('natural', '5 años', 63.24),
    ('legal_entity', '1 año', 24.14), ('legal_entity', '2 años', 34.49), ('legal_entity', '3 años', 45.99),
    ('legal_entity', '4 años', 58.64), ('legal_entity', '5 años', 66.69)$$,
  'signature totals with VAT match annex A'
);

-- Requirements: 5 per natural plan, 6 per legal entity plan
select is(
  (select count(distinct n) from (
     select count(r.id) as n from public.plan p
     join public.service s on s.id = p.service_id and s.slug = 'firma-electronica'
     left join public.requirement r on r.plan_id = p.id
     where p.holder_type = 'natural' group by p.id) t)::int,
  1, 'every natural plan has the same number of requirements'
);
select is(
  (select count(r.id) from public.plan p
   join public.service s on s.id = p.service_id and s.slug = 'firma-electronica'
   join public.requirement r on r.plan_id = p.id
   where p.holder_type = 'natural' and p.name = '1 año')::int,
  5, 'natural plans have 5 requirements'
);
select is(
  (select count(r.id) from public.plan p
   join public.service s on s.id = p.service_id and s.slug = 'firma-electronica'
   join public.requirement r on r.plan_id = p.id
   where p.holder_type = 'legal_entity' and p.name = '1 año')::int,
  6, 'legal entity plans have 6 requirements'
);

-- Hosting and email plans are loaded hidden
select is(
  (select count(*) from public.plan p join public.service s on s.id = p.service_id
   where s.slug in ('hosting', 'correo-corporativo'))::int,
  9, '9 hosting and email plans'
);
select is(
  (select count(*) from public.plan p join public.service s on s.id = p.service_id
   where s.slug in ('hosting', 'correo-corporativo') and p.visible)::int,
  0, 'hosting and email plans are hidden until validated'
);

select * from finish();
rollback;
