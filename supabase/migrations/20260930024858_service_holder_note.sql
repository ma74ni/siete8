-- E3-03: a note under the plans of one holder type, e.g. "Los planes de 7 y
-- 30 días no están disponibles." for legal representatives (COPY §4). It lives
-- in the database so the panel can edit it (E4-02).

create table public.service_holder_note (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.service (id) on delete cascade,
  holder_type public.holder_type not null,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One note per tab of plans.
  unique (service_id, holder_type)
);

create trigger service_holder_note_set_updated_at before update on public.service_holder_note
  for each row execute function public.set_updated_at();

-- Row Level Security ----------------------------------------------------------

alter table public.service_holder_note enable row level security;

revoke insert, update, delete, truncate on public.service_holder_note from anon;
revoke truncate on public.service_holder_note from authenticated;

-- Readable while the service is (the service policy already checks its
-- visibility and its category's).
create policy "Public reads holder notes of visible services" on public.service_holder_note
  for select to anon, authenticated
  using (exists (select 1 from public.service s where s.id = service_id));

create policy "Admins manage service_holder_note" on public.service_holder_note
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Signature note (docs/COPY.md §4) -------------------------------------------
-- For databases seeded before this migration; the seed loads it too.

insert into public.service_holder_note (service_id, holder_type, body)
select s.id, 'legal_entity', 'Los planes de 7 y 30 días no están disponibles.'
from public.service s
where s.slug = 'firma-electronica'
on conflict (service_id, holder_type) do nothing;
