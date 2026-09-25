# DESIGN.md — Sitio web Siete8

Sistema de diseño del sitio público y del panel de Siete8. Es la fuente de verdad para Google Stitch, Figma y Claude Code: si una pantalla contradice este archivo, gana este archivo.

Versión 0.1 — 25 de septiembre de 2026.

---

## 1. Brief

- **Qué es:** Siete8, estudio tecnológico de Quito. Hace sitios web, hosting y correo; vende firmas electrónicas y su propio facturador; desarrolla software a medida y proyectos de BI.
- **Para quién:** personas y pymes de Ecuador. Llegan con un problema concreto (necesito una firma hoy, mi correo rebota, quiero vender en línea) y poco tiempo.
- **Trabajo principal del sitio:** que el visitante entienda en segundos qué puede resolver con Siete8 y termine en WhatsApp. Secundario: demostrar con el propio sitio el nivel técnico del estudio.
- **Tono:** cercano, directo, competente. Tuteo ("tu negocio"), como en el material comercial actual.

## 2. Concepto visual: el servidor binario

El logo es el nombre escrito en binario y montado como un servidor:

- **Las tres barras verticales son el 7** en binario: `111`, tres unos (vino → granate → carmín), inclinadas en perspectiva.
- **El bloque apilado es el 8** en binario: `1000`, un módulo sólido (1) sobre tres módulos huecos (0, 0, 0), en degradado carmín → amarillo.
- **Juntos forman un rack de servidor** visto en perspectiva: tecnología, infraestructura y orden.

El sitio traslada esa idea al layout:

- **Unidades de rack:** las secciones son bandas horizontales apiladas, de ancho completo, con límites nítidos, como unidades de un rack. Nada de tarjetas flotando sobre un fondo neutro.
- **Unos y ceros como lenguaje gráfico:** barra sólida = 1, módulo hueco = 0. El motivo nunca se usa para escribir números al azar; cuando aparece, respeta la lectura 111 / 1000 del logo.
- **Barras:** las tres barras son el único elemento decorativo de la marca. Aparecen en el hero, como progreso de lectura en artículos y como separador entre categorías.
- **Degradado con propósito:** el degradado cálido solo aparece dentro del motivo. Nunca como fondo decorativo ni en botones.

La audacia se gasta en un solo lugar: el hero. Todo lo demás es sobrio.

## 3. Color

### 3.1 Paleta de marca

| Token | Hex | Uso |
| --- | --- | --- |
| `ink` | `#292325` | Texto principal, superficie oscura |
| `vino` | `#5B2447` | Barras del motivo, enlaces visitados, acentos de navegación |
| `granate` | `#90213D` | Barras del motivo, estados hover sobre carmín |
| `carmin` | `#BE1D36` | Acción principal (botones, enlaces), foco |
| `grad-1` | `#E84235` | Solo motivo y gráficos |
| `grad-2` | `#EB6E33` | Solo motivo y gráficos |
| `grad-3` | `#F0952C` | Solo motivo y gráficos |
| `grad-4` | `#F5B71B` | Motivo, gráficos, acento sobre fondo oscuro |

### 3.2 Neutros

Derivados de `ink`, con un leve tinte vino para que no se sientan grises genéricos.

| Token | Hex | Uso |
| --- | --- | --- |
| `paper` | `#FFFFFF` | Fondo principal en modo claro |
| `mist` | `#F6F2F4` | Pisos alternos, fondo de tablas y formularios |
| `line` | `#E4DBE0` | Bordes y divisores |
| `muted` | `#7D6F76` | Texto secundario (contraste 4,8:1 sobre blanco) |
| `night` | `#1D1719` | Fondo en modo oscuro |
| `night-2` | `#292325` | Pisos alternos en modo oscuro |

### 3.3 Reglas de contraste

