---
paths:
  - "src/env/**"
  - ".env.example"
  - "next.config.ts"
  - "netlify/functions/**"
  - "src/instrumentation*.ts"
  - "src/app/global-error.tsx"
  - "src/lib/sentry.ts"
  - "src/lib/analytics.ts"
  - "src/components/sitio/analytics.tsx"
---

# Variables de entorno, analítica y monitoreo

## Variables de entorno

Se validan con Zod al arrancar: `next.config.ts` importa `src/env/schema.ts`, así que `pnpm dev`, `pnpm build` y `pnpm start` fallan si falta una variable exigida. Para desarrollo local, copia `.env.example` a `.env.local`.

- En el código se usan solo `serverEnv` (`@/env/server`) y `clientEnv` (`@/env/client`). Nunca se lee `process.env` fuera de `src/env/`, `next.config.ts` y `netlify/functions/` (corren fuera de Next; validan con los esquemas de `src/env/schema.ts`).
- `@/env/server` importa `server-only`: si un componente cliente lo importa, el build falla. Los secretos van solo ahí.
- `@/env/client` solo tiene variables `NEXT_PUBLIC_*`, leídas por su nombre completo para que Next las incruste en el build.
- Cada tarea que integra un servicio agrega sus variables al esquema y a `.env.example`. No se declaran antes de usarse.
- En Netlify, si `NEXT_PUBLIC_SITE_URL` no está definida, se usa la URL del despliegue (`URL` en producción, `DEPLOY_PRIME_URL` en vistas previas).
- `netlify/functions/keep-alive.mts` hace una lectura pública diaria para que Supabase no pause el proyecto gratuito (E7-04). Su registro está en Netlify, en Logs > Functions.

| Variable                                                             | Tipo                                  | Se agrega en                                                                                            |
| -------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                                               | pública                               | E0-03 (exigida)                                                                                         |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`   | pública                               | E1-06                                                                                                   |
| `SUPABASE_SECRET_KEY`                                                | secreta                               | E1-06                                                                                                   |
| `RESEND_API_KEY`, `ADMIN_NOTIFICATION_EMAIL`, `TURNSTILE_SECRET_KEY` | secreta, opcional                     | E3-08 (sin Turnstile no se muestra el formulario; sin Resend se guarda el lead pero no llega el correo) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`                                     | pública                               | E3-08                                                                                                   |
| `REVALIDATE_SECRET`                                                  | secreta                               | primera ruta de revalidación bajo demanda                                                               |
| `NEXT_PUBLIC_GA_ID`                                                  | pública, opcional                     | E5-04 (solo producción, en `netlify.toml`)                                                              |
| `MAKE_WEBHOOK_URL`                                                   | secreta, solo en Netlify (producción) | redes sociales (`docs/MAKE.md`)                                                                         |
| `ANTHROPIC_API_KEY`                                                  | secreta, opcional                     | E10 (sin ella no se muestra el chat, aunque esté activado en el panel)                                  |
| `NEXT_PUBLIC_SENTRY_DSN`                                             | pública, opcional                     | E7-06 (solo en el contexto de producción de Netlify)                                                    |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`                  | secreta / build, opcionales           | E7-06 (solo Netlify: suben los source maps; sin ellas el build funciona igual)                          |

## Analítica

La analítica es GA4: `NEXT_PUBLIC_GA_ID` (pública, opcional) solo se define para producción en `netlify.toml`, así que los previews y el entorno local no envían nada. GA4 solo se carga en el dominio del sitio (`NEXT_PUBLIC_SITE_URL`, con `isSiteOrigin`) y después de que el visitante acepta el aviso de cookies (`@/components/sitio/analytics`); los clics a WhatsApp se registran como `whatsapp_click`.

## Monitoreo de errores (E7-06)

- Sentry en `src/instrumentation.ts` (servidor, con `onRequestError`), `src/instrumentation-client.ts` (navegador) y `src/app/global-error.tsx`.
- Las opciones y el filtro de privacidad viven en `@/lib/sentry` (`scrubEvent`, con pruebas): sin datos personales, sin cuerpos de petición ni query strings, sin trazas ni Replay.
- El navegador reporta por el túnel `/monitoring` (por eso la CSP no lleva el dominio de Sentry y `src/proxy.ts` no debe interceptarlo).
- Un fallo que el visitante solo ve como aviso (el asistente, el correo de un lead) se reporta con `Sentry.captureException`/`captureMessage`.
- `/dev/sentry` fuerza un error en el navegador y otro en el servidor (404 en producción).
