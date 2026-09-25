-- E1-08: image bucket and Storage policies. Run with `pnpm db:test`.
-- Size and type limits are enforced by the Storage API, not by Postgres: here
-- we check the bucket configuration and who can touch storage.objects.
begin;
create extension if not exists pgtap with schema extensions;

select * from no_plan();

-- Fixtures -----------------------------------------------------------------

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000aa01', 'admin@test.siete8.com'),
  ('00000000-0000-0000-0000-00000000aa02', 'user@test.siete8.com');
update public.profile set role = 'admin' where id = '00000000-0000-0000-0000-00000000aa01';

insert into storage.objects (bucket_id, name) values ('images', 'projects/existente.webp');

-- Storage blocks direct deletes unless this is set, as the Storage API does.
-- Turned on so the delete policy itself is what gets tested.
select set_config('storage.allow_delete_query', 'true', true);

-- Bucket -------------------------------------------------------------------

select is((select public from storage.buckets where id = 'images'), true, 'bucket: is public');
select is(
  (select file_size_limit from storage.buckets where id = 'images'), 2097152::bigint,
  'bucket: 2 MB per file'
);
select is(
  (select allowed_mime_types from storage.buckets where id = 'images'),
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  'bucket: only raster images, no SVG'
);

-- Anonymous visitor --------------------------------------------------------

set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);

select is((select count(*) from storage.objects)::int, 0, 'anon: cannot list images');
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('images', 'projects/anon.webp')$$,
  '42501', null, 'anon: cannot upload images'
);

update storage.objects set name = 'projects/renombrada-anon.webp';
delete from storage.objects;

-- Signed-in user without a role -------------------------------------------

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000aa02", "role": "authenticated"}', true);

select is((select count(*) from storage.objects)::int, 0, 'user: cannot list images');
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('images', 'projects/user.webp')$$,
  '42501', null, 'user: cannot upload images'
);

update storage.objects set name = 'projects/renombrada-user.webp';
delete from storage.objects;

reset role;
select is(
  (select array_agg(name) from storage.objects where bucket_id = 'images'),
  array['projects/existente.webp'],
  'anon and user: cannot rename or delete images'
);

-- Admin --------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000aa01", "role": "authenticated"}', true);

select is((select count(*) from storage.objects)::int, 1, 'admin: lists images');
select lives_ok(
  $$insert into storage.objects (bucket_id, name) values ('images', 'posts/portada.webp')$$,
  'admin: uploads to posts/'
);
select lives_ok(
  $$insert into storage.objects (bucket_id, name) values ('images', 'projects/galeria.avif')$$,
  'admin: uploads to projects/'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('images', 'otra/archivo.webp')$$,
  '42501', null, 'admin: cannot upload outside posts/ and projects/'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('images', 'raiz.webp')$$,
  '42501', null, 'admin: cannot upload to the bucket root'
);
select throws_ok(
  $$update storage.objects set name = 'otra/movida.webp' where name = 'posts/portada.webp'$$,
  '42501', null, 'admin: cannot move images outside posts/ and projects/'
);
select lives_ok(
  $$update storage.objects set name = 'posts/portada-2.webp' where name = 'posts/portada.webp'$$,
  'admin: renames images'
);
select lives_ok(
  $$delete from storage.objects where name = 'projects/galeria.avif'$$,
  'admin: deletes images'
);

reset role;
select is(
  (select array_agg(name order by name) from storage.objects where bucket_id = 'images'),
  array['posts/portada-2.webp', 'projects/existente.webp'],
  'admin: writes were applied'
);

select * from finish();
rollback;
