# Siete8

Sitio público, blog, portafolio y panel de administración de Siete8.

Stack: Next.js 16 (App Router), TypeScript, Tailwind CSS, Supabase y Netlify. Las reglas del proyecto están en [`CLAUDE.md`](CLAUDE.md) y la documentación en [`docs/`](docs/).

## Requisitos

- Node 22 (`.nvmrc`)
- pnpm 10 (`corepack enable`)

## Comandos

```
cp .env.example .env.local   # variables locales (validadas al arrancar)
pnpm install
pnpm dev           # servidor local en http://localhost:3000
pnpm build         # build de producción
pnpm typecheck     # tipos
pnpm lint          # ESLint
pnpm test          # Vitest
pnpm format        # Prettier
```
