-- E1-08: image bucket for blog covers and portfolio galleries.
--
-- The bucket is public: files are served by their public URL
-- (/storage/v1/object/public/images/...) without a session or policy. There is
-- no read policy for anon, so nobody can list the bucket through the API.
-- Only admins write, and only under posts/ or projects/.
--
-- The Storage API enforces the size and type limits on every upload, even with
-- the secret key. SVG is not allowed: it can carry scripts.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'images',
  'images',
  true,
  2097152, -- 2 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
);

create policy "Admin reads images" on storage.objects
  for select to authenticated
  using (bucket_id = 'images' and (select public.is_admin()));

create policy "Admin uploads images" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'images'
    and (storage.foldername(name))[1] in ('posts', 'projects')
    and (select public.is_admin())
  );

create policy "Admin updates images" on storage.objects
  for update to authenticated
  using (bucket_id = 'images' and (select public.is_admin()))
  with check (
    bucket_id = 'images'
    and (storage.foldername(name))[1] in ('posts', 'projects')
    and (select public.is_admin())
  );

create policy "Admin deletes images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'images' and (select public.is_admin()));
