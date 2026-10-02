# CLAUDE.md — Sitio web Siete8

Sitio público, blog, portafolio y panel de administración de Siete8, estudio tecnológico de Quito. Este archivo manda sobre cualquier suposición: léelo completo al empezar cada sesión.

@AGENTS.md

## Estado del repositorio

Este repo está conectado a Netlify: cada push a `master` despliega a producción. Antes tenía el sitio anterior en Vue 2; el sitio nuevo en Next.js lo **reemplaza por completo en este mismo repo** (el código Vue se eliminó en E0-01 y solo queda en el historial de git).

- `dev` es la rama de integración: todas las tareas se fusionan ahí. `master` solo recibe un PR desde `dev` cuando se quiere desplegar a producción; nunca se hace commit directo a `master`.
- La configuración de build de Netlify se declara en `netlify.toml`, no en la interfaz de Netlify. El adaptador `@netlify/plugin-nextjs` va declarado ahí y fijado en `package.json`, y necesita `publish = ".next"`; sin él Netlify publica la carpeta `.next` como estática y todo da 404.
- En la interfaz de Netlify, la versión de Node debe ser 22 (Dependency management): los plugins de build usan esa versión, no la del `netlify.toml`.
- `dev` y `master` exigen dos checks para fusionar: `CI` y `netlify/siete8/deploy-preview`.
- `public/ce24dd8215336358aaaadd8607c5a049.txt` es la verificación de dominio de Mailjet del sitio anterior. No se borra sin confirmarlo con el usuario.

## Documentos del proyecto

| Archivo | Para qué |
| --- | --- |
| `docs/TAREAS.md` | Plan de trabajo. Solo se trabaja en la tarea indicada por el usuario. |
| `docs/SRS.md` | Requisitos funcionales (RF-*) y no funcionales (RNF-*), modelo de datos, anexos con datos semilla. |
| `docs/COPY.md` | Única fuente de textos visibles. |
| `docs/DESIGN.md` | Sistema de diseño: tokens, tipografía, componentes, motivo del logo. |
| `docs/mockups/` | Referencia visual. Si contradice a COPY.md o DESIGN.md, ganan ellos. |
| `docs/brand/` | Logo oficial y colores. |
| `docs/data/portafolio-anterior.json` | Fuente de la importación del portafolio (E6-01). |

Las rutas de esta tabla son relativas a la raíz del repo.

## Stack

- Next.js 16 (App Router) con TypeScript estricto (`strict`, `noUncheckedIndexedAccess`), pnpm y Node 22. Next 16 cambia APIs respecto a versiones anteriores: consulta `node_modules/next/dist/docs/` antes de usar una API (ver `AGENTS.md`).
- Tailwind CSS con los tokens de `docs/DESIGN.md` como variables CSS. Panel con shadcn/ui.
- Supabase: Postgres, Auth, Storage, con las claves nuevas (publishable y secret). Migraciones con Supabase CLI (devDependency, se usa con `pnpm exec supabase`) en `supabase/migrations`.
- Zod para validar entradas y variables de entorno.
- ESLint (config de Next) y Prettier (con orden de clases de Tailwind).
- Vitest para pruebas unitarias (`src/**/*.test.ts(x)`); Playwright para extremo a extremo (aún no instalado).
- Despliegue en Netlify con el adaptador oficial de Next.js.

## Comandos

```
pnpm dev          # servidor local
pnpm build        # build de producción
pnpm typecheck    # genera tipos de rutas (next typegen) y corre tsc --noEmit
pnpm lint         # ESLint
pnpm test         # Vitest
pnpm format       # Prettier (format:check para solo verificar)
pnpm db:start     # levanta Supabase local en Docker
pnpm db:stop      # lo apaga
pnpm db:reset     # recrea la base local desde las migraciones y la semilla
pnpm db:migration <nombre>  # crea una migración nueva en supabase/migrations (sin terminal interactiva, agrega `< /dev/null`: si no, espera el SQL por stdin)
pnpm db:status    # URLs y claves de la instancia local
pnpm db:test      # pruebas pgTAP de supabase/tests contra la base local
pnpm db:types     # regenera src/lib/database.types.ts desde la base local (después de cada migración)
```