- `ink`, `vino` y `carmin` pasan AA sobre `paper` para texto normal (15,4:1; 11,7:1; 6,1:1).
- Los naranjas y amarillos **nunca** van como texto sobre blanco: `grad-2` sobre blanco da 3,1:1 y no pasa.
- Sobre `night` sí: `grad-4` sobre `ink` da 8,6:1. En modo oscuro el acento de texto es `grad-4` y la acción principal sigue siendo `carmin` con texto blanco.

### 3.4 Degradado

```css
--brand-gradient: linear-gradient(90deg, #BE1D36 0%, #E84235 25%, #EB6E33 50%, #F0952C 75%, #F5B71B 100%);
--bars-gradient: linear-gradient(90deg, #5B2447 0%, #90213D 50%, #BE1D36 100%);
```

Se usa en los módulos apilados del motivo, en la barra de progreso de lectura y en la serie principal de gráficos. En ningún otro lugar.

## 4. Tipografía

Una sola familia en dos anchos, en eco del logotipo ancho de SIETE8: **Archivo** (Google Fonts, variable con eje de ancho `wdth` 62–125).

| Rol | Configuración |
| --- | --- |
| Display (h1, h2) | Archivo, `wdth` 125, peso 700, tracking −0,02em |
| Títulos menores (h3, h4) | Archivo, `wdth` 112, peso 600 |
| Cuerpo | Archivo, `wdth` 100, peso 400, interlineado 1,6 |
| Interfaz (botones, etiquetas, tablas) | Archivo, `wdth` 100, peso 500 |

### Escala (modular 1,25, base 17 px)

| Token | Móvil | Escritorio |
| --- | --- | --- |
| `text-display` | 40 px | 72 px |
| `text-h2` | 30 px | 44 px |
| `text-h3` | 22 px | 28 px |
| `text-h4` | 18 px | 21 px |
| `text-body` | 17 px | 17 px |
| `text-small` | 14 px | 14 px |

### Reglas

- Largo de línea del cuerpo: máximo 68 caracteres (`max-width: 68ch`).
- Nada de mayúsculas sostenidas en etiquetas ni "eyebrows" sobre los títulos.
- No se resalta una sola palabra del titular con otro color, cursiva o peso. El titular funciona completo.
- Los precios usan cifras tabulares (`font-variant-numeric: tabular-nums`) para que se alineen en tablas.

## 5. Layout

- **Retícula:** 4 columnas en móvil, 12 en escritorio; márgenes de 20 px en móvil y 48 px en escritorio; ancho máximo del contenido 1200 px.
- **Alineación:** todo alineado a la izquierda, incluidos los titulares de sección. Centrado solo en estados vacíos.
- **Unidades:** cada sección ocupa el ancho completo; alternan `paper` y `mist`. Separación vertical entre pisos: 64 px en móvil, 120 px en escritorio.
- **Espaciado:** escala de 4 px (`4, 8, 12, 16, 24, 32, 48, 64, 96, 120`).
- **Móvil primero:** cada pantalla se diseña a 360 px y luego se expande.

### 5.1 Portada (móvil)

```
┌────────────────────────────┐
│ [logo]              [menú] │
├────────────────────────────┤
│ ▐▐▐ ┌──────────┐           │  ← hero: las barras se abren y
│ ▐▐▐ │ Presencia │           │    revelan tres módulos apilados,
│ ▐▐▐ ├──────────┤           │    uno por categoría de servicio
│ ▐▐▐ │ Trámites  │           │
│ ▐▐▐ ├──────────┤           │
│ ▐▐▐ │ Desarrollo│           │
│     └──────────┘           │
│ Tu web, tu correo, tu firma│
│ y tus facturas, resueltos  │
│ por un mismo equipo.       │
│ [Escríbenos por WhatsApp]  │
│ Ver servicios              │
├──────── piso mist ─────────┤
│ Firma electrónica en 10 min│  ← servicio destacado del momento
│ desde $8,04 con IVA        │
├──────── piso paper ────────┤
│ Proyectos (3 destacados)   │
├──────── piso mist ─────────┤
│ Cómo trabajamos 1 → 2 → 3  │  ← única sección numerada: es un proceso
├──────── piso paper ────────┤
│ Del blog (2 artículos)     │
├──────── piso ink ──────────┤
│ Contacto + pie             │
└────────────────────────────┘
```

