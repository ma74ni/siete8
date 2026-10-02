-- E10: assistant on the site (RF-AST-01..09, RF-ADM-07/08, RNF-15/16/28).
-- Each chat is a session with its messages. The server writes them with the
-- secret key after its own checks (Turnstile, limits); only admins read them.
-- The visitor's IP is never stored, only a salted hash to apply the limits.

create table public.chat_session (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null check (length(ip_hash) = 64),
  -- Set when the assistant registers the visitor as a lead.
  lead_id uuid references public.lead (id) on delete set null,
  -- The visitor accepts the privacy notice before the first message.
  consent_at timestamptz not null,
  utm jsonb not null default '{}'::jsonb check (jsonb_typeof(utm) = 'object'),
  message_count integer not null default 0 check (message_count >= 0),
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  -- Estimated from the token usage and the model's prices (RNF-28).
  cost_usd numeric(10, 6) not null default 0 check (cost_usd >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index chat_session_created_at_idx on public.chat_session (created_at desc);
create index chat_session_ip_hash_idx on public.chat_session (ip_hash, created_at);
create index chat_session_lead_id_idx on public.chat_session (lead_id);

create trigger chat_session_set_updated_at before update on public.chat_session
  for each row execute function public.set_updated_at();

create table public.chat_message (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_session (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (length(content) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index chat_message_session_idx on public.chat_message (session_id, created_at);

-- Spend since a date, for the monthly cap. Only the server (service role)
-- calls it.
create function public.chat_cost_since(since timestamptz)
returns numeric
language sql
stable
set search_path = ''
as $$
  select coalesce(sum(cost_usd), 0) from public.chat_session where created_at >= since;
$$;

revoke execute on function public.chat_cost_since(timestamptz) from public, anon, authenticated;
grant execute on function public.chat_cost_since(timestamptz) to service_role;

-- Row Level Security: nobody but admins reads; nobody writes through the API
-- (the server uses the secret key).

alter table public.chat_session enable row level security;
alter table public.chat_message enable row level security;

revoke insert, update, delete, truncate on public.chat_session, public.chat_message from anon, authenticated;

create policy "Admins read chat_session" on public.chat_session
  for select to authenticated
  using ((select public.is_admin()));

create policy "Admins read chat_message" on public.chat_message
  for select to authenticated
  using ((select public.is_admin()));

-- Settings --------------------------------------------------------------------
-- Whether the chat shows is public (every page reads it). The business
-- instructions and the monthly cap stay private.

insert into public.site_settings (key, value, is_public) values
  ('assistant_enabled', 'false', true),
  ('assistant', jsonb_build_object(
    'prompt', 'Atiende con calidez y en pocas palabras, como lo haría alguien de Siete8 por WhatsApp. Si la persona no sabe qué necesita, hazle una o dos preguntas para orientarla. La firma electrónica es el servicio más pedido: si te preguntan por facturar en el SRI, explícale que la necesita.',
    'monthly_budget_usd', 10
  ), false)
on conflict (key) do nothing;
