-- Local seed data, loaded by `supabase db reset` after the migrations.
-- E1-09: initial catalog from the SRS (annexes A, D and E) and the signature
-- requirements from docs/COPY.md ("Qué necesitas"). Prices are stored without
-- VAT; the site shows price_without_vat * (1 + vat_rate).

-- Categories (annex D). Marketing digital is hidden: none of its services are
-- visible at launch.
-- Descriptions from docs/COPY.md §2 (also set by the category_description
-- migration for databases seeded before it).
insert into public.category (name, slug, visible, sort_order, description) values
  ('Presencia digital', 'presencia-digital', true, 1, 'Para que tu negocio se vea profesional y te encuentren en internet.'),
  ('Trámites y cumplimiento', 'tramites-y-cumplimiento', true, 2, 'Para cumplir con el SRI y firmar documentos sin filas ni papeles.'),
  ('Desarrollo y datos', 'desarrollo-y-datos', true, 3, 'Para procesos que ya no caben en una hoja de cálculo.'),
  ('Marketing digital', 'marketing-digital', false, 4, null),
  ('Soporte', 'soporte', true, 5, null);

-- Services (annex D) with their launch visibility.
insert into public.service (category_id, kind, name, slug, visible, sort_order)
select c.id, s.kind::public.service_kind, s.name, s.slug, s.visible, s.sort_order
from (values
  ('presencia-digital', 'service', 'Páginas web', 'paginas-web', true, 1),
  ('presencia-digital', 'service', 'Landing page', 'landing-page', true, 2),
  ('presencia-digital', 'service', 'Tiendas virtuales', 'tiendas-virtuales', true, 3),
  ('presencia-digital', 'service', 'Hosting', 'hosting', true, 4),
  ('presencia-digital', 'service', 'Correo corporativo', 'correo-corporativo', true, 5),
  ('presencia-digital', 'service', 'Dominios', 'dominios', true, 6),
  ('tramites-y-cumplimiento', 'service', 'Firma electrónica', 'firma-electronica', true, 1),
  -- Own product: hidden until the invoicing app is in production and has its URL.
  ('tramites-y-cumplimiento', 'own_product', 'Facturación electrónica', 'facturacion-electronica', false, 2),
  -- Provided by a partner accountant.
  ('tramites-y-cumplimiento', 'resale', 'Asesoría y contabilidad', 'asesoria-y-contabilidad', false, 3),
  ('desarrollo-y-datos', 'service', 'Apps y desarrollo a medida', 'apps-y-desarrollo-a-medida', true, 1),
  ('desarrollo-y-datos', 'service', 'Análisis de datos / BI', 'analisis-de-datos-bi', true, 2),
  ('desarrollo-y-datos', 'service', 'Plataformas virtuales de educación', 'plataformas-virtuales-de-educacion', false, 3),
  ('marketing-digital', 'service', 'Redes sociales', 'redes-sociales', false, 1),
  ('marketing-digital', 'service', 'Mailing', 'mailing', false, 2),
  ('soporte', 'service', 'Soporte técnico remoto o presencial', 'soporte-tecnico', true, 1)
) as s (category_slug, kind, name, slug, visible, sort_order)
join public.category c on c.slug = s.category_slug;

-- Signature plans (annex A): 15 % VAT, visible. The 1-year plan of each
-- holder type is the recommended one.
insert into public.plan (service_id, name, holder_type, duration_value, duration_unit, price_without_vat, vat_rate, visible, sort_order, recommended)
select s.id, p.name, p.holder::public.holder_type, p.duration_value, p.duration_unit::public.duration_unit, p.price, 0.15, true, p.sort_order,
  p.duration_value = 1 and p.duration_unit = 'year'