## Forma de trabajar

1. Trabaja solo en la tarea que el usuario indique (por ejemplo, E3-03). Lee su fila en `docs/TAREAS.md` y los requisitos que cita en `docs/SRS.md`.
2. Antes de escribir código, propón un plan corto en pasos y espera aprobación.
3. No toques archivos fuera del alcance de la tarea. Si algo fuera del alcance está roto, avísalo en vez de arreglarlo.
4. Al terminar, verifica la definición de terminado y resume qué cambió y cómo probarlo.
5. Una tarea por rama: `feat/<id>-<nombre-corto>`, creada desde `dev` y fusionada de vuelta a `dev`. Para desplegar se abre un PR de `dev` a `master` (producción en Netlify).

## Definición de terminado

- Cumple los criterios de aceptación de la tarea.
- `pnpm typecheck`, `pnpm lint` y `pnpm test` pasan sin errores, y los checks del PR están en verde (`CI`, `Database` y el preview de Netlify).
- Textos tomados de `docs/COPY.md`.
- Estilos solo con tokens de `docs/DESIGN.md`.
- Revisado a 360 px y 1440 px, con teclado y con `prefers-reduced-motion`.
- Sin secretos en el código.

## Reglas que no se rompen

**Contenido**
- Nunca inventes textos visibles, precios, plazos, afirmaciones legales ni de certificación. Si falta un texto, usa el marcador `[COPY PENDIENTE: descripción]` y avísalo.
- No menciones en el sitio a la entidad que emite las firmas: ni a Click Identy (proveedor con el que se gestionan) ni a la entidad acreditada que las respalda. Tampoco uses las frases prohibidas de `docs/COPY.md` (sección "No usar").
- Todo el sitio está en español de Ecuador, con tuteo. El código, nombres de variables y commits van en inglés.

**Datos y precios**
- Los precios se guardan sin IVA (`price_without_vat`) junto con `vat_rate`. El sitio siempre muestra el total con IVA: `round(price * (1 + vat_rate), 2)`, con coma decimal (`$20,69`). El cálculo se hace en una sola función compartida, en centavos enteros, para evitar errores de coma flotante; ningún componente calcula el IVA por su cuenta.
- El sitio y cualquier formulario nunca piden ni guardan documentos de identidad. Esos se envían por WhatsApp.
- Un lead no se guarda sin consentimiento (`consent_at`).
- Formulario de contacto (E3-08): `submitLead` en `src/server/leads.ts` valida en este orden: honeypot (`website`), Turnstile, esquema `leadForm` de `@/lib/contact-form` (consentimiento incluido) y un límite de 3 envíos por celular o correo cada 10 minutos; solo entonces inserta con `createAdminClient()`, y avisa por Resend a `ADMIN_NOTIFICATION_EMAIL`. El celular se guarda normalizado (sin espacios ni guiones). Tras un error devuelve lo escrito, porque React vacía el formulario. El historial de estados del lead lo escribe el trigger `record_lead_status` en `lead_status_event`. `CampaignCapture` guarda los UTM de la página de llegada para GA y para el lead.

**Seguridad**
- Row Level Security en todas las tablas. Lectura anónima solo de lo publicado y visible.
- La clave secreta de Supabase (`SUPABASE_SECRET_KEY`) y la de Anthropic solo existen en código de servidor. Nunca en componentes cliente ni en variables `NEXT_PUBLIC_*`.
- Toda escritura del panel se valida con Zod en el servidor y verifica el rol admin.
- Panel: los esquemas de formulario viven en `@/lib/admin-forms` (con pruebas); las lecturas en `src/server/admin-catalog.ts` y las Server Actions en `src/server/admin-catalog-actions.ts`, que escriben con `createSessionClient()` (RLS de admin) y terminan con `revalidatePath("/", "layout")`, así el cambio se ve en el sitio sin desplegar. Los formularios usan `ActionForm` (mensaje con el mismo verbo del botón) y `DeleteButton` (confirmación en línea). El panel usa los componentes del sitio y la clase `.panel` (títulos en `wdth` 100, DESIGN §12); shadcn/ui queda para cuando crezca.
- El panel (`/admin`) se protege en dos capas: `src/proxy.ts` (el middleware de Next 16) redirige al login sin sesión y responde 403 sin rol admin; además, el layout del panel y **toda** Server Action del panel llaman primero a `requireAdmin()` (`@/server/auth`). Los registros públicos de Supabase Auth están cerrados; las cuentas del panel se crean a mano.
- Las políticas de RLS viven en migraciones y se prueban en `supabase/tests/rls_test.sql` como anónimo, usuario sin rol y admin. Toda tabla nueva agrega su política de lectura pública (si aplica), la de admin (`public.is_admin()`) y sus pruebas.
- `anon` no tiene permisos de escritura en ninguna tabla. Los leads se insertan desde el servidor con la clave secreta, después de validar Turnstile y el consentimiento; nunca con una política de inserción anónima.
- El rol admin se asigna solo por SQL; no existe política de escritura sobre `profile`.

