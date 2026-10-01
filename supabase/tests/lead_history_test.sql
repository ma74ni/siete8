-- E3-08, E4-07: lead message and status history. Run with `pnpm db:test`.
begin;
create extension if not exists pgtap with schema extensions;

select * from no_plan();

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000ad01', 'admin@test.siete8.com'),
  ('00000000-0000-0000-0000-00000000ad02', 'user@test.siete8.com');
update public.profile set role = 'admin' where id = '00000000-0000-0000-0000-00000000ad01';

-- The form inserts with the secret key (bypasses RLS).
insert into public.lead (id, name, phone, message, source, consent_at)
values ('00000000-0000-0000-0000-0000000ad0a1', 'Ana', '0991234567', 'Quiero una firma.', 'form', now());

select is(
  (select array_agg(status::text) from public.lead_status_event where lead_id = '00000000-0000-0000-0000-0000000ad0a1'),
  array['new'], 'the initial status is recorded'
);
select throws_ok(
  $$insert into public.lead (name, phone, message, source, consent_at)
    values ('Ana', '0991234567', repeat('x', 2001), 'form', now())$$,
  '23514', null, 'a message cannot exceed 2000 characters'
);

-- Signed-in user without a role ---------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000ad02", "role": "authenticated"}', true);
select is((select count(*) from public.lead_status_event)::int, 0, 'user: cannot read the history');
select throws_ok(
  $$insert into public.lead_status_event (lead_id, status) values ('00000000-0000-0000-0000-0000000ad0a1', 'lost')$$,
  '42501', null, 'user: cannot write the history'
);
reset role;

-- Admin -----------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000ad01", "role": "authenticated"}', true);
update public.lead set status = 'contacted' where id = '00000000-0000-0000-0000-0000000ad0a1';
update public.lead set notes = 'Llamar el lunes.' where id = '00000000-0000-0000-0000-0000000ad0a1';
update public.lead set status = 'closed' where id = '00000000-0000-0000-0000-0000000ad0a1';

select is(
  (select array_agg(status::text order by created_at, status) from public.lead_status_event where lead_id = '00000000-0000-0000-0000-0000000ad0a1'),
  array['new', 'contacted', 'closed'], 'admin: each status change is recorded, notes are not'
);
select is(
  (select count(*) from public.lead_status_event where changed_by = '00000000-0000-0000-0000-00000000ad01')::int,
  2, 'admin: changes record who made them'
);
select throws_ok(
  $$delete from public.lead_status_event$$,
  '42501', null, 'admin: cannot rewrite the history'
);
reset role;

select * from finish();
rollback;
