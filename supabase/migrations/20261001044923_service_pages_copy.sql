-- E6-02: page texts of the other nine visible services (docs/COPY.md §16,
-- draft to approve) and what each hosting and email plan includes. Every
-- block only fills what is still empty, so edits made in the panel are kept.
-- The hosting and email plans become visible with their annex E prices,
-- which the admin confirms or corrects in the panel.

-- Key facts in the hero of a service page: timeline and how the price works.
alter table public.service
  add column timeline text check (timeline is null or length(trim(timeline)) between 1 and 60),
  add column price_note text check (price_note is null or length(trim(price_note)) between 1 and 60);

-- What a plan includes, shown under its name in the plan cards.
alter table public.plan
  add column detail text check (detail is null or length(trim(detail)) between 1 and 200);

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