**Diseño**
- Mobile-first. Contraste WCAG 2.1 AA: los naranjas y amarillos de marca nunca van como texto sobre fondo blanco.
- El motivo del logo (7 = `111`, tres barras; 8 = `1000`, un módulo sólido y tres huecos) se reproduce con la geometría de `docs/DESIGN.md`, nunca deformado. Sus coordenadas salen de `docs/brand/logo.ai` y viven solo en `src/components/sitio/motif/motif-geometry.ts`; se usan `HeroMotif` (en la portada, animado; en cada servicio, con `still` y la categoría en `active`), `CategoryDivider` y `ReadingProgress`, nunca un SVG dibujado a mano.
- Sin etiquetas en mayúsculas sobre títulos, sin separadores con punto medio, sin fuente monoespaciada en la interfaz pública.
- Una sola animación automática: el hero de la portada.
- Los tokens viven en `src/app/globals.css`, único archivo de `src/` con colores literales. Los componentes usan los colores semánticos (`bg`, `surface`, `fg`, `fg-muted`, `accent`, `action`, `action-hover`, `on-action`, `border`, `focus`), que ya cambian con el modo oscuro: no se usa `dark:` salvo excepción. La paleta de Tailwind está desactivada. El texto secundario (`fg-muted`) no va sobre `surface` (no pasa AA); ahí se usa `fg`. `src/app/design-tokens.test.ts` verifica contraste, colores literales y esa regla.
- Tipografía: `text-display`, `text-h2`, `text-h3`, `text-h4`, `text-body` y `text-small`, fluidas entre 360 y 1440 px. `h1`–`h4` ya traen ancho, peso y tamaño por defecto.
- Componentes base en `src/components/sitio/`: `Button` (principal o secundario, como botón o enlace), `TextLink`, `PlanTable` (portada), `PlanGrid` (página de cada servicio), `Tabs`, `Faq` y `FormField`. No se escriben estilos de botón, tabla de planes ni campo a mano. Muestra en `/dev/ui` (con `pnpm dev` y en los previews; 404 en producción).
- Los precios se muestran solo con `formatPriceWithVat` de `@/lib/price` (o `PlanTable` y `PlanGrid`, que la usan).
- Los enlaces de WhatsApp se arman solo con `@/lib/whatsapp` (`whatsappUrl(mensaje, waMe)` y los mensajes de COPY §2); nunca se escribe un `wa.me` a mano. El número, el horario, el teléfono, el correo y las redes salen de la configuración del sitio (`getSiteSettings` de `src/server/site-settings.ts`, E4-08), que se edita en el panel (Configuración); nunca se escriben en el código. Los valores de respaldo, si falta una fila, están en `DEFAULT_SETTINGS` de `@/lib/site-settings`. La imagen `public/og.png` no lleva el número, para que no quede vieja.
- Las páginas públicas viven en el grupo `src/app/(sitio)/`, cuyo layout pone encabezado, pie y botón flotante, y ya envuelve el contenido en `<main id="contenido">`: las páginas no renderizan su propio `<main>`. El menú Servicios se lee de la base (`getServiceMenu`), así que la visibilidad y el orden se controlan desde el panel.
- Texto en Markdown escrito en el panel (proyectos, artículos): siempre con `Markdown` (`@/components/sitio/markdown`, react-markdown sin HTML crudo), nunca con `dangerouslySetInnerHTML`.
- Proyectos y Blog aparecen en el menú y el pie solo si hay algo publicado (`getPublishedSections` y `navLinks`).
- `/enlaces` (`src/app/enlaces/page.tsx`, fuera de `(sitio)`: sin menú ni pie) es la página para la biografía de las redes. Sus botones viven en `link_button` (tipo `url`, `whatsapp` con el número de la configuración, o `latest_post`) y se editan en el panel (Enlaces).
- Redes sociales: `netlify/functions/announce-posts.mts` corre cada 15 minutos (solo en producción) y envía al webhook de Make (`MAKE_WEBHOOK_URL`) cada artículo publicado, con fecha pasada y `post.social_sent_at` nulo; después lo marca. La lógica está en `@/lib/announce` (con pruebas) y usa la clave secreta por REST, como tarea del sistema. La portada va como JPEG por `/.netlify/images` (Instagram no acepta WebP), por eso `netlify.toml` permite las imágenes de Storage. Los pasos de Make están en `docs/MAKE.md`. `/blog/rss.xml` (`@/lib/rss`) queda para lectores de RSS.
- Blog: fechas en hora de Quito con `@/lib/blog` (`formatPostDate`, `toQuitoInput`, `fromQuitoInput`); el autor visible es `post.author_name` (o "Siete8"), porque `profile` es privado. El layout de `(sitio)` tiene `revalidate = 3600`: un artículo programado aparece en su fecha con un margen de una hora como máximo, sin que nadie guarde en el panel.
- Imágenes del panel: `uploadImage`/`removeImage` de `src/server/admin-action-helpers.ts`, validadas con `imageFile`. En el navegador, `ImageField` (`@/components/admin/image-field`) decodifica el archivo y, si pesa más de 2 MB o no es de un tipo aceptado, lo reduce a WebP (lado mayor 2400 px) antes de enviarlo: así nunca se pasa del límite de 3 MB de las Server Actions. Las de galería exigen texto alternativo; las portadas son decorativas (el título va al lado). `images.dangerouslyAllowLocalIP` solo se activa cuando Supabase corre en local.
- Cada sección de página es un `Floor` (piso `paper`/`mist` con el espaciado de DESIGN §5). Una sección sin contenido (sin proyectos, sin artículos) no se renderiza, y los pisos se alternan sobre las que quedan. Las tarjetas de portafolio usan `ProjectCard` y las etiquetas de estado de `@/lib/project-status`.
- Cada página pública termina con `<Closing />` (cierre sobre `ink`, justo antes del pie); el pie del layout solo tiene contacto, enlaces y redes. La página de un servicio usa su propio cierre (`service.closing_title`).
- Los textos de la página de un servicio viven en la base, no en el código, para que el panel los edite: `service.summary` (párrafo del hero), `body_md` (para quién es, qué incluye y plazo, en Markdown con la variante `checklist`), `timeline` y `price_note` (datos del hero), `plan.detail` (qué incluye cada plan), `requirements_intro`, `cross_sell_text`/`cross_sell_cta` con `related_service_id`, `closing_title`, `seo_title`/`seo_description`, y las tablas `service_step`, `service_faq` y `service_holder_note` (aviso bajo los planes de un tipo de titular, como el de representante legal). Las secciones sin datos no se renderizan.
- `pnpm build` borra `.next/cache/fetch-cache` antes de compilar: Next reutiliza ahí las respuestas de Supabase entre builds (y Netlify conserva `.next/cache`), lo que dejaría precios o menús viejos. No se usa `cache: "no-store"` en el cliente público porque vuelve dinámicas las páginas.
- Una sección sobre fondo `ink` usa la clase `.on-ink`, que ajusta los tokens semánticos para mantener el contraste.
- El logo es el componente `Logo` (de `docs/brand/logo_horizontal.svg`); no se usa como imagen.

