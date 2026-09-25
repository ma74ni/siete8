-- E1-03: blog and portfolio. Run with `pnpm db:test`.
begin;
create extension if not exists pgtap with schema extensions;

select plan(22);

-- Tables and RLS
select has_table('public', t, t || ' exists')
from unnest(array['post', 'post_service', 'project', 'project_image', 'project_service']) as t;

select ok(
  (select relrowsecurity from pg_class where oid = ('public.' || t)::regclass),
  t || ' has RLS enabled'
)
from unnest(array['post', 'post_service', 'project', 'project_image', 'project_service']) as t;

-- Project status is an enum with the 5 states of SRS 3.7
select enum_has_labels(
  'public', 'project_status',
  array['in_development', 'active', 'internal', 'replaced', 'archived'],
  'project_status has the 5 states'
);

select throws_ok(
  $$insert into public.project (title, slug, sector, status) values ('x', 'x', 'Banca', 'online')$$,
  '22P02', null, 'rejects an unknown status'
);

-- Status, published and show_client_name are independent
select lives_ok(
  $$insert into public.project (id, title, slug, sector, status, published, show_client_name)
    values ('00000000-0000-0000-0000-0000000000c1', 'BI de seguros', 'test-bi-seguros', 'Seguros', 'archived', true, false)$$,
  'an archived project can be published without the client name'
);

select lives_ok(
  $$insert into public.project (title, slug, client_name, show_client_name, status, published)
    values ('Sitio', 'test-sitio', 'Cliente', true, 'active', false)$$,
  'an active project can be unpublished and show the client name'
);

select throws_ok(
  $$insert into public.project (title, slug, status) values ('x', 'test-sin-sector', 'internal')$$,
  '23514', null, 'a project hiding the client needs a sector'
);

select throws_ok(
  $$insert into public.project (title, slug, show_client_name, sector, status) values ('x', 'test-sin-cliente', true, 'Banca', 'internal')$$,
  '23514', null, 'a project showing the client needs its name'
);

select throws_ok(
  $$insert into public.project (title, slug, sector, status, live_url) values ('x', 'test-http', 'Banca', 'active', 'http://inseguro.ec')$$,
  '23514', null, 'live_url must use https'
);

-- Images need alt text
select throws_ok(
  $$insert into public.project_image (project_id, url, alt) values ('00000000-0000-0000-0000-0000000000c1', 'https://x/img.png', ' ')$$,
  '23514', null, 'rejects an image without alt text'
);

insert into public.project_image (project_id, url, alt) values ('00000000-0000-0000-0000-0000000000c1', 'https://x/img.png', 'Tablero de reportes');
insert into public.project_service (project_id, service_id)
  select '00000000-0000-0000-0000-0000000000c1', id from public.service where slug = 'analisis-de-datos-bi';

-- Posts
select throws_ok(
  $$insert into public.post (title, slug, status) values ('x', 'test-sin-fecha', 'published')$$,
  '23514', null, 'a published post needs published_at'
);

select lives_ok(
  $$insert into public.post (id, title, slug, status, published_at)
    values ('00000000-0000-0000-0000-0000000000d1', 'Programado', 'test-programado', 'published', now() + interval '7 days')$$,
  'accepts a scheduled post (published with a future date)'
);

insert into public.post_service (post_id, service_id)
  select '00000000-0000-0000-0000-0000000000d1', id from public.service where slug = 'firma-electronica';

-- Cascades
delete from public.project where id = '00000000-0000-0000-0000-0000000000c1';
select is(
  (select count(*) from public.project_image where project_id = '00000000-0000-0000-0000-0000000000c1')
  + (select count(*) from public.project_service where project_id = '00000000-0000-0000-0000-0000000000c1'),
  0::bigint, 'deleting a project deletes its images and services'
);

delete from public.post where id = '00000000-0000-0000-0000-0000000000d1';
select is(
  (select count(*) from public.post_service where post_id = '00000000-0000-0000-0000-0000000000d1'),
  0::bigint, 'deleting a post deletes its service links'
);

select * from finish();
rollback;
