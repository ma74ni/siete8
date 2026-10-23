---
paths:
  - "supabase/**"
  - "src/server/**"
  - "src/lib/database.types.ts"
---

# Base de datos y Supabase

## Migraciones y esquema

- `.env.local` apunta al proyecto **remoto** de Supabase. La base local (Docker) solo se usa para probar migraciones con `pnpm db:reset`.
- Todo cambio de esquema es una migración nueva en `supabase/migrations` creada con `pnpm db:migration` (sin terminal interactiva, agrega `< /dev/null`). Nunca se edita una migración ya fusionada ni se cambia el esquema desde el panel de Supabase.
- Cada tabla nueva activa Row Level Security en la misma migración que la crea, aunque sus políticas lleguen después.
- Las restricciones de datos (precios, slugs, estados) van también en la base con `check`, y se prueban con pgTAP en `supabase/tests/`.
- Después de cada migración, `pnpm db:reset` y `pnpm db:types`, y se sube `src/lib/database.types.ts` con la migración. CI falla si los tipos no coinciden con el esquema.
- `pnpm db:reset` solo actúa sobre la base local. Nunca uses `supabase db reset --linked` ni `supabase db push` contra el remoto sin que el usuario lo pida: borran o cambian datos reales.
- La versión de Postgres local (`major_version` en `supabase/config.toml`) debe coincidir con la del proyecto remoto.
- Para una migración completa, usa el skill `migracion`.

## RLS y permisos

- Row Level Security en todas las tablas. Lectura anónima solo de lo publicado y visible.
- Las políticas de RLS viven en migraciones y se prueban en `supabase/tests/rls_test.sql` como anónimo, usuario sin rol y admin. Toda tabla nueva agrega su política de lectura pública (si aplica), la de admin (`public.is_admin()`) y sus pruebas.
- `anon` no tiene permisos de escritura en ninguna tabla. Los leads se insertan desde el servidor con la clave secreta, después de validar Turnstile y el consentimiento; nunca con una política de inserción anónima.
- El rol admin se asigna solo por SQL; no existe política de escritura sobre `profile`.

## Clientes de Supabase

- En `src/server/supabase/`: `createPublicClient()` (clave publishable, sin sesión, sujeto a RLS) para lecturas públicas, `createSessionClient()` (cookies del usuario conectado, sujeto a RLS) para el panel, `createProxyClient()` solo para `src/proxy.ts`, y `createAdminClient()` (clave secreta, salta RLS) solo después de validar con Zod y verificar permisos.
- Ningún componente cliente importa `@/server/*` ni `@supabase/*`; lo verifica `src/server/client-boundary.test.ts`. Cada archivo de `src/server/` importa `"server-only"`.

## Storage

- Imágenes en el bucket público `images` de Storage, solo en `posts/` y `projects/`: JPEG, PNG, WebP o AVIF (sin SVG), hasta 2 MB. Se leen por URL pública; solo admin escribe. Sus políticas se prueban en `supabase/tests/storage_test.sql`.