**SEO**
- Las páginas públicas se generan estáticamente o en servidor; el HTML trae el contenido completo.
- Cada página pública define title, description, canonical y Open Graph.
- El metadata de cada página se arma con `pageMetadata` de `@/lib/metadata`, que repite el `openGraph` completo con la imagen `public/og.png`: Next combina los segmentos de forma superficial, así que un `openGraph` suelto borra la imagen de la raíz.
- Los datos estructurados salen de `@/lib/structured-data` y se insertan con `JsonLd`. `sitemap.ts` lista las páginas estáticas y los servicios visibles; al crear una página pública, se agrega ahí.

## Datos del negocio

- WhatsApp comercial: 0967155626 (en `wa.me`: 593967155626). Atención de 07:00 a 20:00. Se cambian en el panel (Configuración); estos son los valores actuales.
- Teléfono: 0999843108.
- Correo: hola@siete8.com. Dominio: siete8.com, registrado en Namecheap, con el DNS en **Netlify DNS** (NS1): los registros se agregan en Netlify > Domains, no en Namecheap. El correo vive en DreamHost y sus registros de la raíz (MX, SPF, DKIM y DMARC) no se tocan. Resend usa solo `resend._domainkey` (TXT), `send` y `rsend` (CNAME).
- Redes: facebook.com/siete8.ec, instagram.com/siete8.ec, linkedin.com/company/siete8.ec.

