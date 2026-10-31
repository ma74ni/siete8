---
paths:
  - "src/components/**"
  - "src/app/**/*.tsx"
  - "src/app/**/*.css"
  - "docs/DESIGN.md"
---

# Diseño e interfaz

Fuente: `docs/DESIGN.md`. Estas reglas aplican a todo componente o página.

- Mobile-first. Contraste WCAG 2.1 AA: los naranjas y amarillos de marca nunca van como texto sobre fondo blanco.
- El motivo del logo (7 = `111`, tres barras; 8 = `1000`, un módulo sólido y tres huecos) se reproduce con la geometría de `docs/DESIGN.md`, nunca deformado. Sus coordenadas salen de `docs/brand/logo.ai` y viven solo en `src/components/sitio/motif/motif-geometry.ts`; se usan `HeroMotif` (en la portada, animado; en cada servicio, con `still` y la categoría en `active`), `CategoryDivider` y `ReadingProgress`, nunca un SVG dibujado a mano.
- Sin etiquetas en mayúsculas sobre títulos, sin separadores con punto medio, sin fuente monoespaciada en la interfaz pública.
- Una sola animación automática: el hero de la portada.
- Los tokens viven en `src/app/globals.css`, único archivo de `src/` con colores literales. Los componentes usan los colores semánticos (`bg`, `surface`, `fg`, `fg-muted`, `accent`, `action`, `action-hover`, `on-action`, `border`, `focus`), que ya cambian con el modo oscuro: no se usa `dark:` salvo excepción. La paleta de Tailwind está desactivada. El texto secundario (`fg-muted`) no va sobre `surface` (no pasa AA); ahí se usa `fg`. `src/app/design-tokens.test.ts` verifica contraste, colores literales y esa regla.
- Una sección sobre fondo `ink` usa la clase `.on-ink`, que ajusta los tokens semánticos para mantener el contraste.
- Tipografía: `text-display`, `text-h2`, `text-h3`, `text-h4`, `text-body` y `text-small`, fluidas entre 360 y 1440 px. `h1`–`h4` ya traen ancho, peso y tamaño por defecto.
- Componentes base en `src/components/sitio/`: `Button` (principal o secundario, como botón o enlace), `TextLink`, `PlanTable` (portada), `PlanGrid` (página de cada servicio), `Tabs` y `Faq`. No se escriben estilos de botón, tabla de planes ni campo a mano. Muestra en `/dev/ui` (con `pnpm dev` y en los previews; 404 en producción).
- Controles de formulario: solo los de `src/components/form/controls.tsx` (`Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Label`, `Hint`, `FieldError`) o los campos hechos con ellos, en la misma carpeta (`FormField`, `SelectField`, `CheckboxField`, en `form-field.tsx`, `select-field.tsx` y `checkbox-field.tsx`); para otro control, usa `controlClass()`. Nunca un `<input>`, `<select>` o `<textarea>` con clases propias (DESIGN §7.1).
- El logo es el componente `Logo` (de `docs/brand/logo_horizontal.svg`); no se usa como imagen.
- Los precios se muestran solo con `formatPriceWithVat` de `@/lib/price` (o `PlanTable` y `PlanGrid`, que la usan).
- Los enlaces de WhatsApp se arman solo con `@/lib/whatsapp` (`whatsappUrl(mensaje, waMe)` y los mensajes de COPY §2); nunca se escribe un `wa.me` a mano. El número, el horario, el teléfono, el correo y las redes salen de la configuración del sitio (`getSiteSettings` de `src/server/site-settings.ts`, E4-08), que se edita en el panel (Configuración); nunca se escriben en el código. Los valores de respaldo, si falta una fila, están en `DEFAULT_SETTINGS` de `@/lib/site-settings`. La imagen `public/og.png` no lleva el número, para que no quede vieja.
- Texto en Markdown escrito en el panel (proyectos, artículos): siempre con `Markdown` (`@/components/sitio/markdown`, react-markdown sin HTML crudo), nunca con `dangerouslySetInnerHTML`.
- Qué componente usar en cada caso. `src/app/component-guards.test.ts` falla si un archivo que no es el componente dueño escribe uno de los elementos de las seis primeras filas; las demás son la regla:

  | Necesitas                          | Usa                                                                                                                              | Nunca                                     |
  | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
  | Campo de texto o área de texto     | `FormField` (`multiline` para el área de texto; `Input`, `Textarea`, con `compact` si es de una línea, si armas el campo a mano) | `<input>`, `<textarea>`                   |
  | Lista de opciones                  | `SelectField` (`Select`)                                                                                                         | `<select>`                                |
  | Casilla u opción                   | `CheckboxField` (`Checkbox`, `Radio`)                                                                                            | `<input type="checkbox">`                 |
  | Selector de archivo                | `ImageField` para imágenes; otro caso, un componente propio agregado a los dueños de `<input>` en la prueba                      | `controlClass()` fuera de `controls.tsx`  |
  | Tabla de datos del panel           | `DataTable` (`PlanTable` para los planes del sitio)                                                                              | `<table>`                                 |
  | Contenido que se abre              | `Disclosure` (`Faq` para las preguntas del sitio)                                                                                | `<details>`, `<summary>`                  |
  | Encabezado de una página del panel | `PageHeader`                                                                                                                     | Un `h1` con su enlace y su párrafo a mano |
  | Lista vacía                        | `EmptyState` (o el `empty` de `DataTable`)                                                                                       | Un `<p>` suelto                           |
  | Texto de estado ("Venció el …")    | `StatusText`                                                                                                                     | `text-accent` a mano                      |

  Los `<input type="hidden">` de los formularios sí se escriben en la página. Si un caso nuevo de verdad necesita el elemento, va en un componente y se agrega a sus dueños en la prueba.

- Server Components por defecto. `"use client"` solo en el componente que necesita estado, efectos o eventos, lo más abajo posible del árbol. Ningún componente cliente importa `@/server/*` ni `@supabase/*` (lo verifica `src/server/client-boundary.test.ts`).
