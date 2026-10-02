-- Links page buttons (/enlaces). Run with `pnpm db:test`.
begin;
create extension if not exists pgtap with schema extensions;

select * from no_plan();

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000ae01', 'admin@test.siete8.com'),
  ('00000000-0000-0000-0000-00000000ae02', 'user@test.siete8.com');
update public.profile set role = 'admin' where id = '00000000-0000-0000-0000-00000000ae01';

-- Seeded buttons ---------------------------------------------------------------

select is((select count(*) from public.link_button)::int, 6, 'six initial buttons');
select is(
  (select kind::text from public.link_button where highlight),
  'whatsapp', 'the highlighted one opens WhatsApp'
);

-- Constraints ------------------------------------------------------------------

select throws_ok(
  $$insert into public.link_button (label, kind) values ('Sin enlace', 'url')$$,
  '23514', null, 'a url button needs its url'
);
select throws_ok(
  $$insert into public.link_button (label, kind, url) values ('WA', 'whatsapp', '/x')$$,
  '23514', null, 'a whatsapp button has no url'
);
select throws_ok(
  $$insert into public.link_button (label, kind, url) values ('Malo', 'url', 'http://inseguro.com')$$,
  '23514', null, 'external links need https'
);

-- Anonymous visitor ------------------------------------------------------------

set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select is((select count(*) from public.link_button)::int, 5, 'anon: only visible buttons');
select throws_ok(
  $$insert into public.link_button (label, kind, url) values ('x', 'url', '/x')$$,
  '42501', null, 'anon: cannot add buttons'
);
reset role;

-- Signed-in user without a role -----------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000ae02", "role": "authenticated"}', true);
update public.link_button set label = 'cambiado';
delete from public.link_button;
reset role;
select is((select count(*) from public.link_button where label = 'cambiado')::int, 0, 'user: cannot edit buttons');
select is((select count(*) from public.link_button)::int, 6, 'user: cannot delete buttons');

-- Admin ----------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000ae01", "role": "authenticated"}', true);
select is((select count(*) from public.link_button)::int, 6, 'admin: reads hidden buttons too');
select lives_ok(
  $$insert into public.link_button (label, kind, url, sort_order) values ('Promoción', 'url', 'https://siete8.com/servicios/hosting', 7)$$,
  'admin: adds buttons'
);
reset role;

select * from finish();
rollback;