## Variables de entorno

Se validan con Zod al arrancar: `next.config.ts` importa `src/env/schema.ts`, así que `pnpm dev`, `pnpm build` y `pnpm start` fallan si falta una variable exigida. Para desarrollo local, copia `.env.example` a `.env.local`.

- En el código se usan solo `serverEnv` (`@/env/server`) y `clientEnv` (`@/env/client`). Nunca se lee `process.env` fuera de `src/env/`, `next.config.ts` y `netlify/functions/` (corren fuera de Next; validan con los esquemas de `src/env/schema.ts`).
- `netlify/functions/keep-alive.mts` hace una lectura pública diaria para que Supabase no pause el proyecto gratuito (E7-04). Su registro está en Netlify, en Logs > Functions.
- `@/env/server` importa `server-only`: si un componente cliente lo importa, el build falla. Los secretos van solo ahí.
- `@/env/client` solo tiene variables `NEXT_PUBLIC_*`, leídas por su nombre completo para que Next las incruste en el build.
- Cada tarea que integra un servicio agrega sus variables al esquema y a `.env.example`. No se declaran antes de usarse.
- En Netlify, si `NEXT_PUBLIC_SITE_URL` no está definida, se usa la URL del despliegue (`URL` en producción, `DEPLOY_PRIME_URL` en vistas previas).

| Variable | Tipo | Se agrega en |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | pública | E0-03 (exigida) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | pública | E1-06 |
| `SUPABASE_SECRET_KEY` | secreta | E1-06 |
| `RESEND_API_KEY`, `ADMIN_NOTIFICATION_EMAIL`, `TURNSTILE_SECRET_KEY` | secreta, opcional | E3-08 (sin Turnstile no se muestra el formulario; sin Resend se guarda el lead pero no llega el correo) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | pública | E3-08 |
| `REVALIDATE_SECRET` | secreta | primera ruta de revalidación bajo demanda |
| `NEXT_PUBLIC_GA_ID` | pública, opcional | E5-04 (solo producción, en `netlify.toml`) |
| `MAKE_WEBHOOK_URL` | secreta, solo en Netlify (producción) | redes sociales (`docs/MAKE.md`) |
| `NEXT_PUBLIC_SENTRY_DSN` | pública | E7-06 |
| `SENTRY_AUTH_TOKEN` | secreta (solo build, source maps) | E7-06 |

La analítica es GA4: `NEXT_PUBLIC_GA_ID` (pública, opcional) solo se define para producción en `netlify.toml`, así que los previews y el entorno local no envían nada. GA4 solo se carga en el dominio del sitio (`NEXT_PUBLIC_SITE_URL`, con `isSiteOrigin`) y después de que el visitante acepta el aviso de cookies (`@/components/sitio/analytics`); los clics a WhatsApp se registran como `whatsapp_click`. `ANTHROPIC_API_KEY` (secreta) se agrega recién en la fase 1.1 (asistente).

## Base de datos

