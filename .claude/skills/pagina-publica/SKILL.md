---
name: pagina-publica
description: Checklist para crear o cambiar una página pública del sitio (grupo (sitio)) con layout, pisos, cierre, metadata, datos estructurados y sitemap. Úsalo al agregar una ruta pública o rehacer una existente.
argument-hint: <ruta, por ejemplo /servicios/firma-electronica>
---

# Página pública: $ARGUMENTS

Lee antes `.claude/rules/sitio-publico.md` y `.claude/rules/diseno.md`.

## Construcción

- [ ] La página vive en `src/app/(sitio)/...` (salvo páginas sin menú ni pie, como `/enlaces`). No renderiza su propio `<main>`: el layout ya pone `<main id="contenido">`.
- [ ] Server Component; los datos se leen desde `src/server/` con `createPublicClient()`. Nada de `cache: "no-store"`.
- [ ] Cada sección es un `Floor`; las secciones sin contenido no se renderizan y los pisos se alternan sobre las que quedan.
- [ ] Termina con `<Closing />` (o el cierre propio del servicio con `service.closing_title`).
- [ ] Textos visibles de `docs/COPY.md` o de la base si el panel los edita. Nada inventado; si falta, `[COPY PENDIENTE: ...]`.
- [ ] Solo componentes base (`Button`, `TextLink`, `PlanTable`, `PlanGrid`, `Tabs`, `Faq`, `FormField`), tokens semánticos y clases de tipografía.
- [ ] Precios con `formatPriceWithVat`; enlaces de WhatsApp con `@/lib/whatsapp` y datos de contacto con `getSiteSettings`.

## SEO

- [ ] `export const metadata` (o `generateMetadata`) armado con `pageMetadata` de `@/lib/metadata`: title, description, canonical y Open Graph. Nunca un `openGraph` suelto.
- [ ] Datos estructurados de `@/lib/structured-data` insertados con `JsonLd`, si aplica.
- [ ] Ruta agregada a `src/app/sitemap.ts`.
- [ ] Si debe aparecer en el menú o el pie, revisar `navLinks` y `getPublishedSections`.

## Revisión

- [ ] Pruebas unitarias para cualquier función nueva de `src/lib/`.
- [ ] Revisión visual a 360 px y 1440 px, con teclado y `prefers-reduced-motion` (agente `ui-checker`).
- [ ] Skill `verificar` antes de dar la tarea por terminada.
