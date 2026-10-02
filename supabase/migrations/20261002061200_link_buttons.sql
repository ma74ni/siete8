-- Links page (/enlaces): the buttons of the "link in bio" page, edited in
-- the panel. A button opens a URL, opens WhatsApp with the number from the
-- site settings, or shows the latest blog article.

create type public.link_kind as enum ('url', 'whatsapp', 'latest_post');

create table public.link_button (
  id uuid primary key default gen_random_uuid(),
  label text not null check (length(trim(label)) between 1 and 60),
  kind public.link_kind not null default 'url',
  -- Only for `url`: a page of the site (/servicios) or an https address.
  url text check (url is null or url ~ '^(/|https://)\S*$'),
  highlight boolean not null default false,
  visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint link_button_url_when_url check ((kind = 'url') = (url is not null))
);

create index link_button_sort_idx on public.link_button (sort_order);

create trigger link_button_set_updated_at before update on public.link_button
  for each row execute function public.set_updated_at();

-- Row Level Security ----------------------------------------------------------

alter table public.link_button enable row level security;

revoke insert, update, delete, truncate on public.link_button from anon;
revoke truncate on public.link_button from authenticated;

create policy "Public reads visible link buttons" on public.link_button
  for select to anon, authenticated
  using (visible);

create policy "Admins manage link_button" on public.link_button
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Initial buttons (COPY §17). Projects stays hidden until one is published.
insert into public.link_button (label, kind, url, highlight, visible, sort_order)
select v.label, v.kind::public.link_kind, v.url, v.highlight, v.visible, v.sort_order
from (values
  ('Escríbenos por WhatsApp', 'whatsapp', null, true, true, 1),
  ('Firma electrónica', 'url', '/servicios/firma-electronica', false, true, 2),
  ('Servicios', 'url', '/servicios', false, true, 3),
  ('Del blog', 'latest_post', null, false, true, 4),
  ('Cuéntanos tu proyecto', 'url', '/contacto#formulario', false, true, 5),
  ('Proyectos', 'url', '/proyectos', false, false, 6)
) as v (label, kind, url, highlight, visible, sort_order)
where not exists (select 1 from public.link_button);