- `.env.local` apunta al proyecto **remoto** de Supabase. La base local (Docker) solo se usa para probar migraciones con `pnpm db:reset`.
- Cada tabla nueva activa Row Level Security en la misma migración que la crea, aunque sus políticas lleguen después.
- Las restricciones de datos (precios, slugs, estados) van también en la base con `check`, y se prueban con pgTAP en `supabase/tests/`.
- Todo cambio de esquema es una migración nueva en `supabase/migrations` creada con `pnpm db:migration`. Nunca se edita una migración ya fusionada ni se cambia el esquema desde el panel de Supabase.
- Después de cada migración, `pnpm db:reset` y `pnpm db:types`, y se sube `src/lib/database.types.ts` con la migración. CI falla si los tipos no coinciden con el esquema.
- Clientes de Supabase en `src/server/supabase/`: `createPublicClient()` (clave publishable, sin sesión, sujeto a RLS) para lecturas públicas, `createSessionClient()` (cookies del usuario conectado, sujeto a RLS) para el panel, `createProxyClient()` solo para `src/proxy.ts`, y `createAdminClient()` (clave secreta, salta RLS) solo después de validar con Zod y verificar permisos. Ningún componente cliente importa `@/server/*` ni `@supabase/*`; lo verifica `src/server/client-boundary.test.ts`.
- Imágenes en el bucket público `images` de Storage, solo en `posts/` y `projects/`: JPEG, PNG, WebP o AVIF (sin SVG), hasta 2 MB. Se leen por URL pública; solo admin escribe. Sus políticas se prueban en `supabase/tests/storage_test.sql`.
- `pnpm db:reset` solo actúa sobre la base local. Nunca uses `supabase db reset --linked` ni `supabase db push` contra el remoto sin que el usuario lo pida: borran o cambian datos reales.
- La versión de Postgres local (`major_version` en `supabase/config.toml`) debe coincidir con la del proyecto remoto.

## Respaldos

- `.github/workflows/backup.yml` hace cada día a las 03:00 (Quito) un `pg_dump` del esquema `public`, lo cifra con `BACKUP_PASSPHRASE` (el repo es público y sus artefactos se pueden descargar) y lo guarda 30 días como artefacto del workflow. Secretos: `SUPABASE_DB_URL` (cadena del *Session pooler*, porque el host directo es solo IPv6) y `BACKUP_PASSPHRASE`. No incluye los usuarios de Auth ni los archivos de Storage.
- Restaurar en la base local: descargar el artefacto, `gpg --decrypt siete8-AAAA-MM-DD.dump.gpg > siete8.dump` y `pg_restore --clean --if-exists --no-owner --schema=public -d postgresql://postgres:postgres@127.0.0.1:54322/postgres siete8.dump`. En el remoto solo se restaura si el usuario lo pide.

## Estructura de carpetas

```
src/
  app/           Rutas (App Router). Sitio público en el grupo (sitio), panel en admin/, API en api/.
  components/    ui/ (shadcn/ui), sitio/ (sitio público), admin/ (panel).
  lib/           Utilidades puras sin acceso a datos: precios con IVA, formatos, slugs.
  server/        Código solo de servidor: acceso a datos, Server Actions, integraciones. Cada archivo importa "server-only".
  env/           Variables de entorno validadas.
supabase/        config.toml, migrations/ y seed.sql (Supabase CLI).
docs/            Documentación del proyecto.
```

Las carpetas se crean cuando tienen su primer archivo, no antes. Alias único: `@/*` → `src/*`.

## Convenciones de código

- Server Components por defecto. `"use client"` solo en el componente que necesita estado, efectos o eventos, lo más abajo posible del árbol.
- Datos: se leen en Server Components desde `src/server/`; las escrituras van por Server Actions o rutas de `api/`, validadas con Zod.
- Nombres de archivos en kebab-case (`plan-card.tsx`); componentes en PascalCase; funciones y variables en camelCase.
- Pruebas junto al archivo que prueban: `price.ts` → `price.test.ts`.
- Next.js 16 cambia APIs respecto a versiones anteriores: antes de usar una API, revisa `node_modules/next/dist/docs/`.
- Commits en inglés, en imperativo y con una línea de resumen corta.
