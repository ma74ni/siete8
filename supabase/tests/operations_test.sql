-- E1-04: leads, site settings and profiles. Run with `pnpm db:test`.
begin;
create extension if not exists pgtap with schema extensions;

select plan(16);

-- Tables and RLS
select has_table('public', t, t || ' exists')
from unnest(array['lead', 'site_settings', 'profile']) as t;

select ok(
  (select relrowsecurity from pg_class where oid = ('public.' || t)::regclass),
  t || ' has RLS enabled'
)
from unnest(array['lead', 'site_settings', 'profile']) as t;

-- Consent is required
select throws_ok(
  $$insert into public.lead (name, phone, source) values ('Ana', '0991234567', 'form')$$,
  '23502', null, 'rejects a lead without consent_at'
);

select lives_ok(
  $$insert into public.lead (id, name, phone, source, service_id, consent_at)
    values ('00000000-0000-0000-0000-0000000000a1', 'Ana', '0991234567', 'form',
            (select id from public.service where slug = 'firma-electronica'), now())$$,
  'accepts a lead with consent'
);

select is(
  (select status::text from public.lead where id = '00000000-0000-0000-0000-0000000000a1'),
  'new', 'a lead starts as new'
);

select throws_ok(
  $$insert into public.lead (name, source, consent_at) values ('Sin contacto', 'form', now())$$,
  '23514', null, 'rejects a lead without phone or email'
);

select throws_ok(
  $$insert into public.lead (email, source, utm, consent_at) values ('a@b.ec', 'form', '["x"]', now())$$,
  '23514', null, 'rejects utm that is not an object'
);

select throws_ok(
  $$insert into public.lead (email, source, consent_at) values ('no-es-correo', 'form', now())$$,
  '23514', null, 'rejects an invalid email'
);

-- Leads survive catalog deletions
delete from public.service where slug = 'firma-electronica';
select is(
  (select service_id from public.lead where id = '00000000-0000-0000-0000-0000000000a1'),
  null::uuid, 'deleting a service keeps the lead'
);

-- New Auth users get a profile without a role
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000b1', 'nuevo@siete8.com');
select is(
  (select count(*) from public.profile where id = '00000000-0000-0000-0000-0000000000b1' and role is null)::int,
  1, 'a new Auth user gets a profile without role'
);

-- Seeded settings
select set_eq(
  $$select key from public.site_settings where is_public$$,
  array['whatsapp', 'social', 'assistant_enabled'],
  'public settings are seeded'
);

select is(
  (select value ->> 'wa_me' from public.site_settings where key = 'whatsapp'),
  '593961128233', 'WhatsApp number for wa.me links'
);

select * from finish();
rollback;
