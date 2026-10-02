-- E3-03: service page texts (steps, questions, requirements intro, cross-sell).
-- Counts are scoped to the signature: other services have texts too (E6-02).
-- Run with `pnpm db:test`. The seed loads the signature texts from COPY §4.
begin;
create extension if not exists pgtap with schema extensions;

select * from no_plan();

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000aa01', 'admin@test.siete8.com'),
  ('00000000-0000-0000-0000-00000000aa02', 'user@test.siete8.com');
update public.profile set role = 'admin' where id = '00000000-0000-0000-0000-00000000aa01';

-- Seeded content -------------------------------------------------------------

select is(
  (select count(*) from public.service_step st join public.service s on s.id = st.service_id where s.slug = 'firma-electronica')::int,
  3, 'signature: three steps'
);
select is(
  (select count(*) from public.service_faq q join public.service s on s.id = q.service_id where s.slug = 'firma-electronica')::int,
  5, 'signature: five questions'
);
select is(
  (select r.slug from public.service s join public.service r on r.id = s.related_service_id where s.slug = 'firma-electronica'),
  'facturacion-electronica', 'signature: cross-sell to electronic invoicing'
);

-- Constraints ------------------------------------------------------------------

select throws_ok(
  $$insert into public.service_faq (service_id, question, answer)
    select id, '  ', 'x' from public.service where slug = 'firma-electronica'$$,
  '23514', null, 'a question cannot be blank'
);
select throws_ok(
  $$insert into public.service_step (service_id, body)
    select id, '' from public.service where slug = 'firma-electronica'$$,
  '23514', null, 'a step cannot be blank'
);
select throws_ok(
  $$update public.service set related_service_id = id where slug = 'hosting'$$,
  '23514', null, 'a service cannot cross-sell itself'
);

-- Anonymous visitor ------------------------------------------------------------

set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);

select is((select count(*) from public.service_step st join public.service s on s.id = st.service_id where s.slug = 'firma-electronica')::int, 3, 'anon: reads steps of visible services');
select is((select count(*) from public.service_faq q join public.service s on s.id = q.service_id where s.slug = 'firma-electronica')::int, 5, 'anon: reads questions of visible services');
select throws_ok(
  $$insert into public.service_faq (service_id, question, answer)
    select id, 'q', 'a' from public.service where slug = 'firma-electronica'$$,
  '42501', null, 'anon: cannot add questions'
);

reset role;
update public.service set visible = false where slug = 'firma-electronica';
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);

select is((select count(*) from public.service_step st join public.service s on s.id = st.service_id where s.slug = 'firma-electronica')::int, 0, 'anon: a hidden service hides its steps');
select is((select count(*) from public.service_faq q join public.service s on s.id = q.service_id where s.slug = 'firma-electronica')::int, 0, 'anon: a hidden service hides its questions');

reset role;
update public.service set visible = true where slug = 'firma-electronica';

-- Signed-in user without a role -----------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000aa02", "role": "authenticated"}', true);

select throws_ok(
  $$insert into public.service_step (service_id, body)
    select id, 'x' from public.service where slug = 'firma-electronica'$$,
  '42501', null, 'user: cannot add steps'
);
update public.service_faq set answer = 'cambiado';
delete from public.service_step;

reset role;
select is((select count(*) from public.service_faq where answer = 'cambiado')::int, 0, 'user: cannot edit questions');
select is((select count(*) from public.service_step st join public.service s on s.id = st.service_id where s.slug = 'firma-electronica')::int, 3, 'user: cannot delete steps');

-- Admin ----------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000aa01", "role": "authenticated"}', true);

select lives_ok(
  $$insert into public.service_faq (service_id, question, answer, sort_order)
    select id, '¿Pregunta nueva?', 'Respuesta.', 6 from public.service where slug = 'firma-electronica'$$,
  'admin: adds questions'
);
select lives_ok(
  $$update public.service_step set body = 'Paso editado.'
    where sort_order = 1 and service_id = (select id from public.service where slug = 'firma-electronica')$$,
  'admin: edits steps'
);
select lives_ok(
  $$update public.service set requirements_intro = 'Nueva introducción.' where slug = 'firma-electronica'$$,
  'admin: edits the requirements introduction'
);

reset role;
select is((select count(*) from public.service_faq q join public.service s on s.id = q.service_id where s.slug = 'firma-electronica')::int, 6, 'admin: question was added');
select is((select st.body from public.service_step st join public.service s on s.id = st.service_id
  where s.slug = 'firma-electronica' and st.sort_order = 1), 'Paso editado.', 'admin: step was edited');

select * from finish();
rollback;
