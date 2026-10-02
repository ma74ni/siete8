-- Assistant conversations (E10). Run with `pnpm db:test`.
begin;
create extension if not exists pgtap with schema extensions;

select * from no_plan();

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000c401', 'admin@test.siete8.com'),
  ('00000000-0000-0000-0000-00000000c402', 'user@test.siete8.com');
update public.profile set role = 'admin' where id = '00000000-0000-0000-0000-00000000c401';

insert into public.chat_session (id, ip_hash, consent_at, cost_usd) values
  ('00000000-0000-0000-0000-00000000c4a1', repeat('a', 64), now(), 0.05),
  ('00000000-0000-0000-0000-00000000c4a2', repeat('b', 64), now(), 0.02);
insert into public.chat_session (ip_hash, consent_at, cost_usd, created_at)
values (repeat('c', 64), now(), 1, now() - interval '40 days');
insert into public.chat_message (session_id, role, content) values
  ('00000000-0000-0000-0000-00000000c4a1', 'user', 'Hola, ¿cuánto cuesta la firma?'),
  ('00000000-0000-0000-0000-00000000c4a1', 'assistant', 'Desde $8,04 con IVA.');

-- Settings -------------------------------------------------------------------

select is(
  (select is_public from public.site_settings where key = 'assistant'),
  false, 'the assistant prompt and cap are private'
);
select is(
  (select (value ->> 'monthly_budget_usd')::numeric from public.site_settings where key = 'assistant'),
  10::numeric, 'monthly cap of 10 USD'
);
select is(
  (select value from public.site_settings where key = 'assistant_enabled'),
  'false'::jsonb, 'the assistant starts off'
);

-- Constraints ----------------------------------------------------------------

select throws_ok(
  $$insert into public.chat_session (ip_hash, consent_at) values ('192.168.1.1', now())$$,
  '23514', null, 'only a hash is stored, never the IP'
);
select throws_ok(
  $$insert into public.chat_message (session_id, role, content) values ('00000000-0000-0000-0000-00000000c4a1', 'system', 'x')$$,
  '23514', null, 'only user and assistant messages'
);
select throws_ok(
  $$insert into public.chat_message (session_id, role, content) values ('00000000-0000-0000-0000-00000000c4a1', 'user', repeat('x', 4001))$$,
  '23514', null, 'messages have a length limit'
);

-- Monthly spend ------------------------------------------------------------------

select is(
  public.chat_cost_since(now() - interval '30 days'),
  0.07::numeric, 'spend counts only the sessions since the date'
);

-- Anonymous visitor ----------------------------------------------------------

set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select is((select count(*) from public.chat_session)::int, 0, 'anon: reads no sessions');
select is((select count(*) from public.chat_message)::int, 0, 'anon: reads no messages');
select throws_ok(
  $$insert into public.chat_message (session_id, role, content) values ('00000000-0000-0000-0000-00000000c4a1', 'user', 'x')$$,
  '42501', null, 'anon: cannot write messages'
);
select throws_ok(
  $$select public.chat_cost_since(now())$$,
  '42501', null, 'anon: cannot read the spend'
);
select is(
  (select count(*) from public.site_settings where key = 'assistant')::int,
  0, 'anon: cannot read the assistant prompt'
);
select is(
  (select count(*) from public.site_settings where key = 'assistant_enabled')::int,
  1, 'anon: reads whether the assistant is on'
);
reset role;

-- Signed-in user without a role ---------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000c402", "role": "authenticated"}', true);
select is((select count(*) from public.chat_message)::int, 0, 'user: reads no messages');
select throws_ok(
  $$update public.chat_session set cost_usd = 0$$,
  '42501', null, 'user: cannot change the spend'
);
reset role;

-- Admin ------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000c401", "role": "authenticated"}', true);
select is((select count(*) from public.chat_message)::int, 2, 'admin: reads the conversations');
select throws_ok(
  $$delete from public.chat_message$$,
  '42501', null, 'admin: conversations are a record, not edited from the API'
);
reset role;

select * from finish();
rollback;
