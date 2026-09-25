# CLAUDE.md — Sitio web Siete8

Sitio público, blog, portafolio y panel de administración de Siete8, estudio tecnológico de Quito. Este archivo manda sobre cualquier suposición: léelo completo al empezar cada sesión.

@AGENTS.md

## Estado del repositorio

Este repo está conectado a Netlify: cada push a `master` despliega a producción. Antes tenía el sitio anterior en Vue 2; el sitio nuevo en Next.js lo **reemplaza por completo en este mismo repo** (el código Vue se eliminó en E0-01 y solo queda en el historial de git).

- `dev` es la rama de integración: todas las tareas se fusionan ahí. `master` solo recibe un PR desde `dev` cuando se quiere desplegar a producción; nunca se hace commit directo a `master`.
- La configuración de build de Netlify se declara en `netlify.toml`, no en la interfaz de Netlify.
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
- Supabase: Postgres, Auth, Storage. Migraciones con Supabase CLI en `supabase/migrations`.
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
```

## Forma de trabajar

1. Trabaja solo en la tarea que el usuario indique (por ejemplo, E3-03). Lee su fila en `docs/TAREAS.md` y los requisitos que cita en `docs/SRS.md`.
2. Antes de escribir código, propón un plan corto en pasos y espera aprobación.
3. No toques archivos fuera del alcance de la tarea. Si algo fuera del alcance está roto, avísalo en vez de arreglarlo.
4. Al terminar, verifica la definición de terminado y resume qué cambió y cómo probarlo.
5. Una tarea por rama: `feat/<id>-<nombre-corto>`, creada desde `dev` y fusionada de vuelta a `dev`. Para desplegar se abre un PR de `dev` a `master` (producción en Netlify).

## Definición de terminado

- Cumple los criterios de aceptación de la tarea.
- `pnpm typecheck`, `pnpm lint` y `pnpm test` pasan sin errores.
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
- La clave service role de Supabase y la de Anthropic solo existen en código de servidor. Nunca en componentes cliente ni en variables `NEXT_PUBLIC_*`.
- Toda escritura del panel se valida con Zod en el servidor y verifica el rol admin.

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

```
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
REVALIDATE_SECRET=
TURNSTILE_SECRET_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
RESEND_API_KEY=
ADMIN_NOTIFICATION_EMAIL=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
```

`SENTRY_AUTH_TOKEN` solo se usa en el build para subir source maps. La variable de analítica se agrega cuando se decida la herramienta (SRS: Plausible o GA4). `ANTHROPIC_API_KEY` se agrega recién en la fase 1.1 (asistente).

## Pendiente de completar

- Estructura de carpetas, alias de rutas y convenciones de código: se documentan aquí al cerrar E0-01 y E0-03 (lo exige el criterio de E0-02).