### 5.2 Página de servicio (móvil)

```
┌────────────────────────────┐
│ Firma electrónica          │
│ Qué es, en una frase.      │
│ [Solicitar por WhatsApp]   │  ← el CTA aparece antes del primer scroll
├──────── piso mist ─────────┤
│ Natural | Jurídica  (tabs) │
│ 1 año ........... $20,69   │  ← tabla de planes, precio con IVA
│ 2 años .......... $31,04   │
├──────── piso paper ────────┤
│ Qué necesitas (requisitos) │
├──────── piso mist ─────────┤
│ Preguntas frecuentes       │
├──────── piso paper ────────┤
│ También te puede servir:   │
│ Facturación electrónica    │
└────────────────────────────┘
```

## 6. Motivo de barras

- **Geometría:** tres barras verticales (111) con inclinación en perspectiva, como en el logo, y un bloque de un módulo sólido sobre tres módulos huecos (1000).
- **Hero:** secuencia de carga única, 900 ms en total. Las barras se encienden de izquierda a derecha y los módulos del rack aparecen de arriba hacia abajo: primero el sólido, luego los tres huecos, cada uno con su categoría dentro, como servidores que arrancan. Con `prefers-reduced-motion`, aparece en su estado final sin animación.
- **Progreso de lectura:** en artículos, una barra de 3 px en el borde superior con `--brand-gradient`.
- **Separador de categorías:** tres barras de 4 × 24 px en `--bars-gradient`, junto al título de cada categoría del catálogo.
- **Prohibido:** usar el motivo como patrón de fondo repetido, deformarlo o cambiar el orden de sus colores.

## 7. Componentes

| Componente | Especificación |
| --- | --- |
| Botón principal | Fondo `carmin`, texto blanco, peso 500, radio 4 px, alto 48 px. Hover: `granate`. Texto = la acción ("Escríbenos por WhatsApp", "Ver planes"); sin flechas añadidas |
| Botón secundario | Borde 1,5 px `ink`, fondo transparente. Hover: fondo `mist` |
| Enlace | `carmin`, subrayado de 1 px con 3 px de separación |
| Botón flotante de WhatsApp | Círculo de 56 px, fondo `ink` (no el verde de WhatsApp), ícono blanco; esquina inferior derecha, respeta el área segura |
| Tabla de planes | Filas con divisor `line`, precio alineado a la derecha en cifras tabulares, fila recomendada con borde izquierdo de 3 px `carmin` |
| Tarjeta de proyecto | Captura en proporción 16:10 sin sombra, título, tipo de proyecto y estado. La etiqueta de estado va en texto, no en píldora de color |
| Formularios | Campo alto 48 px, borde `line`, foco con anillo de 2 px `carmin` y separación de 2 px |
| Radios | 4 px en controles, 0 en imágenes y pisos. Sin radios grandes |
| Sombras | Ninguna en el sitio público; la jerarquía se hace con color de piso y bordes. En el panel, solo en menús desplegables y diálogos |

## 8. Movimiento

- Un solo momento orquestado: el hero de la portada.
- Movimiento como respuesta a la acción: abrir el menú, expandir una pregunta frecuente, cambiar de pestaña de planes. Duración 150–200 ms, `ease-out`.
- Sin entradas animadas por sección al hacer scroll.
- Todo respeta `prefers-reduced-motion`.

## 9. Imágenes

- **Portafolio:** capturas reales de escritorio y móvil, sobre fondo `mist`, sin mockups de dispositivos 3D.
- **Blog:** imagen de portada 1200 × 630 (sirve también como imagen de Open Graph).
- **Fotografía:** si se usa, gente real trabajando en negocios de Quito. Nada de fotos de stock con apretones de manos o pantallas con código genérico.
- **Íconos:** un solo set de línea con trazo de 1,5 px (propuesta: Lucide). Se reemplazan los íconos ilustrados del material comercial anterior.