from (values
  ('7 días', 'natural', 7, 'day', 6.99, 1),
  ('30 días', 'natural', 30, 'day', 9.99, 2),
  ('1 año', 'natural', 1, 'year', 17.99, 3),
  ('2 años', 'natural', 2, 'year', 26.99, 4),
  ('3 años', 'natural', 3, 'year', 36.99, 5),
  ('4 años', 'natural', 4, 'year', 47.99, 6),
  ('5 años', 'natural', 5, 'year', 54.99, 7),
  ('1 año', 'legal_entity', 1, 'year', 20.99, 1),
  ('2 años', 'legal_entity', 2, 'year', 29.99, 2),
  ('3 años', 'legal_entity', 3, 'year', 39.99, 3),
  ('4 años', 'legal_entity', 4, 'year', 50.99, 4),
  ('5 años', 'legal_entity', 5, 'year', 57.99, 5)
) as p (name, holder, duration_value, duration_unit, price, sort_order)
join public.service s on s.slug = 'firma-electronica';

-- Signature requirements, text from docs/COPY.md. Every plan of a holder type
-- gets the same list.
insert into public.requirement (plan_id, text, required, sort_order)
select pl.id, r.text, r.required, r.sort_order
from (values
  ('natural', 'Fotos de tu cédula vigente, por ambos lados (no copias).', true, 1),
  ('natural', 'Una foto de medio cuerpo sosteniendo tu cédula a la altura del mentón.', true, 2),
  ('natural', 'RUC activo en PDF, si vas a facturar electrónicamente.', false, 3),
  ('natural', 'Un correo al que tengas acceso y con espacio libre.', true, 4),
  ('natural', 'Un celular activo, con buena señal, para recibir el código de activación.', true, 5),
  ('legal_entity', 'Fotos de tu cédula vigente, por ambos lados.', true, 1),
  ('legal_entity', 'Una foto de medio cuerpo sosteniendo tu cédula a la altura del mentón.', true, 2),
  ('legal_entity', 'RUC activo de la empresa, en PDF o copia de las dos hojas.', true, 3),
  ('legal_entity', 'Nombramiento vigente, con carta de aceptación y razón de inscripción en el Registro Mercantil.', true, 4),
  ('legal_entity', 'Constitución notariada con razón de inscripción, o estatutos si la empresa no está bajo la Superintendencia de Compañías.', true, 5),
  ('legal_entity', 'Un correo y un celular activos.', true, 6)
) as r (holder, text, required, sort_order)
join public.plan pl on pl.holder_type = r.holder::public.holder_type
join public.service s on s.id = pl.service_id and s.slug = 'firma-electronica';

-- Hosting and email plans (annex E.2, E.3 and E.5): yearly, 15 % VAT. Hidden:
-- the annex marks them as proposals to validate before publishing. The legacy
-- rate for current clients (77) and the add-on accounts (E.4) are not loaded.
insert into public.plan (service_id, name, holder_type, duration_value, duration_unit, price_without_vat, vat_rate, visible, sort_order)
select s.id, p.name, 'not_applicable', 1, 'year', p.price, 0.15, false, p.sort_order
from (values
  ('hosting', 'Web Básico', 99.00, 1),
  ('hosting', 'Web Negocio', 129.00, 2),
  ('hosting', 'Web Pro', 199.00, 3),
  ('hosting', 'Sitio moderno', 60.00, 4),
  ('hosting', 'WordPress', 79.00, 5),
  ('correo-corporativo', 'Correo Inicial', 18.00, 1),
  ('correo-corporativo', 'Correo Equipo', 45.00, 2),
  ('correo-corporativo', 'Correo Negocio', 69.00, 3),
  ('correo-corporativo', 'Correo Pro', 179.00, 4)
) as p (service_slug, name, price, sort_order)
join public.service s on s.slug = p.service_slug;

-- Site settings (E1-04), from CLAUDE.md and docs/COPY.md. All public.
insert into public.site_settings (key, value, is_public) values
  ('whatsapp', '{"number": "0961128233", "wa_me": "593961128233", "hours": {"from": "07:00", "to": "20:00"}}', true),
  ('social', '{"facebook": "https://www.facebook.com/siete8.ec", "instagram": "https://www.instagram.com/siete8.ec", "linkedin": "https://www.linkedin.com/company/siete8.ec"}', true),
  ('assistant_enabled', 'false', true);

-- Signature texts (docs/COPY.md §4) ------------------------------------------
-- Same statements as the service_content migration, which covers databases
-- seeded before it. Each block only runs if there is no content yet.

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
