---
name: migracion
description: Crea una migración de Supabase completa (tabla o cambio de esquema con RLS, checks, pruebas pgTAP y tipos regenerados). Úsalo siempre que una tarea cambie el esquema de la base.
argument-hint: <nombre_de_la_migracion en snake_case>
---

# Migración: $ARGUMENTS

Lee antes `.claude/rules/base-de-datos.md`. Todo ocurre contra la base **local**; nunca contra el remoto.

1. **Base local arriba.** `pnpm db:status`; si no responde, `pnpm db:start` (necesita Docker).
2. **Crear el archivo.**
   ```
   pnpm db:migration $ARGUMENTS < /dev/null
   ```
   Nunca edites una migración ya fusionada en `dev`: si algo cambia, va en una migración nueva.
3. **Escribir el SQL**, en este orden dentro de la misma migración:
   - Tabla o cambio de columnas, con restricciones `check` para precios, slugs y estados.
   - `alter table ... enable row level security;` en toda tabla nueva.
   - Política de lectura pública solo si aplica (lo publicado y visible) y política de admin con `public.is_admin()`.
   - Ninguna política de escritura para `anon` ni sobre `profile`.
   - Si la tabla guarda imágenes, recuerda las reglas del bucket `images` (solo `posts/` y `projects/`).
4. **Pruebas pgTAP** en `supabase/tests/`: agrega casos al archivo del área (o a `rls_test.sql`) para anónimo, usuario sin rol y admin, y para cada `check`.
5. **Aplicar y verificar.**
   ```
   pnpm db:reset
   pnpm db:test
   pnpm db:types
   ```
   `db:reset` y `db:types` son obligatorios: CI falla si `src/lib/database.types.ts` no coincide con el esquema.
6. **Semilla.** Si la tabla necesita datos de ejemplo de `docs/SRS.md` (anexos), agrégalos a `supabase/seed.sql`.
7. **Confirmar juntos** la migración, las pruebas y `src/lib/database.types.ts` en el mismo commit.

Prohibido sin que el usuario lo pida explícitamente: `supabase db push`, `supabase db reset --linked` o cambiar el esquema desde el panel de Supabase.
