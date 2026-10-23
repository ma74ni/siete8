---
name: verificar
description: Corre la definición de terminado del proyecto (typecheck, lint, pruebas, formato, pgTAP si cambió la base) y revisa las reglas de contenido, diseño y seguridad sobre el diff. Úsalo antes de dar una tarea por terminada o de abrir un PR.
---

# Verificar la definición de terminado

## 1. Comandos

Corre en orden y reporta cada resultado (no te detengas en el primero que falle):

```
pnpm typecheck
pnpm lint
pnpm test
pnpm format:check
```

Si el diff contra `origin/dev` toca `supabase/`, además:

```
pnpm db:reset
pnpm db:test
pnpm db:types
git diff --exit-code src/lib/database.types.ts
```

## 2. Revisión del diff

Mira `git diff origin/dev...HEAD` (más los cambios sin confirmar) y revisa:

- **Contenido:** textos visibles salen de `docs/COPY.md` o de la base; ningún texto, precio o plazo inventado; ninguna mención del emisor de las firmas; nada confidencial (el repo es público).
- **Diseño:** sin colores literales fuera de `src/app/globals.css`, sin `dark:` innecesario, solo componentes base, precios con `formatPriceWithVat`, WhatsApp con `@/lib/whatsapp`.
- **Seguridad:** sin secretos; `SUPABASE_SECRET_KEY` y `ANTHROPIC_API_KEY` solo en servidor; Server Actions del panel con `requireAdmin()` y Zod; tablas nuevas con RLS y pruebas.
- **Alcance:** nada fuera de la tarea.

Para una revisión más profunda, delega al agente `code-reviewer`.

## 3. Revisión manual

Lista lo que falta revisar a mano o con el agente `ui-checker`: 360 px, 1440 px, navegación con teclado y `prefers-reduced-motion` en las páginas afectadas.

## 4. Resumen

Termina con: qué cambió, cómo probarlo (rutas y pasos), resultado de cada comando y pendientes.
