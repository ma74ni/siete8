---
paths:
  - "src/app/(sitio)/**"
  - "src/app/enlaces/**"
  - "src/app/sitemap.ts"
  - "src/app/robots.ts"
  - "src/components/sitio/**"
  - "src/lib/metadata.ts"
  - "src/lib/structured-data.ts"
  - "src/lib/service-page.ts"
  - "src/lib/menu.ts"
  - "src/server/catalog.ts"
  - "src/server/published.ts"
  - "src/server/portfolio.ts"
  - "src/server/links.ts"
---

# Sitio público: páginas, secciones y SEO

## Estructura de páginas

- Las páginas públicas viven en el grupo `src/app/(sitio)/`, cuyo layout pone encabezado, pie y botón flotante, y ya envuelve el contenido en `<main id="contenido">`: las páginas no renderizan su propio `<main>`. El menú Servicios se lee de la base (`getServiceMenu`), así que la visibilidad y el orden se controlan desde el panel.
- Proyectos y Blog aparecen en el menú y el pie solo si hay algo publicado (`getPublishedSections` y `navLinks`).
- Cada sección de página es un `Floor` (piso `paper`/`mist` con el espaciado de DESIGN §5). Una sección sin contenido (sin proyectos, sin artículos) no se renderiza, y los pisos se alternan sobre las que quedan. Las tarjetas de portafolio usan `ProjectCard` y las etiquetas de estado de `@/lib/project-status`.
- Cada página pública termina con `<Closing />` (cierre sobre `ink`, justo antes del pie); el pie del layout solo tiene contacto, enlaces y redes. La página de un servicio usa su propio cierre (`service.closing_title`).
- Los textos de la página de un servicio viven en la base, no en el código, para que el panel los edite: `service.summary` (párrafo del hero), `body_md` (para quién es, qué incluye y plazo, en Markdown con la variante `checklist`), `timeline` y `price_note` (datos del hero), `plan.detail` (qué incluye cada plan), `requirements_intro`, `cross_sell_text`/`cross_sell_cta` con `related_service_id`, `closing_title`, `seo_title`/`seo_description`, y las tablas `service_step`, `service_faq` y `service_holder_note` (aviso bajo los planes de un tipo de titular, como el de representante legal). Las secciones sin datos no se renderizan.
- `/enlaces` (`src/app/enlaces/page.tsx`, fuera de `(sitio)`: sin menú ni pie) es la página para la biografía de las redes. Sus botones viven en `link_button` (tipo `url`, `whatsapp` con el número de la configuración, o `latest_post`) y se editan en el panel (Enlaces).
- No se usa `cache: "no-store"` en el cliente público porque vuelve dinámicas las páginas.

## SEO

- Las páginas públicas se generan estáticamente o en servidor; el HTML trae el contenido completo.
- Cada página pública define title, description, canonical y Open Graph.
- El metadata de cada página se arma con `pageMetadata` de `@/lib/metadata`, que repite el `openGraph` completo con la imagen `public/og.png`: Next combina los segmentos de forma superficial, así que un `openGraph` suelto borra la imagen de la raíz.
- Los datos estructurados salen de `@/lib/structured-data` y se insertan con `JsonLd`. `sitemap.ts` lista las páginas estáticas y los servicios visibles; al crear una página pública, se agrega ahí.

## Datos de contacto actuales

Viven en la configuración del sitio (panel > Configuración), nunca en el código. Valores actuales, solo como referencia:

- WhatsApp comercial: 0967155626 (en `wa.me`: 593967155626). Atención de 07:00 a 20:00.
- Teléfono: 0999843108. Correo: hola@siete8.com.
- Redes: facebook.com/siete8.ec, instagram.com/siete8.ec, linkedin.com/company/siete8.ec.
