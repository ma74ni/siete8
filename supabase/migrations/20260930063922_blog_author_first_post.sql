-- E4-05, E6-04: the author's name is shown on each article (RF-BLG-02).
-- `profile` is private (RLS), so the name the site shows lives on the post.
alter table public.post
  add column author_name text
    check (author_name is null or length(trim(author_name)) > 0);

-- First article (E6-04, COPY §3), as a draft for the admin to review and
-- publish from the panel. Only claims verified in COPY §5 and texts of
-- COPY §4; no prices, because they are edited in the panel and would go stale.
-- Runs once: an article whose slug already exists is left untouched.
insert into public.post (title, slug, excerpt, body_md, status, seo_title, seo_description)
values (
  'Firma electrónica en Ecuador: qué es, para qué sirve y cómo obtenerla',
  'firma-electronica-en-ecuador',
  'Todo lo que necesitas saber antes de sacar tu firma: tipos, vigencias, requisitos y en qué trámites la vas a usar.',
  $md$Si vas a facturar en el SRI, firmar un contrato a distancia o hacer un trámite en línea, tarde o temprano te van a pedir una firma electrónica. Aquí te contamos qué es, para qué sirve y cómo sacarla sin salir de tu casa.

## Qué es la firma electrónica

Es tu firma en formato digital. Te identifica cuando firmas un documento en la computadora o en el celular, y tiene la misma validez legal que tu firma a mano, según la Ley de Comercio Electrónico, Firmas Electrónicas y Mensajes de Datos.

La recibes como un archivo **.p12**, protegido con una clave que solo tú conoces. Ese archivo es el que instalas en tu computadora o cargas en tu sistema de facturación.

## Para qué sirve

- **Facturar en el SRI.** Para emitir facturas electrónicas necesitas firmarlas con tu firma electrónica.
- **Firmar contratos y documentos digitales**, sin imprimir ni escanear.
- **Hacer trámites en línea** con entidades públicas y privadas.

## Persona natural o representante legal

Hay dos tipos de firma, según quién firma:

- **Persona natural:** es tu firma personal. La usas para tus propios trámites y, si tienes RUC, para facturar a tu nombre.
- **Representante legal:** es la firma de quien representa a una empresa. La usas para firmar y facturar en nombre de la empresa.

## Cuánto tiempo dura

Eliges la vigencia al sacarla. Para una persona natural hay planes de 7 días, 30 días y de 1 a 5 años; para un representante legal, de 1 a 5 años.

- Si la usas para **facturar todo el año**, te conviene el plan de 1 año o más.
- Los planes de **7 y 30 días** sirven para un trámite puntual.

Los precios de cada plan, con IVA incluido, están en la [página de la firma electrónica](/servicios/firma-electronica#planes).

## Qué necesitas

Tenlo listo antes de empezar y tu firma sale en minutos. Las fotos deben ser nítidas, sin gafas, gorra ni mascarilla.

**Persona natural**

- Fotos de tu cédula vigente, por ambos lados (no copias).
- Una foto de medio cuerpo sosteniendo tu cédula a la altura del mentón.
- RUC activo en PDF, si vas a facturar electrónicamente.
- Un correo al que tengas acceso y con espacio libre.
- Un celular activo, con buena señal, para recibir el código de activación.

**Representante legal**

- Fotos de tu cédula vigente, por ambos lados.
- Una foto de medio cuerpo sosteniendo tu cédula a la altura del mentón.
- RUC activo de la empresa, en PDF o copia de las dos hojas.
- Nombramiento vigente, con carta de aceptación y razón de inscripción en el Registro Mercantil.
- Constitución notariada con razón de inscripción, o estatutos si la empresa no está bajo la Superintendencia de Compañías.
- Un correo y un celular activos.

## Cómo obtenerla con Siete8

1. **Elige tu plan:** persona natural o representante legal, y cuántos años de vigencia.
2. **Envíanos tus requisitos por WhatsApp.** No hace falta ir a ninguna oficina.
3. **Recibe tu firma** entre 5 y 10 minutos después de validar tus datos. Atendemos todos los días, incluidos feriados, de 07:00 a 20:00.

Si lo necesitas, te ayudamos a instalarla en el sistema donde facturas o firmas.

¿Listo para sacar tu firma? Mira los planes y solicítala en la [página de la firma electrónica](/servicios/firma-electronica).
$md$,
  'draft',
  'Firma electrónica en Ecuador: qué es y cómo obtenerla | Siete8',
  'Qué es la firma electrónica, para qué sirve, qué tipos y vigencias hay, qué requisitos necesitas y cómo sacarla por WhatsApp.'
)
on conflict (slug) do nothing;

-- Related service (RF-BLG-03). For databases seeded before this migration;
-- the seed links it too.
insert into public.post_service (post_id, service_id)
select p.id, s.id
from public.post p
join public.service s on s.slug = 'firma-electronica'
where p.slug = 'firma-electronica-en-ecuador'
on conflict do nothing;