## 10. Escritura en la interfaz

- Frases cortas, voz activa, tuteo.
- Nombrar las cosas como las nombra el cliente: "firma electrónica", no "certificado digital de firma".
- Precios siempre con IVA incluido y el texto "incluye IVA" junto al primero de la tabla.
- Los botones dicen qué pasa al tocarlos. Si el botón dice "Enviar solicitud", la confirmación dice "Solicitud enviada".
- Errores: qué pasó y cómo arreglarlo, sin disculpas genéricas. Ejemplo: "Falta tu número de celular. Lo necesitamos para enviarte el código de activación."

## 11. Modo oscuro

- Fondo `night`, pisos alternos `night-2`, texto `#F6F2F4`, texto secundario `#B3A6AD`.
- Acento de texto `grad-4`; botón principal sigue en `carmin`.
- El motivo de barras mantiene sus colores.

## 12. Panel de administración

- Construido con shadcn/ui, tematizado con los tokens de este archivo.
- Densidad media, tipografía Archivo `wdth` 100 en todo el panel, sin el ancho expandido.
- Sin motivo de barras, salvo el logo en la barra lateral.

## 13. Tokens para Tailwind (CSS variables)

```css
:root {
  --ink: #292325;
  --vino: #5B2447;
  --granate: #90213D;
  --carmin: #BE1D36;
  --grad-1: #E84235;
  --grad-2: #EB6E33;
  --grad-3: #F0952C;
  --grad-4: #F5B71B;
  --paper: #FFFFFF;
  --mist: #F6F2F4;
  --line: #E4DBE0;
  --muted: #7D6F76;
  --night: #1D1719;
  --night-2: #292325;
  --radius-control: 4px;
  --font-sans: "Archivo", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
```

## 14. Instrucciones para Google Stitch

- Adjunta este archivo como DESIGN.md del proyecto antes de generar cualquier pantalla.
- Genera primero en móvil (360 px) y después la versión de escritorio de la misma pantalla.
- Usa contenido real: servicios, precios y requisitos del SRS, no texto de relleno.
- Rechaza cualquier variante con: tarjetas redondeadas idénticas con sombra gris, degradados como fondo, etiquetas en mayúsculas sobre los títulos, una palabra del titular resaltada en color, íconos 3D o fotos de stock genéricas.
- Pantallas a generar, en este orden: portada, servicio (firma electrónica), portafolio, detalle de proyecto, artículo del blog, contacto.
- No redactes afirmaciones legales, técnicas ni de certificación ("oficial", "homologado", "acreditado", algoritmos, leyes). Usa solo el texto provisto; si falta, deja el texto de ejemplo marcado entre corchetes.
- Sin fuente monoespaciada, sin separadores con punto medio (A • B) y sin encabezados de tabla en mayúsculas.
- Los conceptos de layout ("rack", "unidades", "binario") nunca aparecen en el texto visible, salvo en la página Nosotros al contar el origen del logo.
- El logo es el archivo oficial, no se reconstruye con texto.
- La navegación principal es: Servicios, Proyectos, Blog, Nosotros, Contacto. Las categorías de servicio van dentro del menú Servicios.
- En el hero, las barras del motivo van inclinadas en perspectiva como en el logo (no paralelogramos) y ocupan al menos la mitad del ancho en escritorio.
- Texto mínimo de 14 px; el texto secundario usa `muted`, nunca un gris más claro.

## 15. Pendientes

- Validar Archivo expandido con el logotipo real a tamaño de titular; si choca con el wordmark, probar Archivo `wdth` 112.
- Definir el ícono de estado de cada proyecto del portafolio (activo, interno, reemplazado, archivado, en desarrollo).
- Conseguir fotografía propia o decidir que el sitio no usa fotografía fuera del portafolio.
