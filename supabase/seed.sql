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

-- Site settings (E1-04, E4-08), from CLAUDE.md and docs/COPY.md. All public.
-- The panel edits them; the contact_social migration converts older rows.
insert into public.site_settings (key, value, is_public) values
  ('whatsapp', '{"number": "0967155626", "wa_me": "593967155626", "hours": {"from": "07:00", "to": "20:00"}}', true),
  ('social', '[{"label": "Facebook", "url": "https://www.facebook.com/siete8.ec"}, {"label": "Instagram", "url": "https://www.instagram.com/siete8.ec"}, {"label": "LinkedIn", "url": "https://www.linkedin.com/company/siete8.ec"}]', true),
  ('contact', '{"phone": "0999843108", "email": "hola@siete8.com"}', true),
  ('assistant_enabled', 'false', true)
-- The contact row also comes from a migration, which runs before the seed.
on conflict (key) do nothing;

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
  ('¿En qué horario atienden?', 'Todos los días, incluidos feriados, de 07:00 a 20:00. Si escribes fuera de ese horario, atendemos tu solicitud desde las 07:00 del día siguiente.', 3),
  ('¿Qué plan me conviene?', 'Si la usas para facturar todo el año, el de 1 año o más. Los de 7 y 30 días sirven para un trámite puntual.', 4),
  ('¿Me ayudan a instalarla?', 'Sí, si lo necesitas. Te ayudamos a instalarla en el sistema donde facturas o firmas.', 5)
) as v (question, answer, sort_order)
where s.slug = 'firma-electronica'
  and not exists (select 1 from public.service_faq q where q.service_id = s.id);

insert into public.service_holder_note (service_id, holder_type, body)
select s.id, 'legal_entity', 'Los planes de 7 y 30 días no están disponibles.'
from public.service s
where s.slug = 'firma-electronica'
on conflict (service_id, holder_type) do nothing;

-- Portfolio services (E6-01): the migration runs before the seed, when the
-- services do not exist yet.
insert into public.project_service (project_id, service_id)
select p.id, s.id
from (values
  ('bi-de-seguros-y-reporteria-a-entes-de-control', 'analisis-de-datos-bi'),
  ('encuestas-hospitalarias', 'apps-y-desarrollo-a-medida'),
  ('bypass-de-aplicaciones-bi', 'apps-y-desarrollo-a-medida'),
  ('encuestas-a100', 'apps-y-desarrollo-a-medida'),
  ('dwh-y-piloto-de-bi-con-hypercards', 'analisis-de-datos-bi'),
  ('constelaciones-ecuador', 'paginas-web'),
  ('piloto-de-bi-con-hypercards-banca', 'analisis-de-datos-bi'),
  ('figlac', 'paginas-web'),
  ('dwh-y-bi-empresarial', 'analisis-de-datos-bi'),
  ('cg-comercio-exterior', 'landing-page'),
  ('mbs-connection-flower', 'paginas-web'),
  ('banco-de-motos', 'apps-y-desarrollo-a-medida')
) as link (project_slug, service_slug)
join public.project p on p.slug = link.project_slug
join public.service s on s.slug = link.service_slug
on conflict do nothing;

-- First article's service (E6-04): the migration runs before the seed.
insert into public.post_service (post_id, service_id)
select p.id, s.id
from public.post p
join public.service s on s.slug = 'firma-electronica'
where p.slug = 'firma-electronica-en-ecuador'
on conflict do nothing;

-- Pages of the other services (E6-02, docs/COPY.md §16): the migration runs
-- before the seed, when the services do not exist yet. Same guarded blocks.

-- paginas-web -------------------------------------------------------------
update public.service
set summary = $t$Un sitio con diseño propio para que tu negocio se vea profesional y te encuentren en Google.$t$,
    body_md = $t$## Para quién es

Para negocios y profesionales que necesitan presentar sus servicios en internet y recibir contactos por WhatsApp.

## Qué incluye

