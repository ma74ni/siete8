-- E3-03: the texts of each service page live in the database so the panel
-- can edit them (E4-02). Hero paragraph: service.summary (already exists).

-- Service fields -------------------------------------------------------------

alter table public.service
  -- Introduction of the "Qué necesitas" (requirements) section.
  add column requirements_intro text
    check (requirements_intro is null or length(trim(requirements_intro)) > 0),
  -- Cross-sell: the page suggests this service while it is visible.
  add column related_service_id uuid references public.service (id) on delete set null,
  -- Cross-sell text and button, written from this service's point of view.
  add column cross_sell_text text
    check (cross_sell_text is null or length(trim(cross_sell_text)) > 0),
  add column cross_sell_cta text
    check (cross_sell_cta is null or length(trim(cross_sell_cta)) > 0),
  -- Title of the closing call to action at the end of the page.
  add column closing_title text
    check (closing_title is null or length(trim(closing_title)) > 0),
  add constraint service_not_related_to_itself check (related_service_id <> id);

-- Steps ("Así la obtienes") -------------------------------------------------

create table public.service_step (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.service (id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index service_step_service_sort_idx on public.service_step (service_id, sort_order);

create trigger service_step_set_updated_at before update on public.service_step
  for each row execute function public.set_updated_at();

-- Frequently asked questions ------------------------------------------------

create table public.service_faq (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.service (id) on delete cascade,
  question text not null check (length(trim(question)) > 0),
  answer text not null check (length(trim(answer)) > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index service_faq_service_sort_idx on public.service_faq (service_id, sort_order);

create trigger service_faq_set_updated_at before update on public.service_faq
  for each row execute function public.set_updated_at();

-- Row Level Security ----------------------------------------------------------

alter table public.service_step enable row level security;
alter table public.service_faq enable row level security;

revoke insert, update, delete, truncate on public.service_step, public.service_faq from anon;
revoke truncate on public.service_step, public.service_faq from authenticated;

-- Readable while the service is (the service policy already checks its
-- visibility and its category's).
create policy "Public reads steps of visible services" on public.service_step
  for select to anon, authenticated
  using (exists (select 1 from public.service s where s.id = service_id));

create policy "Public reads questions of visible services" on public.service_faq
  for select to anon, authenticated
  using (exists (select 1 from public.service s where s.id = service_id));

create policy "Admins manage service_step" on public.service_step
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Admins manage service_faq" on public.service_faq
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Signature texts (docs/COPY.md §4) ------------------------------------------
-- For databases seeded before this migration; the seed loads them too. Each
-- block only runs if the service exists and has no content yet.

update public.service
set
  summary = 'Tu firma para facturar en el SRI, firmar contratos y hacer trámites en línea, con la misma validez legal que tu firma a mano.',
  requirements_intro = 'Tenlo listo antes de escribirnos y tu firma sale en minutos. Las fotos deben ser nítidas, sin gafas, gorra ni mascarilla.',
  closing_title = '¿Listo para sacar tu firma?',
  seo_title = 'Firma electrónica en Ecuador desde $8,04 | Siete8',
  seo_description = 'Firma electrónica para persona natural o representante legal. Entrega en minutos por WhatsApp. Precios con IVA desde $8,04. Sirve para facturar en el SRI.'
where slug = 'firma-electronica' and summary is null;

update public.service s
set
  related_service_id = f.id,
  cross_sell_text = 'Emite tus facturas desde el celular o la computadora con tu nueva firma, sin instalar programas.',
  cross_sell_cta = 'Conocer el facturador'
from public.service f
where s.slug = 'firma-electronica'
  and f.slug = 'facturacion-electronica'
  and s.related_service_id is null;

insert into public.service_step (service_id, body, sort_order)
select s.id, v.body, v.sort_order
from public.service s
cross join (values
  ('Elige tu plan: persona natural o representante legal, y cuántos años de vigencia.', 1),
  ('Envíanos tus requisitos por WhatsApp. No hace falta ir a ninguna oficina.', 2),
  ('Recibe tu firma entre 5 y 10 minutos después de validar tus datos, de 07:00 a 20:00.', 3)
) as v (body, sort_order)
where s.slug = 'firma-electronica'
  and not exists (select 1 from public.service_step st where st.service_id = s.id);

insert into public.service_faq (service_id, question, answer, sort_order)
select s.id, v.question, v.answer, v.sort_order
from public.service s
cross join (values
  ('¿Para qué me sirve la firma electrónica?', 'Para emitir facturas electrónicas en el SRI, firmar contratos y documentos digitales, y hacer trámites en línea con entidades públicas y privadas. Tiene la misma validez legal que tu firma manuscrita.', 1),
  ('¿En qué formato la recibo?', 'Como archivo .p12, listo para instalar en tu computadora o cargar en tu sistema de facturación.', 2),
  ('¿En qué horario atienden?', 'De 07:00 a 20:00. Si escribes fuera de ese horario, atendemos tu solicitud desde las 07:00 del día siguiente.', 3),
  ('¿Qué plan me conviene?', 'Si la usas para facturar todo el año, el de 1 año o más. Los de 7 y 30 días sirven para un trámite puntual.', 4),
  ('¿Me ayudan a instalarla?', 'Sí, si lo necesitas. Te ayudamos a instalarla en el sistema donde facturas o firmas.', 5)
) as v (question, answer, sort_order)
where s.slug = 'firma-electronica'
  and not exists (select 1 from public.service_faq q where q.service_id = s.id);
