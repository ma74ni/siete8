-- E1-05: Row Level Security. Run with `pnpm db:test`.
-- Fixtures are created as postgres (bypassing RLS); each block then switches
-- to the anon, authenticated (no role) or admin identity and checks what it
-- can read and write. The seed (supabase/seed.sql) is part of the data.
begin;
create extension if not exists pgtap with schema extensions;

select * from no_plan();

-- Fixtures -----------------------------------------------------------------

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000aa01', 'admin@test.siete8.com'),
  ('00000000-0000-0000-0000-00000000aa02', 'user@test.siete8.com');
update public.profile set role = 'admin' where id = '00000000-0000-0000-0000-00000000aa01';

-- A visible service inside a hidden category
insert into public.category (id, name, slug, visible) values
  ('00000000-0000-0000-0000-00000000bb01', 'Oculta', 'test-hidden-category', false);
insert into public.service (id, category_id, name, slug, visible) values
  ('00000000-0000-0000-0000-00000000bb02', '00000000-0000-0000-0000-00000000bb01', 'Visible en oculta', 'test-service-in-hidden', true);

-- A hidden plan in a visible service
insert into public.plan (service_id, name, price_without_vat, vat_rate, visible)
  select id, 'Plan oculto', 1, 0.15, false from public.service where slug = 'firma-electronica';

-- Posts: draft, scheduled and published
insert into public.post (title, slug, status, published_at) values
  ('Borrador', 'test-draft', 'draft', null),
  ('Programado', 'test-scheduled', 'published', now() + interval '1 day'),
  ('Publicado', 'test-published', 'published', now() - interval '1 day');

-- Projects: published and unpublished, each with an image
insert into public.project (id, title, slug, sector, status, published) values
  ('00000000-0000-0000-0000-00000000cc01', 'Publicado', 'test-project-published', 'Banca', 'archived', true),
  ('00000000-0000-0000-0000-00000000cc02', 'No publicado', 'test-project-unpublished', 'Banca', 'active', false);
insert into public.project_image (project_id, url, alt) values
  ('00000000-0000-0000-0000-00000000cc01', 'https://x/a.png', 'a'),
  ('00000000-0000-0000-0000-00000000cc02', 'https://x/b.png', 'b');

-- A private setting and a lead
insert into public.site_settings (key, value, is_public) values ('assistant_prompt', '"secreto"', false);
insert into public.lead (email, source, consent_at) values ('lead@test.ec', 'form', now());

-- Anonymous visitor --------------------------------------------------------

set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);

select is((select count(*) from public.category)::int, 4, 'anon: only visible categories');
select is((select count(*) from public.service)::int, 10, 'anon: only visible services');
select is(
  (select count(*) from public.service where slug = 'test-service-in-hidden')::int, 0,
  'anon: a visible service in a hidden category is hidden'
);
select is((select count(*) from public.service where slug = 'facturacion-electronica')::int, 0, 'anon: hidden service is hidden');
select is((select count(*) from public.plan)::int, 12, 'anon: only visible plans of visible services');
select is((select count(*) from public.plan where name = 'Plan oculto')::int, 0, 'anon: hidden plan is hidden');
select is((select count(*) from public.requirement)::int, 65, 'anon: requirements of visible plans');
select is(
  (select array_agg(slug order by slug) from public.post), array['test-published'],
  'anon: only published posts whose date has passed'
);
select is(
  (select array_agg(slug) from public.project), array['test-project-published'],
  'anon: only published projects'
);
select is((select count(*) from public.project_image)::int, 1, 'anon: only images of published projects');
select is((select count(*) from public.site_settings)::int, 3, 'anon: only public settings');
select is((select count(*) from public.lead)::int, 0, 'anon: cannot read leads');
select is((select count(*) from public.profile)::int, 0, 'anon: cannot read profiles');

select throws_ok(
  $$insert into public.lead (email, source, consent_at) values ('x@y.ec', 'form', now())$$,
  '42501', null, 'anon: cannot insert leads'
);
select throws_ok(
  $$insert into public.category (name, slug) values ('x', 'test-anon')$$,
  '42501', null, 'anon: cannot insert into the catalog'
);
select throws_ok(
  $$update public.plan set price_without_vat = 0$$,
  '42501', null, 'anon: cannot update prices'
);
select throws_ok(
  $$delete from public.post$$,
  '42501', null, 'anon: cannot delete posts'
);

-- Signed-in user without a role -------------------------------------------

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000aa02", "role": "authenticated"}', true);

select is((select public.is_admin()), false, 'user: is not admin');
select is((select count(*) from public.service)::int, 10, 'user: only visible services');
select is((select count(*) from public.post)::int, 1, 'user: only published posts');
select is((select count(*) from public.lead)::int, 0, 'user: cannot read leads');
select is((select count(*) from public.site_settings)::int, 3, 'user: only public settings');
select is(
  (select array_agg(id) from public.profile), array['00000000-0000-0000-0000-00000000aa02'::uuid],
  'user: reads only their own profile'
);

select throws_ok(
  $$insert into public.category (name, slug) values ('x', 'test-user')$$,
  '42501', null, 'user: cannot insert into the catalog'
);
select throws_ok(
  $$insert into public.lead (email, source, consent_at) values ('x@y.ec', 'form', now())$$,
  '42501', null, 'user: cannot insert leads'
);

-- Updates and deletes without a matching policy affect no rows.
update public.plan set price_without_vat = 0;
delete from public.project;
update public.profile set role = 'admin' where id = '00000000-0000-0000-0000-00000000aa02';

reset role;
select is((select count(*) from public.plan where price_without_vat = 0)::int, 0, 'user: cannot update prices');
select is((select count(*) from public.project)::int, 2, 'user: cannot delete projects');
select is(
  (select role from public.profile where id = '00000000-0000-0000-0000-00000000aa02'), null::public.app_role,
  'user: cannot grant themselves the admin role'
);

-- Admin --------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000aa01", "role": "authenticated"}', true);

select is((select public.is_admin()), true, 'admin: is admin');
select is((select count(*) from public.category)::int, 6, 'admin: reads hidden categories');
select is((select count(*) from public.service)::int, 16, 'admin: reads hidden services');
select is((select count(*) from public.post)::int, 3, 'admin: reads drafts and scheduled posts');
select is((select count(*) from public.project)::int, 2, 'admin: reads unpublished projects');
select is((select count(*) from public.lead)::int, 1, 'admin: reads leads');
select is((select count(*) from public.site_settings)::int, 4, 'admin: reads private settings');
select is((select count(*) from public.profile)::int, 2, 'admin: reads all profiles');

select lives_ok(
  $$insert into public.category (name, slug) values ('Nueva', 'test-admin-category')$$,
  'admin: can insert into the catalog'
);
select lives_ok(
  $$update public.plan set price_without_vat = 18.99 where name = 'Plan oculto'$$,
  'admin: can update prices'
);
select lives_ok(
  $$update public.lead set status = 'contacted'$$,
  'admin: can update leads'
);
select lives_ok(
  $$delete from public.post where slug = 'test-draft'$$,
  'admin: can delete posts'
);

reset role;
select is((select price_without_vat from public.plan where name = 'Plan oculto'), 18.99, 'admin: price update was applied');
select is((select status::text from public.lead where email = 'lead@test.ec'), 'contacted', 'admin: lead update was applied');

select * from finish();
rollback;