- **Sitio informativo:** hasta 5 páginas, diseño propio y SEO técnico.
- **Sitio autoadministrable:** hasta 8 páginas, con un panel para editar textos y un blog.
- Botón de WhatsApp y formulario de contacto.
- Se puede sumar: páginas adicionales, catálogo de productos, reservas o citas en línea, otro idioma, redacción de textos, logo e identidad básica y SEO inicial.

## Plazo aproximado

Sitio informativo, de 2 a 3 semanas; autoadministrable, de 3 a 5 semanas. Corre desde que tenemos tus textos e imágenes.$t$,
    closing_title = $t$¿Listo para tu sitio web?$t$,
    seo_title = $t$Páginas web para negocios en Quito | Siete8$t$,
    seo_description = $t$Sitios web con diseño propio, SEO técnico y botón de WhatsApp. Informativos o autoadministrables, con blog. Cotiza por WhatsApp.$t$,
    timeline = $t$De 2 a 5 semanas$t$,
    price_note = $t$Cotización por WhatsApp$t$
where slug = 'paginas-web' and summary is null;

insert into public.service_step (service_id, body, sort_order)
select s.id, v.body, v.sort_order
from public.service s
cross join (values
  ($t$Conversamos. Nos cuentas qué necesitas por WhatsApp o en una llamada. Sin formularios largos.$t$, 1),
  ($t$Te proponemos. Recibes una propuesta con alcance, precio y plazo claros antes de empezar.$t$, 2),
  ($t$Construimos y te acompañamos. Entregamos, te enseñamos a usarlo y seguimos disponibles cuando algo falla.$t$, 3)
) as v (body, sort_order)
where s.slug = 'paginas-web'
  and not exists (select 1 from public.service_step st where st.service_id = s.id);

insert into public.service_faq (service_id, question, answer, sort_order)
select s.id, v.question, v.answer, v.sort_order
from public.service s
cross join (values
  ($t$¿Cuánto cuesta?$t$, $t$Depende de lo que necesites. Cuéntanos tu caso por WhatsApp y te enviamos una propuesta con alcance, precio y plazo antes de empezar.$t$, 1),
  ($t$¿Qué necesito para empezar?$t$, $t$Tu logo, los textos y las fotos de tu negocio. Si no los tienes, podemos redactar los textos y diseñar un logo básico.$t$, 2),
  ($t$¿Puedo cambiar los textos yo mismo?$t$, $t$Sí, si eliges el sitio autoadministrable: incluye un panel para editar textos y publicar en el blog.$t$, 3),
  ($t$¿Incluye el dominio y el hosting?$t$, $t$Se contratan aparte. Mira los planes de hosting y dominios; te ayudamos a configurarlos.$t$, 4)
) as v (question, answer, sort_order)
where s.slug = 'paginas-web'
  and not exists (select 1 from public.service_faq f where f.service_id = s.id);

update public.service s
set related_service_id = r.id,
    cross_sell_text = $t$Tu sitio necesita dónde vivir: el hosting incluye la configuración del dominio y soporte.$t$,
    cross_sell_cta = $t$Ver planes de hosting$t$
from public.service r
where s.slug = 'paginas-web' and r.slug = 'hosting' and s.related_service_id is null;

-- landing-page ------------------------------------------------------------
update public.service
set summary = $t$Una sola página pensada para un objetivo: vender un producto, promocionar un servicio o recibir contactos.$t$,
    body_md = $t$## Para quién es

Para lanzar un producto o una campaña, o para empezar en internet con una página clara y rápida.

## Qué incluye

Una página con secciones, formulario de contacto, botón de WhatsApp y SEO técnico.

## Plazo aproximado

De 7 a 10 días desde que tenemos tus textos e imágenes.$t$,
    closing_title = $t$¿Lanzamos tu landing page?$t$,
    seo_title = $t$Landing page en Quito, lista en 7 a 10 días | Siete8$t$,
    seo_description = $t$Una página con formulario, botón de WhatsApp y SEO técnico para lanzar un producto o una campaña. Cotiza por WhatsApp.$t$,
    timeline = $t$De 7 a 10 días$t$,
    price_note = $t$Cotización por WhatsApp$t$
