# CLAUDE.md — Sitio web Siete8

Sitio público, blog, portafolio y panel de administración de Siete8, estudio tecnológico de Quito. Este archivo manda sobre cualquier suposición: léelo completo al empezar cada sesión.

@AGENTS.md

## Estado del repositorio

Este repo está conectado a Netlify: cada push a `master` despliega a producción. Antes tenía el sitio anterior en Vue 2; el sitio nuevo en Next.js lo **reemplaza por completo en este mismo repo** (el código Vue se eliminó en E0-01 y solo queda en el historial de git).

- `dev` es la rama de integración: todas las tareas se fusionan ahí. `master` solo recibe un PR desde `dev` cuando se quiere desplegar a producción; nunca se hace commit directo a `master`.
- El repositorio es **público**: nada confidencial entra al repo, tampoco en `.claude/`.

## Documentos del proyecto

| Archivo | Para qué |
| --- | --- |
| `docs/TAREAS.md` | Plan de trabajo. Solo se trabaja en la tarea indicada por el usuario. |
| `docs/SRS.md` | Requisitos funcionales (RF-*) y no funcionales (RNF-*), modelo de datos, anexos con datos semilla. |
| `docs/COPY.md` | Única fuente de textos visibles. |
| `docs/DESIGN.md` | Sistema de diseño: tokens, tipografía, componentes, motivo del logo. |
| `docs/MAKE.md` | Pasos del escenario de Make para publicar en redes. |
| `docs/mockups/` | Referencia visual. Si contradice a COPY.md o DESIGN.md, ganan ellos. |
| `docs/brand/` | Logo oficial y colores. |
| `docs/data/portafolio-anterior.json` | Fuente de la importación del portafolio (E6-01). |

Las rutas de esta tabla son relativas a la raíz del repo.

## Stack

- Next.js 16 (App Router) con TypeScript estricto (`strict`, `noUncheckedIndexedAccess`), pnpm y Node 22. Next 16 cambia APIs respecto a versiones anteriores: consulta `node_modules/next/dist/docs/` antes de usar una API (ver `AGENTS.md`).
- Tailwind CSS con los tokens de `docs/DESIGN.md` como variables CSS. El panel usa los componentes propios (DESIGN §7.1 y §12), no shadcn/ui.
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

1. Trabaja solo en la tarea que el usuario indique (por ejemplo, E3-03). Lee su fila en `docs/TAREAS.md` y los requisitos que cita en `docs/SRS.md`. El skill `tarea` hace este arranque.
2. Antes de escribir código, propón un plan corto en pasos y espera aprobación.
3. No toques archivos fuera del alcance de la tarea. Si algo fuera del alcance está roto, avísalo en vez de arreglarlo.
4. Al terminar, verifica la definición de terminado (skill `verificar`) y resume qué cambió y cómo probarlo.
5. Una tarea por rama: `feat/<id>-<nombre-corto>`, creada desde `dev` y fusionada de vuelta a `dev`. Para desplegar se abre un PR de `dev` a `master` (skill `release`).

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
- No menciones en el sitio a la entidad que emite las firmas (la actual, con contrato de distribución desde octubre de 2026, ni proveedores anteriores como Click Identy): el contrato no permite usar su nombre ni su marca sin autorización. Sí se dice que la firma la emite "una entidad de certificación acreditada por ARCOTEL" y que Siete8 es distribuidor autorizado, porque el contrato tampoco permite presentarla como propia. Los requisitos de la firma son los de su política de validación (COPY §4): no se agregan ni se quitan. El contrato y sus anexos son confidenciales: no se suben al repositorio (es público) ni se citan sus precios, costos o el nombre del emisor. Tampoco uses las frases prohibidas de `docs/COPY.md` (sección "No usar").
- Todo el sitio está en español de Ecuador, con tuteo. El código, nombres de variables y commits van en inglés.

**Datos y precios**
- Los precios se guardan sin IVA (`price_without_vat`) junto con `vat_rate`. El sitio siempre muestra el total con IVA: `round(price * (1 + vat_rate), 2)`, con coma decimal (`$20,69`). El cálculo se hace en una sola función compartida, en centavos enteros, para evitar errores de coma flotante; ningún componente calcula el IVA por su cuenta.
- El sitio y cualquier formulario nunca piden ni guardan documentos de identidad. Esos se envían por WhatsApp.
- Un lead no se guarda sin consentimiento (`consent_at`).

**Seguridad**
- Row Level Security en todas las tablas. Lectura anónima solo de lo publicado y visible.
- La clave secreta de Supabase (`SUPABASE_SECRET_KEY`) y la de Anthropic solo existen en código de servidor. Nunca en componentes cliente ni en variables `NEXT_PUBLIC_*`.
- Toda escritura del panel se valida con Zod en el servidor y verifica el rol admin.
- Nunca uses `supabase db reset --linked` ni `supabase db push` contra el remoto sin que el usuario lo pida: borran o cambian datos reales. `.env.local` apunta al proyecto remoto.

## Reglas por área

El detalle de cada área vive en `.claude/rules/` y se carga solo cuando se trabaja en esos archivos. Si una tarea toca un área, lee su regla aunque no se haya cargado.

