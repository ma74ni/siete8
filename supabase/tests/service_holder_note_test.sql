-- E3-03: note under the plans of one holder type. Run with `pnpm db:test`.
-- The seed loads the legal representative note from COPY §4.
begin;
create extension if not exists pgtap with schema extensions;

select * from no_plan();

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000ab01', 'admin@test.siete8.com'),
  ('00000000-0000-0000-0000-00000000ab02', 'user@test.siete8.com');
update public.profile set role = 'admin' where id = '00000000-0000-0000-0000-00000000ab01';

-- Seeded content -------------------------------------------------------------

select is(
  (select n.body from public.service_holder_note n join public.service s on s.id = n.service_id
   where s.slug = 'firma-electronica' and n.holder_type = 'legal_entity'),
  'Los planes de 7 y 30 días no están disponibles.',
  'signature: legal representative note'
);
select is((select count(*) from public.service_holder_note)::int, 1, 'only the signature has a note');

-- Constraints ------------------------------------------------------------------

select throws_ok(
  $$insert into public.service_holder_note (service_id, holder_type, body)
    select id, 'natural', '  ' from public.service where slug = 'firma-electronica'$$,
  '23514', null, 'a note cannot be blank'
);
select throws_ok(
  $$insert into public.service_holder_note (service_id, holder_type, body)
    select id, 'legal_entity', 'Otra.' from public.service where slug = 'firma-electronica'$$,
  '23505', null, 'one note per service and holder type'
);

-- Anonymous visitor ------------------------------------------------------------

set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);

select is((select count(*) from public.service_holder_note)::int, 1, 'anon: reads notes of visible services');
select throws_ok(
  $$insert into public.service_holder_note (service_id, holder_type, body)
    select id, 'natural', 'x' from public.service where slug = 'firma-electronica'$$,
  '42501', null, 'anon: cannot add notes'
);

reset role;
update public.service set visible = false where slug = 'firma-electronica';
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);

select is((select count(*) from public.service_holder_note)::int, 0, 'anon: a hidden service hides its notes');

reset role;
update public.service set visible = true where slug = 'firma-electronica';

-- Signed-in user without a role -----------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000ab02", "role": "authenticated"}', true);

select throws_ok(
  $$insert into public.service_holder_note (service_id, holder_type, body)
    select id, 'natural', 'x' from public.service where slug = 'firma-electronica'$$,
  '42501', null, 'user: cannot add notes'
);
update public.service_holder_note set body = 'cambiado';
delete from public.service_holder_note;

reset role;
select is((select count(*) from public.service_holder_note where body = 'cambiado')::int, 0, 'user: cannot edit notes');
select is((select count(*) from public.service_holder_note)::int, 1, 'user: cannot delete notes');

-- Admin ----------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000ab01", "role": "authenticated"}', true);

select lives_ok(
  $$update public.service_holder_note set body = 'Aviso editado.'$$,
  'admin: edits notes'
);
select lives_ok(
  $$insert into public.service_holder_note (service_id, holder_type, body)
    select id, 'natural', 'Aviso nuevo.' from public.service where slug = 'firma-electronica'$$,
  'admin: adds notes'
);

reset role;
select is((select count(*) from public.service_holder_note where body = 'Aviso editado.')::int, 1, 'admin: note was edited');
select is((select count(*) from public.service_holder_note)::int, 2, 'admin: note was added');

select * from finish();
rollback;