where slug = 'landing-page' and summary is null;

insert into public.service_step (service_id, body, sort_order)
select s.id, v.body, v.sort_order
from public.service s
cross join (values
  ($t$Conversamos. Nos cuentas qué necesitas por WhatsApp o en una llamada. Sin formularios largos.$t$, 1),
  ($t$Te proponemos. Recibes una propuesta con alcance, precio y plazo claros antes de empezar.$t$, 2),
  ($t$Construimos y te acompañamos. Entregamos, te enseñamos a usarlo y seguimos disponibles cuando algo falla.$t$, 3)
) as v (body, sort_order)
where s.slug = 'landing-page'
  and not exists (select 1 from public.service_step st where st.service_id = s.id);

insert into public.service_faq (service_id, question, answer, sort_order)
select s.id, v.question, v.answer, v.sort_order
from public.service s
cross join (values
  ($t$¿Cuánto cuesta?$t$, $t$Depende de lo que necesites. Cuéntanos tu caso por WhatsApp y te enviamos una propuesta con alcance, precio y plazo antes de empezar.$t$, 1),
  ($t$¿Cuál es la diferencia con un sitio web?$t$, $t$Una landing page es una sola página con un objetivo. Un sitio web tiene varias páginas: servicios, nosotros, contacto y, si quieres, blog.$t$, 2),
  ($t$¿Puedo convertirla en un sitio más grande después?$t$, $t$Sí. Se le pueden sumar páginas cuando tu negocio lo necesite.$t$, 3)
) as v (question, answer, sort_order)
where s.slug = 'landing-page'
  and not exists (select 1 from public.service_faq f where f.service_id = s.id);

update public.service s
set related_service_id = r.id,
    cross_sell_text = $t$Tu sitio necesita dónde vivir: el hosting incluye la configuración del dominio y soporte.$t$,
    cross_sell_cta = $t$Ver planes de hosting$t$
from public.service r
where s.slug = 'landing-page' and r.slug = 'hosting' and s.related_service_id is null;

-- tiendas-virtuales -------------------------------------------------------
update public.service
set summary = $t$Tu catálogo en línea, con carrito y pedidos por WhatsApp. Si lo necesitas, con pagos con tarjeta.$t$,
    body_md = $t$## Para quién es

Para negocios que venden productos y quieren recibir pedidos en línea.

## Qué incluye

- **Tienda o catálogo:** productos, carrito y pedidos por WhatsApp.
- **Con pagos en línea:** integración con Payphone, Kushki o Datafast. La pasarela cobra su propia comisión.
- Se puede sumar la integración con el facturador de Siete8.

## Plazo aproximado

De 4 a 6 semanas para la tienda o catálogo. Con pasarela de pagos, según el alcance.$t$,
    closing_title = $t$¿Empezamos tu tienda?$t$,
    seo_title = $t$Tiendas virtuales en Ecuador con pedidos por WhatsApp | Siete8$t$,
    seo_description = $t$Catálogo en línea con carrito y pedidos por WhatsApp, o con pagos con Payphone, Kushki o Datafast. Cotiza por WhatsApp.$t$,
    timeline = $t$De 4 a 6 semanas$t$,
    price_note = $t$Cotización por WhatsApp$t$
where slug = 'tiendas-virtuales' and summary is null;

insert into public.service_step (service_id, body, sort_order)
select s.id, v.body, v.sort_order
from public.service s
cross join (values
  ($t$Conversamos. Nos cuentas qué necesitas por WhatsApp o en una llamada. Sin formularios largos.$t$, 1),
  ($t$Te proponemos. Recibes una propuesta con alcance, precio y plazo claros antes de empezar.$t$, 2),
  ($t$Construimos y te acompañamos. Entregamos, te enseñamos a usarlo y seguimos disponibles cuando algo falla.$t$, 3)
) as v (body, sort_order)
where s.slug = 'tiendas-virtuales'
  and not exists (select 1 from public.service_step st where st.service_id = s.id);