| Regla | Cubre |
| --- | --- |
| `diseno.md` | Tokens, contraste, motivo del logo, tipografía, componentes base, precios y WhatsApp en la interfaz |
| `sitio-publico.md` | Layout de `(sitio)`, `Floor`, `Closing`, textos de servicios en la base, `/enlaces`, SEO, datos de contacto |
| `base-de-datos.md` | Migraciones, RLS, clientes de Supabase, Storage |
| `panel.md` | Protección de `/admin`, Server Actions del panel, formularios, imágenes |
| `leads.md` | Formulario de contacto, Turnstile, límites, historial de estados |
| `asistente.md` | Chat del sitio (E10) |
| `blog-y-redes.md` | Fechas del blog, publicación programada, Make, RSS |
| `entorno-y-monitoreo.md` | Variables de entorno, GA4, Sentry, funciones de Netlify |
| `infra.md` | Netlify, DNS y correo, checks, respaldos |

## Agentes y skills

- Skills (`.claude/skills/`): `tarea`, `migracion`, `pagina-publica`, `verificar`, `release`.
- Agentes (`.claude/agents/`): `code-reviewer` (revisión de solo lectura contra estas reglas), `db-specialist` (migraciones, RLS y pgTAP), `ui-checker` (revisión visual a 360 y 1440 px con Playwright).

## Estructura de carpetas

```
src/
  app/           Rutas (App Router). Sitio público en el grupo (sitio), panel en admin/, API en api/.
  components/    form/ (controles de formulario, compartidos), sitio/ (sitio público), admin/ (panel).
  lib/           Utilidades puras sin acceso a datos: precios con IVA, formatos, slugs.
  server/        Código solo de servidor: acceso a datos, Server Actions, integraciones. Cada archivo importa "server-only".
  env/           Variables de entorno validadas.
supabase/        config.toml, migrations/ y seed.sql (Supabase CLI).
docs/            Documentación del proyecto.
.claude/         Reglas por área, skills, agentes y permisos de Claude Code.
```

Las carpetas se crean cuando tienen su primer archivo, no antes. Alias único: `@/*` → `src/*`.

## Convenciones de código

- Server Components por defecto. `"use client"` solo en el componente que necesita estado, efectos o eventos, lo más abajo posible del árbol.
- Campos, listas de opciones, casillas, tablas, desplegables, encabezados y estados vacíos se hacen con sus componentes: la tabla "Qué componente usar" de `.claude/rules/diseno.md` dice cuál, y `src/app/component-guards.test.ts` falla si un archivo que no es su componente escribe un `<select>`, `<textarea>`, `<input>` visible, `<table>`, `<details>`/`<summary>` o llama a `controlClass()`.
- Datos: se leen en Server Components desde `src/server/`; las escrituras van por Server Actions o rutas de `api/`, validadas con Zod.
- Nombres de archivos en kebab-case (`plan-card.tsx`); componentes en PascalCase; funciones y variables en camelCase.
- Pruebas junto al archivo que prueban: `price.ts` → `price.test.ts`.
- Commits en inglés, en imperativo y con una línea de resumen corta.

## Calidad de código

Reglas concretas, no principios genéricos: el agente `code-reviewer` las revisa en cada tarea.

**Cada capa hace lo suyo**
- La lógica de negocio y los cálculos van en `src/lib/` como funciones puras, sin acceso a datos y con pruebas. `src/server/` lee, escribe y valida. Las páginas y componentes muestran y orquestan; no calculan precios, saldos, fechas ni estados.
- Las dependencias van hacia adentro: `src/lib/` no importa de `src/server/` ni de `src/components/`.
- Una Server Action sigue siempre el mismo orden: `requireAdmin()` (en el panel), validar con Zod, escribir, `revalidatePath` y devolver el mensaje de COPY.

**Funciones y componentes**
- Una función hace una cosa. Si su nombre o su descripción necesita "y", se divide.
- Una página grande se divide en componentes con nombre dentro del mismo archivo (como la ficha del cliente) antes de crear archivos nuevos.
- Nombres que dicen qué hacen, en inglés y sin abreviaturas (`expiresOn`, no `exp`).

**Sin duplicar**
- Antes de escribir una función, un componente o un esquema, busca uno parecido en `src/lib/`, `src/server/` y `src/components/`.
- Si la misma lógica aparece dos veces, se extrae a una función compartida con prueba.

**Tipos y errores**
- Sin `any`. `as` y `!` solo cuando el tipo ya está garantizado (por ejemplo, `data!` después de comprobar `error`), nunca para callar al compilador.
- Nada falla en silencio: una lectura que falla lanza un error; una acción devuelve el mensaje de error de COPY; un fallo que el visitante solo ve como aviso va a Sentry.

**Limpieza**
- Sin código muerto, sin variables sin uso y sin código comentado.
- Los comentarios explican el porqué, no repiten el qué.
- Cambios mínimos: no se refactoriza fuera del alcance de la tarea. Si algo lo merece, se avisa y se propone como tarea aparte.

**Pruebas**
- Toda función nueva de `src/lib/` tiene pruebas, con sus casos borde (vacío, nulo, límites de fechas, redondeo).
- Un error corregido agrega la prueba que lo habría detectado.

**Seguridad**
- Además de las reglas de esta página y de `.claude/rules/`, una tarea que toca autenticación, permisos, RLS, secretos, variables de entorno o entradas del visitante pasa por el skill `security-review` antes del PR (lo indica el skill `verificar`).
