-- E1-05: Row Level Security policies.
-- Anonymous visitors and signed-in users without a role read only what is
-- published and visible. Only admins read hidden rows and write. Leads are
-- never readable by the public and are inserted server-side (E3-08) with the
-- secret key after Turnstile and consent checks. Roles are granted only via
-- SQL: there is no write policy on profile.

-- Helper -------------------------------------------------------------------

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profile
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Defense in depth ---------------------------------------------------------
-- Anonymous visitors never write, even if a policy is wrong. TRUNCATE skips
-- RLS, so nobody outside the service role gets it.

revoke insert, update, delete, truncate on all tables in schema public from anon;
revoke truncate on all tables in schema public from authenticated;

alter default privileges in schema public
  revoke insert, update, delete, truncate on tables from anon;
alter default privileges in schema public
  revoke truncate on tables from authenticated;

-- Catalog ------------------------------------------------------------------

create policy "Public reads visible categories" on public.category
  for select to anon, authenticated
  using (visible);

-- A hidden category hides its services (RF-ADM-12).
create policy "Public reads visible services" on public.service
  for select to anon, authenticated
  using (visible and exists (
    select 1 from public.category c where c.id = category_id and c.visible
  ));

create policy "Public reads visible plans" on public.plan
  for select to anon, authenticated
  using (visible and exists (
    select 1 from public.service s where s.id = service_id
  ));

create policy "Public reads requirements of visible plans" on public.requirement
  for select to anon, authenticated
  using (exists (
    select 1 from public.plan p where p.id = plan_id
  ));

-- Content ------------------------------------------------------------------

-- Scheduled posts stay hidden until published_at.
create policy "Public reads published posts" on public.post
  for select to anon, authenticated
  using (status = 'published' and published_at <= now());

create policy "Public reads links of published posts" on public.post_service
  for select to anon, authenticated
  using (
    exists (select 1 from public.post p where p.id = post_id)
    and exists (select 1 from public.service s where s.id = service_id)
  );

create policy "Public reads published projects" on public.project
  for select to anon, authenticated
  using (published);

create policy "Public reads images of published projects" on public.project_image
  for select to anon, authenticated
  using (exists (
    select 1 from public.project p where p.id = project_id
  ));

create policy "Public reads services of published projects" on public.project_service
  for select to anon, authenticated
  using (
    exists (select 1 from public.project p where p.id = project_id)
    and exists (select 1 from public.service s where s.id = service_id)
  );

-- Operations ---------------------------------------------------------------

create policy "Public reads public settings" on public.site_settings
  for select to anon, authenticated
  using (is_public);

create policy "Users read their own profile" on public.profile
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

-- Admin: read everything and write -----------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'category', 'service', 'plan', 'requirement',
    'post', 'post_service', 'project', 'project_image', 'project_service',
    'lead', 'site_settings'
  ]
  loop
    execute format(
      'create policy "Admins manage %1$s" on public.%1$I for all to authenticated
         using ((select public.is_admin())) with check ((select public.is_admin()))',
      t
    );
  end loop;
end;
$$;