insert into public.service_faq (service_id, question, answer, sort_order)
select s.id, v.question, v.answer, v.sort_order
from public.service s
cross join (values
  ($t$¿Cuánto cuesta?$t$, $t$Depende de lo que necesites. Cuéntanos tu caso por WhatsApp y te enviamos una propuesta con alcance, precio y plazo antes de empezar.$t$, 1),
  ($t$¿Puedo recibir pagos con tarjeta?$t$, $t$Sí. Integramos Payphone, Kushki o Datafast; cada pasarela cobra una comisión por venta.$t$, 2),
  ($t$¿Quién sube los productos?$t$, $t$Tú, desde el panel de la tienda. Te enseñamos a hacerlo.$t$, 3)
) as v (question, answer, sort_order)
where s.slug = 'tiendas-virtuales'
  and not exists (select 1 from public.service_faq f where f.service_id = s.id);

update public.service s
set related_service_id = r.id,
    cross_sell_text = $t$Tu sitio necesita dónde vivir: el hosting incluye la configuración del dominio y soporte.$t$,
    cross_sell_cta = $t$Ver planes de hosting$t$
from public.service r
where s.slug = 'tiendas-virtuales' and r.slug = 'hosting' and s.related_service_id is null;

-- hosting -----------------------------------------------------------------
update public.service
set summary = $t$Dónde vive tu sitio web y, si lo eliges, tu correo con tu dominio. Con configuración y soporte incluidos.$t$,
    body_md = $t$## Para quién es

Para quien tiene o va a tener un sitio web y quiere que alguien se encargue de dejarlo funcionando.

## Qué incluye

Todos los planes incluyen la configuración del dominio (SPF, DKIM y DMARC), la configuración del correo en el celular y la computadora, y soporte.$t$,
    closing_title = $t$¿Contratamos tu hosting?$t$,
    seo_title = $t$Hosting con correo y soporte en Ecuador | Siete8$t$,
    seo_description = $t$Planes anuales de hosting web con cuentas de correo, configuración del dominio y soporte. Precios con IVA.$t$,
    timeline = null,
    price_note = null
where slug = 'hosting' and summary is null;

insert into public.service_step (service_id, body, sort_order)
select s.id, v.body, v.sort_order
from public.service s
cross join (values
  ($t$Elige tu plan.$t$, 1),
  ($t$Escríbenos por WhatsApp con tu dominio.$t$, 2),
  ($t$Configuramos tu sitio, tu dominio y tu correo, y te ayudamos a instalar el correo en tus equipos.$t$, 3)
) as v (body, sort_order)
where s.slug = 'hosting'
  and not exists (select 1 from public.service_step st where st.service_id = s.id);

insert into public.service_faq (service_id, question, answer, sort_order)
select s.id, v.question, v.answer, v.sort_order
from public.service s
cross join (values
  ($t$¿Puedo agregar más cuentas de correo?$t$, $t$Sí. Cada cuenta adicional tiene su propio precio anual según el espacio: 2, 5, 12 o 25 GB.$t$, 1),
  ($t$¿Qué pasa si mi sitio no lo hizo Siete8?$t$, $t$Elige el plan WordPress si tu sitio es WordPress, o escríbenos y revisamos tu caso.$t$, 2),
  ($t$¿El dominio está incluido?$t$, $t$No. El dominio se contrata aparte; mira la página de dominios.$t$, 3)
) as v (question, answer, sort_order)
where s.slug = 'hosting'
  and not exists (select 1 from public.service_faq f where f.service_id = s.id);

update public.service s
set related_service_id = r.id,
    cross_sell_text = $t$¿Todavía no tienes tu dominio? Lo registramos y lo dejamos listo para tu sitio y tu correo.$t$,
    cross_sell_cta = $t$Ver dominios$t$
