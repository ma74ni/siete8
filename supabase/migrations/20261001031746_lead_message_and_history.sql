-- E3-08, E4-07: the message of the contact form, and the history of each
-- lead's status ("cambio de estado queda registrado con fecha").

alter table public.lead
  add column message text
    check (message is null or length(message) <= 2000);

create table public.lead_status_event (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.lead (id) on delete cascade,
  status public.lead_status not null,
  -- Who changed it; null for the initial status set by the form.
  changed_by uuid references public.profile (id) on delete set null,
  created_at timestamptz not null default now()
);

create index lead_status_event_lead_idx on public.lead_status_event (lead_id, created_at);

-- Records the initial status and every change. Security definer: the form
-- inserts leads with the secret key and the panel updates them as the admin;
-- neither needs write access to this table.
create function public.record_lead_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.lead_status_event (lead_id, status, changed_by)
    values (new.id, new.status, (select auth.uid()));
  end if;
  return new;
end;
$$;

create trigger lead_record_status after insert or update of status on public.lead
  for each row execute function public.record_lead_status();

-- Row Level Security: only admins read the history; nobody writes it
-- directly (the trigger does).
alter table public.lead_status_event enable row level security;

revoke insert, update, delete, truncate on public.lead_status_event from anon, authenticated;

create policy "Admins read lead_status_event" on public.lead_status_event
  for select to authenticated
  using ((select public.is_admin()));
