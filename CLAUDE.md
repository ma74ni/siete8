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

**Seguridad**
- Row Level Security en todas las tablas. Lectura anónima solo de lo publicado y visible.
- La clave secreta de Supabase (`SUPABASE_SECRET_KEY`) y la de Anthropic solo existen en código de servidor. Nunca en componentes cliente ni en variables `NEXT_PUBLIC_*`.
- Toda escritura del panel se valida con Zod en el servidor y verifica el rol admin.
- Las políticas de RLS viven en migraciones y se prueban en `supabase/tests/rls_test.sql` como anónimo, usuario sin rol y admin. Toda tabla nueva agrega su política de lectura pública (si aplica), la de admin (`public.is_admin()`) y sus pruebas.
- `anon` no tiene permisos de escritura en ninguna tabla. Los leads se insertan desde el servidor con la clave secreta, después de validar Turnstile y el consentimiento; nunca con una política de inserción anónima.
- El rol admin se asigna solo por SQL; no existe política de escritura sobre `profile`.

**Diseño**
- Mobile-first. Contraste WCAG 2.1 AA: los naranjas y amarillos de marca nunca van como texto sobre fondo blanco.
- El motivo del logo (7 = `111`, tres barras; 8 = `1000`, un módulo sólido y tres huecos) se reproduce con la geometría de `docs/DESIGN.md`, nunca deformado.
- Sin etiquetas en mayúsculas sobre títulos, sin separadores con punto medio, sin fuente monoespaciada en la interfaz pública.
- Una sola animación automática: el hero de la portada.

**SEO**
- Las páginas públicas se generan estáticamente o en servidor; el HTML trae el contenido completo.
- Cada página pública define title, description, canonical y Open Graph.

## Datos del negocio

- WhatsApp comercial: 0961128233 (en `wa.me`: 593961128233). Atención de 07:00 a 20:00.
- Teléfono: 0999843108.
- Correo: hola@siete8.com. Dominio: siete8.com (DNS en Namecheap; el correo vive en DreamHost y sus registros MX, SPF, DKIM y DMARC no se tocan).
- Redes: facebook.com/siete8.ec, instagram.com/siete8.ec, linkedin.com/company/siete8.ec.

## Variables de entorno

Se validan con Zod al arrancar: `next.config.ts` importa `src/env/schema.ts`, así que `pnpm dev`, `pnpm build` y `pnpm start` fallan si falta una variable exigida. Para desarrollo local, copia `.env.example` a `.env.local`.

- En el código se usan solo `serverEnv` (`@/env/server`) y `clientEnv` (`@/env/client`). Nunca se lee `process.env` fuera de `src/env/` y `next.config.ts`.
- `@/env/server` importa `server-only`: si un componente cliente lo importa, el build falla. Los secretos van solo ahí.
- `@/env/client` solo tiene variables `NEXT_PUBLIC_*`, leídas por su nombre completo para que Next las incruste en el build.
- Cada tarea que integra un servicio agrega sus variables al esquema y a `.env.example`. No se declaran antes de usarse.
- En Netlify, si `NEXT_PUBLIC_SITE_URL` no está definida, se usa la URL del despliegue (`URL` en producción, `DEPLOY_PRIME_URL` en vistas previas).

| Variable | Tipo | Se agrega en |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | pública | E0-03 (exigida) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | pública | E1-06 |
| `SUPABASE_SECRET_KEY` | secreta | E1-06 |
| `RESEND_API_KEY`, `ADMIN_NOTIFICATION_EMAIL`, `TURNSTILE_SECRET_KEY` | secreta | E3-08 |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | pública | E3-08 |
| `REVALIDATE_SECRET` | secreta | primera ruta de revalidación bajo demanda |
| `NEXT_PUBLIC_SENTRY_DSN` | pública | E7-06 |
| `SENTRY_AUTH_TOKEN` | secreta (solo build, source maps) | E7-06 |

La variable de analítica se agrega cuando se decida la herramienta (SRS: Plausible o GA4). `ANTHROPIC_API_KEY` (secreta) se agrega recién en la fase 1.1 (asistente).

## Base de datos

- `.env.local` apunta al proyecto **remoto** de Supabase. La base local (Docker) solo se usa para probar migraciones con `pnpm db:reset`.
- Cada tabla nueva activa Row Level Security en la misma migración que la crea, aunque sus políticas lleguen después.
- Las restricciones de datos (precios, slugs, estados) van también en la base con `check`, y se prueban con pgTAP en `supabase/tests/`.
- Todo cambio de esquema es una migración nueva en `supabase/migrations` creada con `pnpm db:migration`. Nunca se edita una migración ya fusionada ni se cambia el esquema desde el panel de Supabase.
- Después de cada migración, `pnpm db:reset` y `pnpm db:types`, y se sube `src/lib/database.types.ts` con la migración. CI falla si los tipos no coinciden con el esquema.
- Clientes de Supabase en `src/server/supabase/`: `createPublicClient()` (clave publishable, sin sesión, sujeto a RLS) para lecturas públicas, y `createAdminClient()` (clave secreta, salta RLS) solo después de validar con Zod y verificar permisos. Ningún componente cliente importa `@/server/*` ni `@supabase/*`; lo verifica `src/server/client-boundary.test.ts`.
- `pnpm db:reset` solo actúa sobre la base local. Nunca uses `supabase db reset --linked` ni `supabase db push` contra el remoto sin que el usuario lo pida: borran o cambian datos reales.
- La versión de Postgres local (`major_version` en `supabase/config.toml`) debe coincidir con la del proyecto remoto.

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