from public.service r
where s.slug = 'hosting' and r.slug = 'dominios' and s.related_service_id is null;

update public.plan p
set detail = $t$1 sitio web y 3 cuentas de correo de 5 GB$t$, visible = true
from public.service s
where s.id = p.service_id and s.slug = 'hosting' and p.name = $t$Web Básico$t$ and p.detail is null;

update public.plan p
set detail = $t$1 sitio web y 5 cuentas de correo de 5 GB$t$, visible = true
from public.service s
where s.id = p.service_id and s.slug = 'hosting' and p.name = $t$Web Negocio$t$ and p.detail is null;

update public.plan p
set detail = $t$1 sitio web y 10 cuentas de correo de 12 GB$t$, visible = true
from public.service s
where s.id = p.service_id and s.slug = 'hosting' and p.name = $t$Web Pro$t$ and p.detail is null;

update public.plan p
set detail = $t$Para sitios hechos por Siete8. Sin correo$t$, visible = true
from public.service s
where s.id = p.service_id and s.slug = 'hosting' and p.name = $t$Sitio moderno$t$ and p.detail is null;

update public.plan p
set detail = $t$Para sitios WordPress. Sin correo$t$, visible = true
from public.service s
where s.id = p.service_id and s.slug = 'hosting' and p.name = $t$WordPress$t$ and p.detail is null;

-- correo-corporativo ------------------------------------------------------
update public.service
set summary = $t$Correos con el nombre de tu negocio (tu@tunegocio.com), configurados en tu celular y tu computadora.$t$,
    body_md = $t$## Para quién es

Para negocios que quieren dejar de usar correos gratuitos y escribir a sus clientes con su propio dominio. También si tu sitio está en otro lado o todavía no tienes sitio.

## Qué incluye

La configuración del dominio (SPF, DKIM y DMARC) para que tus correos no lleguen a spam, la configuración en tus equipos y soporte.$t$,
    closing_title = $t$¿Creamos tus correos?$t$,
    seo_title = $t$Correo corporativo con tu dominio en Ecuador | Siete8$t$,
    seo_description = $t$Cuentas de correo con el nombre de tu negocio, configuradas en tu celular y tu computadora. Planes anuales con precios con IVA.$t$,
    timeline = null,
    price_note = null
where slug = 'correo-corporativo' and summary is null;

insert into public.service_step (service_id, body, sort_order)
select s.id, v.body, v.sort_order
from public.service s
cross join (values
  ($t$Elige tu plan y cuántas cuentas necesitas.$t$, 1),
  ($t$Escríbenos por WhatsApp con tu dominio y los nombres de las cuentas.$t$, 2),
  ($t$Creamos tus cuentas y te ayudamos a configurarlas en tus equipos.$t$, 3)
) as v (body, sort_order)
where s.slug = 'correo-corporativo'
  and not exists (select 1 from public.service_step st where st.service_id = s.id);

insert into public.service_faq (service_id, question, answer, sort_order)
select s.id, v.question, v.answer, v.sort_order
from public.service s
cross join (values
  ($t$¿Puedo ampliar el espacio de una cuenta?$t$, $t$Sí. Ampliar cuesta la diferencia entre los dos tamaños.$t$, 1),
  ($t$¿Necesito tener un sitio web?$t$, $t$No. Estos planes son solo de correo. Si también quieres sitio, mira los planes de hosting, que incluyen las dos cosas.$t$, 2),
  ($t$¿Necesito un dominio?$t$, $t$Sí, tus correos llevan tu dominio. Si no lo tienes, lo registramos.$t$, 3)
) as v (question, answer, sort_order)
where s.slug = 'correo-corporativo'
  and not exists (select 1 from public.service_faq f where f.service_id = s.id);

update public.service s
set related_service_id = r.id,
    cross_sell_text = $t$¿Todavía no tienes tu dominio? Lo registramos y lo dejamos listo para tu sitio y tu correo.$t$,
    cross_sell_cta = $t$Ver dominios$t$
from public.service r
where s.slug = 'correo-corporativo' and r.slug = 'dominios' and s.related_service_id is null;

update public.plan p
set detail = $t$1 cuenta de 5 GB$t$, visible = true
from public.service s
where s.id = p.service_id and s.slug = 'correo-corporativo' and p.name = $t$Correo Inicial$t$ and p.detail is null;

update public.plan p
set detail = $t$3 cuentas de 5 GB$t$, visible = true
from public.service s
where s.id = p.service_id and s.slug = 'correo-corporativo' and p.name = $t$Correo Equipo$t$ and p.detail is null;

update public.plan p
set detail = $t$5 cuentas de 5 GB$t$, visible = true
from public.service s
where s.id = p.service_id and s.slug = 'correo-corporativo' and p.name = $t$Correo Negocio$t$ and p.detail is null;

update public.plan p
set detail = $t$10 cuentas de 12 GB$t$, visible = true
from public.service s
where s.id = p.service_id and s.slug = 'correo-corporativo' and p.name = $t$Correo Pro$t$ and p.detail is null;

-- dominios ----------------------------------------------------------------
update public.service
set summary = $t$El nombre de tu negocio en internet (.com, .ec o .com.ec), registrado y configurado para tu sitio y tu correo.$t$,
    body_md = $t$## Para quién es

Para quien va a tener un sitio web o un correo con el nombre de su negocio.

## Qué incluye

El registro anual del dominio y su configuración para tu sitio y tu correo.$t$,
    closing_title = $t$¿Registramos tu dominio?$t$,
    seo_title = $t$Registro de dominios .com, .ec y .com.ec | Siete8$t$,
    seo_description = $t$Registramos tu dominio y lo configuramos para tu sitio y tu correo. Escríbenos por WhatsApp y te confirmamos si está disponible.$t$,
    timeline = null,
    price_note = $t$Según la terminación del dominio$t$
where slug = 'dominios' and summary is null;

insert into public.service_step (service_id, body, sort_order)
select s.id, v.body, v.sort_order
from public.service s
cross join (values
  ($t$Dinos qué nombre quieres.$t$, 1),
  ($t$Revisamos si está disponible y te confirmamos el precio.$t$, 2),
  ($t$Lo registramos a tu nombre y lo configuramos.$t$, 3)
) as v (body, sort_order)
where s.slug = 'dominios'
  and not exists (select 1 from public.service_step st where st.service_id = s.id);

insert into public.service_faq (service_id, question, answer, sort_order)
select s.id, v.question, v.answer, v.sort_order
from public.service s
cross join (values
  ($t$¿Cuánto cuesta?$t$, $t$Depende de la terminación (.com, .ec o .com.ec). Escríbenos y te confirmamos el precio y si el nombre está disponible.$t$, 1),
  ($t$¿Cada cuánto se renueva?$t$, $t$Cada año.$t$, 2)
) as v (question, answer, sort_order)
where s.slug = 'dominios'
  and not exists (select 1 from public.service_faq f where f.service_id = s.id);

update public.service s
set related_service_id = r.id,
    cross_sell_text = $t$Con tu dominio puedes tener correos con el nombre de tu negocio.$t$,
    cross_sell_cta = $t$Ver planes de correo$t$
from public.service r
where s.slug = 'dominios' and r.slug = 'correo-corporativo' and s.related_service_id is null;

-- apps-y-desarrollo-a-medida ----------------------------------------------
update public.service
set summary = $t$Sistemas y aplicaciones web hechos para tu proceso, cuando ya no alcanza con hojas de cálculo.$t$,
    body_md = $t$## Para quién es

Para empresas con procesos propios (pedidos, encuestas, inventarios, reportes) que hoy se manejan a mano o en hojas de cálculo.

## Qué incluye

El análisis de tu proceso, el diseño y el desarrollo de la aplicación, su puesta en marcha y el acompañamiento después de entregarla. Puede integrarse con los sistemas que ya usas.

## Casos

Aplicaciones web de gestión y tabulación de encuestas, integradas con los sistemas de una clínica, y herramientas de administración de aplicaciones de inteligencia de negocio.$t$,
    closing_title = $t$¿Qué proceso quieres resolver?$t$,
    seo_title = $t$Desarrollo de software y apps a medida en Quito | Siete8$t$,
    seo_description = $t$Sistemas y aplicaciones web hechos para tu proceso, integrados con lo que ya usas. Cuéntanos tu caso por WhatsApp.$t$,
    timeline = $t$Según el alcance$t$,
    price_note = $t$Cotización por WhatsApp$t$
where slug = 'apps-y-desarrollo-a-medida' and summary is null;

insert into public.service_step (service_id, body, sort_order)
select s.id, v.body, v.sort_order
from public.service s
cross join (values
  ($t$Conversamos. Nos cuentas qué necesitas por WhatsApp o en una llamada. Sin formularios largos.$t$, 1),
  ($t$Te proponemos. Recibes una propuesta con alcance, precio y plazo claros antes de empezar.$t$, 2),
  ($t$Construimos y te acompañamos. Entregamos, te enseñamos a usarlo y seguimos disponibles cuando algo falla.$t$, 3)
) as v (body, sort_order)
where s.slug = 'apps-y-desarrollo-a-medida'
  and not exists (select 1 from public.service_step st where st.service_id = s.id);

insert into public.service_faq (service_id, question, answer, sort_order)
select s.id, v.question, v.answer, v.sort_order
from public.service s
cross join (values
  ($t$¿Cuánto cuesta?$t$, $t$Depende de lo que necesites. Cuéntanos tu caso por WhatsApp y te enviamos una propuesta con alcance, precio y plazo antes de empezar.$t$, 1),
  ($t$¿Cuánto tarda?$t$, $t$Depende del alcance: el plazo va en la propuesta, antes de empezar.$t$, 2),
  ($t$¿Se puede conectar con mis sistemas?$t$, $t$Sí, en la mayoría de casos. Lo revisamos al conversar tu proyecto.$t$, 3)
) as v (question, answer, sort_order)
where s.slug = 'apps-y-desarrollo-a-medida'
  and not exists (select 1 from public.service_faq f where f.service_id = s.id);

update public.service s
set related_service_id = r.id,
    cross_sell_text = $t$Con tus datos ordenados, puedes tener tableros y reportes para decidir.$t$,
    cross_sell_cta = $t$Ver análisis de datos$t$
from public.service r
where s.slug = 'apps-y-desarrollo-a-medida' and r.slug = 'analisis-de-datos-bi' and s.related_service_id is null;

-- analisis-de-datos-bi ----------------------------------------------------
update public.service
set summary = $t$Tableros y reportes con tus datos, para decidir con información y no a ciegas.$t$,
    body_md = $t$## Para quién es

Para empresas con datos repartidos en varios sistemas que necesitan reportes confiables, también para entes de control.

## Qué incluye

La integración de tus fuentes de datos en un almacén de datos (DWH), los tableros y reportes, y la capacitación para usarlos.

## Casos

Proyectos de DWH e inteligencia de negocio en banca, seguros y salud, incluidos reportes para entidades de control.$t$,
    closing_title = $t$¿Qué te gustaría medir?$t$,
    seo_title = $t$Inteligencia de negocio y análisis de datos en Ecuador | Siete8$t$,
    seo_description = $t$Almacenes de datos, tableros y reportes, con experiencia en banca, seguros y salud. Cuéntanos qué quieres medir.$t$,
    timeline = $t$Según el alcance$t$,
    price_note = $t$Cotización por WhatsApp$t$
where slug = 'analisis-de-datos-bi' and summary is null;

insert into public.service_step (service_id, body, sort_order)
select s.id, v.body, v.sort_order
from public.service s
cross join (values
  ($t$Conversamos. Nos cuentas qué necesitas por WhatsApp o en una llamada. Sin formularios largos.$t$, 1),
  ($t$Te proponemos. Recibes una propuesta con alcance, precio y plazo claros antes de empezar.$t$, 2),
  ($t$Construimos y te acompañamos. Entregamos, te enseñamos a usarlo y seguimos disponibles cuando algo falla.$t$, 3)
) as v (body, sort_order)
where s.slug = 'analisis-de-datos-bi'
  and not exists (select 1 from public.service_step st where st.service_id = s.id);

insert into public.service_faq (service_id, question, answer, sort_order)
select s.id, v.question, v.answer, v.sort_order
from public.service s
cross join (values
  ($t$¿Cuánto cuesta?$t$, $t$Depende de lo que necesites. Cuéntanos tu caso por WhatsApp y te enviamos una propuesta con alcance, precio y plazo antes de empezar.$t$, 1),
  ($t$¿Qué herramientas usan?$t$, $t$Trabajamos con SQL Server, PDI y MicroStrategy, entre otras. Elegimos según tus sistemas y tu presupuesto.$t$, 2),
  ($t$¿Puedo empezar con algo pequeño?$t$, $t$Sí. Podemos empezar con un piloto sobre un área de tu negocio.$t$, 3)
) as v (question, answer, sort_order)
where s.slug = 'analisis-de-datos-bi'
  and not exists (select 1 from public.service_faq f where f.service_id = s.id);

update public.service s
set related_service_id = r.id,
    cross_sell_text = $t$Si tus datos todavía viven en hojas de cálculo, empecemos por un sistema que los ordene.$t$,
    cross_sell_cta = $t$Ver desarrollo a medida$t$
from public.service r
where s.slug = 'analisis-de-datos-bi' and r.slug = 'apps-y-desarrollo-a-medida' and s.related_service_id is null;

-- soporte-tecnico ---------------------------------------------------------
update public.service
set summary = $t$Ayuda con tus equipos, programas y correo: remota en todo el país y presencial en Quito.$t$,
    body_md = $t$## Para quién es

Para negocios y personas que necesitan resolver un problema técnico sin tener un área de sistemas.

## Qué incluye

Soporte remoto en todo el Ecuador y presencial solo en Quito. Se cobra por hora.$t$,
    closing_title = null,
    seo_title = $t$Soporte técnico remoto y en Quito | Siete8$t$,
    seo_description = $t$Ayuda con tus equipos, programas y correo, remota en todo el Ecuador y presencial en Quito. Escríbenos por WhatsApp.$t$,
    timeline = null,
    price_note = $t$Por hora$t$
where slug = 'soporte-tecnico' and summary is null;

insert into public.service_step (service_id, body, sort_order)
select s.id, v.body, v.sort_order
from public.service s
cross join (values
  ($t$Cuéntanos el problema por WhatsApp.$t$, 1),
  ($t$Te decimos si lo resolvemos de forma remota o con una visita, y cuánto tiempo calculamos.$t$, 2),
  ($t$Lo resolvemos y te explicamos qué pasó.$t$, 3)
) as v (body, sort_order)
where s.slug = 'soporte-tecnico'
  and not exists (select 1 from public.service_step st where st.service_id = s.id);

insert into public.service_faq (service_id, question, answer, sort_order)
select s.id, v.question, v.answer, v.sort_order
from public.service s
cross join (values
  ($t$¿Cuánto cuesta?$t$, $t$Se cobra por hora. Escríbenos y te confirmamos la tarifa y cuánto tiempo calculamos para tu caso.$t$, 1),
  ($t$¿Atienden fuera de Quito?$t$, $t$Sí, de forma remota en todo el país. Las visitas presenciales son solo en Quito.$t$, 2)
) as v (question, answer, sort_order)
where s.slug = 'soporte-tecnico'
  and not exists (select 1 from public.service_faq f where f.service_id = s.id);

