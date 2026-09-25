# Plan de tareas — Sitio Siete8

Sep 25, 2026 · @Many

Tareas del MVP en orden de ejecución, derivadas del SRS, el DESIGN.md, el copy y los mockups. Cada tarea cita los requisitos que cumple.

## 1. Cómo usar este plan

### Flujo con Claude Code

1. Una tarea por sesión o por rama. Rama `feat/<id>-<nombre>` creada desde `dev`, por ejemplo `feat/E3-04-pagina-servicio`.
2. Claude Code lee el `CLAUDE.md` de la raíz y los documentos de `/docs` antes de escribir código.
3. Primero propone un plan corto de la tarea; se revisa y se aprueba antes de implementar.
4. Al terminar, ejecuta las verificaciones de la definición de terminado y resume qué cambió.
5. Se revisa la vista previa de Netlify de la rama y se fusiona a `dev`. Para desplegar, se abre un PR de `dev` a `master` (rama de producción en Netlify).

### Estructura de `/docs` en el repositorio

| Archivo | Origen |
| --- | --- |
| `docs/SRS.md` | Exportado del SRS |
| `docs/COPY.md` | Exportado del documento de copy |
| `docs/DESIGN.md` | Sistema de diseño |
| `docs/TAREAS.md` | Exportado de este plan |
| `docs/mockups/` | Capturas de los mockups (portada y firma, escritorio y móvil) |
| `CLAUDE.md` | Reglas del proyecto (tarea E0-02) |

### Definición de terminado (aplica a todas las tareas)

- [ ] Cumple los criterios de aceptación de la tarea.
- [ ] `pnpm typecheck`, `pnpm lint` y `pnpm test` pasan sin errores.
- [ ] Textos tomados de `docs/COPY.md`; nada inventado.
- [ ] Estilos solo con tokens del DESIGN.md; ningún color o tamaño suelto.
- [ ] Revisado en 360 px y 1440 px, con teclado y con `prefers-reduced-motion`.
- [ ] Sin claves ni secretos en el código.

### Plantilla de prompt

```
Tarea E3-04 del docs/TAREAS.md.
Lee CLAUDE.md, docs/TAREAS.md (tarea E3-04), y los requisitos que cita en docs/SRS.md.
Propón un plan en pasos antes de escribir código. No toques archivos fuera del alcance de la tarea.
Al terminar, verifica la definición de terminado y resume los cambios.
```

## 2. Tareas previas de Siete8

No son de desarrollo, pero bloquean tareas concretas. La columna "Bloquea" indica cuáles.

| ID | Tarea | Bloquea |
| --- | --- | --- |
| P-01 | Recomendado, interno: pedir a Click Identy el nombre de la entidad acreditada que respalda la emisión. No se publica en el sitio | Nada |
| P-02 | Hecho: la firma se entrega como archivo .p12 | Copy final de firma (E6-02) |
| P-03 | Hecho: WhatsApp comercial 0961128233, atención de 07:00 a 20:00 | E3-01 |
| P-04 | Crear proyecto en Supabase (cabe en el plan gratuito: hay 1 activo) y compartir URL y claves de forma segura | E1-01 |
| P-05 | Crear repositorio en GitHub y sitio en Netlify conectado | E0-01, E7-01 |
| P-06 | Subir imágenes originales del portafolio | E6-03 |
| P-07 | Hecho: estados del anexo F confirmados; textos limitados al JSON anterior | E6-03 |
| P-08 | Validar textos del documento de copy | E6-02 |
| P-09 | Crear cuentas de Resend y Cloudflare Turnstile | E3-08, E7-03 |
| P-10 | Redactar o aprobar el primer artículo del blog sobre firmas | E6-04 |

## 3. E0 Fundaciones y E1 Datos y autenticación

### E0 Fundaciones

| ID | Tarea | Depende de | Criterios de aceptación | SRS |
| --- | --- | --- | --- | --- |
| E0-01 | Crear el proyecto Next.js (App Router, TypeScript estricto, pnpm) con ESLint, Prettier y Vitest | P-05 | `pnpm build`, `typecheck`, `lint` y `test` funcionan en limpio | RNF-23 |
| E0-02 | Escribir `CLAUDE.md` y crear `/docs` con los documentos | E0-01 | `CLAUDE.md` define stack, comandos, estructura de carpetas, convenciones y reglas: textos solo de COPY.md, estilos solo con tokens, una tarea a la vez | RNF-23 |
| E0-03 | Estructura de carpetas, alias de rutas y validación de variables de entorno con Zod; `.env.example` | E0-01 | La app no arranca si falta una variable; ningún secreto expuesto al cliente | RNF-15 |
| E0-04 | CI en GitHub Actions: typecheck, lint y test en cada PR | E0-01 | Un PR con error de tipos falla el check | RNF-25 |

### E1 Datos y autenticación

| ID | Tarea | Depende de | Criterios de aceptación | SRS |
| --- | --- | --- | --- | --- |
| E1-01 | Configurar Supabase CLI y migraciones versionadas en el repositorio | P-04, E0-03 | `supabase db reset` levanta la base local desde las migraciones | RNF-24 |
| E1-02 | Migración del catálogo: `category`, `service` (con `kind`, `external_app_url`, `visible`), `plan`, `requirement` | E1-01 | Precios guardados sin IVA con `vat_rate`; orden y visibilidad por registro | RF-ADM-02, 03, 12 |
| E1-03 | Migración de contenido: `post`, `post_service`, `project` (5 estados), `project_image`, `project_service` | E1-01 | Estados del proyecto como enum; `published` y `show_client_name` independientes del estado | RF-BLG-01..03, 3.7 |
| E1-04 | Migración de operación: `lead` (con `consent_at`, `source`, `utm`), `site_settings`, `profile` con rol | E1-01 | Un lead no se guarda sin consentimiento | RF-ADM-06, 08; RNF-19 |
| E1-05 | Row Level Security en todas las tablas, con pruebas | E1-02..04 | Anónimo lee solo lo publicado y visible; solo admin escribe; pruebas automatizadas de ambas reglas | RNF-14 |
| E1-06 | Tipos generados desde el esquema y capa de acceso a datos solo de servidor | E1-05 | Ningún componente cliente importa el cliente de Supabase con service role | RNF-15, 23 |
| E1-07 | Autenticación del panel y protección de `/admin` con middleware y verificación de rol | E1-06 | Usuario sin rol admin recibe 403; sesión caducada redirige al login | RF-ADM-01; RNF-18 |
| E1-08 | Bucket de imágenes en Storage con políticas | E1-05 | Lectura pública; escritura solo admin; tipos y tamaño máximo validados | RF-ADM-05 |
| E1-09 | Semilla con el catálogo inicial (anexos A, B, D y E del SRS) | E1-02 | 15 servicios cargados con su visibilidad; planes de firma con precio sin IVA y tasa de 15 % | Anexos A, B, D, E |

## 4. E2 Sistema de diseño y E3 Sitio público

### E2 Sistema de diseño

| ID | Tarea | Depende de | Criterios de aceptación | SRS / diseño |
| --- | --- | --- | --- | --- |
| E2-01 | Tokens del DESIGN.md en Tailwind como variables CSS (claro y oscuro) y Archivo variable con eje `wdth` vía `next/font` | E0-03 | Títulos se ven en ancho 125 %; no hay colores fuera de los tokens; modo oscuro por preferencia del sistema | RNF-10, 11 |
| E2-02 | Componentes base: botón principal y secundario, enlace, tabla de planes, pestañas accesibles, preguntas frecuentes, campo de formulario | E2-01 | Navegables con teclado; foco visible; objetivos táctiles de 44 px o más; historias o página de muestra en `/dev/ui` | RNF-12 |
| E2-03 | Motivo de barras: SVG del hero con animación de carga de 900 ms, separador de categorías y barra de progreso de lectura | E2-01 | Con `prefers-reduced-motion` aparece en su estado final; no se usa como fondo repetido | DESIGN §6 |
| E2-04 | Layout: encabezado con menú Servicios desplegable y menú móvil, pie de página, botón flotante de WhatsApp y utilidad para enlaces `wa.me` con mensaje prellenado | E2-02, P-03 | Los mensajes prellenados coinciden con COPY §2; el botón flotante respeta el área segura en móvil | RF-PUB-08 |

### E3 Sitio público

| ID | Tarea | Depende de | Criterios de aceptación | SRS |
| --- | --- | --- | --- | --- |
| E3-01 | Portada con sus siete secciones, datos del catálogo, proyectos destacados y último artículo | E2-03, E2-04, E1-09 | Coincide con el mockup en 360 y 1440 px; textos de COPY §3; generada estáticamente | RF-PUB-01, 14 |
| E3-02 | Catálogo `/servicios` agrupado por categoría | E1-09, E2-04 | Solo muestra servicios visibles, en el orden definido en el panel | RF-PUB-02 |
| E3-03 | Página de servicio `/servicios/[slug]`: hero, planes con pestañas por tipo, requisitos, preguntas, venta cruzada y CTA por plan | E3-02 | Precio mostrado = precio sin IVA × (1 + tasa), redondeado a 2 decimales; cada "Solicitar" abre WhatsApp con el plan y precio; servicio oculto responde 404 | RF-PUB-03..05, RF-ADM-12, RNF-22 |
| E3-04 | Variante de producto propio para el facturador: planes, demo, botón Ingresar | E3-03 | Se renderiza según `service.kind`; el botón Ingresar usa `external_app_url` | RF-FAC-01..05 |
| E3-05 | Portafolio: listado filtrable por servicio y página de detalle | E1-03, E2-02 | Solo el estado activo muestra enlace; etiquetas públicas según SRS 3.7; nombre del cliente oculto si `show_client_name` es falso | RF-PUB-09, 12, 13; RF-POR-03 |
| E3-06 | Blog: listado paginado y página de artículo en Markdown, con tiempo de lectura, barra de progreso y CTA al servicio relacionado | E1-03, E2-03 | Artículos en borrador o con fecha futura no se muestran | RF-BLG-01..03 |
| E3-07 | Páginas Nosotros, Privacidad, Términos y 404 | E2-04 | La política de privacidad cubre finalidad, base legal y derechos según la LOPDP | RF-PUB-06, 10, 11; RNF-19 |
| E3-08 | Contacto con formulario: consentimiento, Turnstile, guardado del lead y aviso por correo al administrador | E1-04, P-09 | Sin consentimiento no se envía; el lead aparece en el panel con origen "formulario" | RF-PUB-07; RNF-16, 19 |
| E3-09 | Revalidación bajo demanda: ruta protegida que el panel llama al guardar | E3-01..06 | Un cambio de precio en el panel se ve en el sitio en menos de un minuto sin desplegar | RF-ADM-09 |

## 5. E4 Panel de administración

Construido con shadcn/ui y los tokens del DESIGN.md (sección 12). Todas las acciones de escritura validan con Zod en el servidor y llaman a la revalidación de E3-09.

| ID | Tarea | Depende de | Criterios de aceptación | SRS |
| --- | --- | --- | --- | --- |
| E4-01 | Estructura del panel: barra lateral, encabezado, tablas con búsqueda y paginación, formularios y confirmaciones | E1-07, E2-01 | Navegación completa por teclado; mensajes de éxito y error con el mismo verbo de la acción | RF-ADM-01 |
| E4-02 | CRUD de categorías y servicios, con orden por arrastre y visibilidad | E4-01 | Ocultar un servicio lo quita del menú, del sitemap y responde 404, sin borrar datos | RF-ADM-02, 12 |
| E4-03 | CRUD de planes y requisitos dentro de cada servicio | E4-02 | Se edita el precio sin IVA y se muestra la vista previa con IVA | RF-ADM-02, 03 |
| E4-04 | Carga de imágenes con recorte y texto alternativo obligatorio | E1-08, E4-01 | No se guarda una imagen sin texto alternativo | RF-ADM-05 |
| E4-05 | CRUD de artículos: editor Markdown con vista previa, borrador o publicado, fecha programada, servicio relacionado e imagen de portada | E4-04 | Un artículo programado aparece en el sitio en su fecha sin intervención | RF-ADM-04 |
| E4-06 | CRUD de proyectos del portafolio: estado, cliente o sector, galería ordenable, servicios, destacado | E4-04 | Cambiar el estado a "archivado" quita el enlace en el sitio | RF-ADM-10 |
| E4-07 | Leads: listado con filtros por estado, origen y servicio; detalle con notas | E4-01, E1-04 | Cambio de estado nuevo → contactado → cerrado o perdido queda registrado con fecha | RF-ADM-06 |
| E4-08 | Configuración del sitio: WhatsApp, redes sociales, textos de CTA | E4-01 | El número de WhatsApp cambia en todo el sitio al guardar | RF-ADM-08 |

## 6. E5 SEO y analítica, E6 Contenido, E7 Despliegue y operación

### E5 SEO y analítica

| ID | Tarea | Depende de | Criterios de aceptación | SRS |
| --- | --- | --- | --- | --- |
| E5-01 | Metadatos por página generados desde los datos: title, description, canonical, Open Graph y Twitter Card; imagen OG por defecto y por artículo | E3-01..07 | La vista previa de un artículo en WhatsApp muestra imagen y título | RNF-04; RF-BLG-05 |
| E5-02 | Datos estructurados JSON-LD: Organization, LocalBusiness, Service con Offer, Article, FAQPage | E5-01 | Sin errores en la prueba de resultados enriquecidos de Google | RNF-05 |
| E5-03 | `sitemap.xml` y `robots.txt` dinámicos | E3-09 | El sitemap excluye servicios ocultos y borradores | RNF-06 |
| E5-04 | Analítica con consentimiento y eventos de conversión: clic en WhatsApp, lead creado; UTM guardados en el lead | E3-08 | Los eventos llegan con el servicio y el origen | RNF-26; RF-BLG-06 |
| E5-05 | Lighthouse CI en cada PR para portada, servicio y artículo | E0-04 | Rendimiento, SEO y accesibilidad ≥ 90 en móvil; el PR falla si baja | RNF-02, 03, 07 |

### E6 Contenido

| ID | Tarea | Depende de | Criterios de aceptación | SRS |
| --- | --- | --- | --- | --- |
| E6-01 | Script de importación del portafolio anterior: JSON → `project` e imágenes originales a Storage | E1-03, P-06 | Idempotente; corrige las erratas del anexo F; estados según el anexo F | RF-POR-02 |
| E6-02 | Ampliar COPY.md con los servicios visibles que faltan y cargarlos | P-08 | Cada servicio visible tiene descripción, para quién es, qué incluye y preguntas | RF-PUB-03 |
| E6-03 | Revisar y publicar el portafolio: estados, permisos y proyectos destacados | E6-01, P-07 | Ningún proyecto "activo" enlaza a un sitio caído o reemplazado | RF-PUB-09 |
| E6-04 | Publicar el primer artículo del blog sobre firmas | E4-05, P-10 | Vinculado al servicio de firma, con imagen OG | RF-BLG-03 |

E6-02 no es tarea para Claude Code: el copy se redacta aquí, se valida y luego se carga.

### E7 Despliegue y operación

| ID | Tarea | Depende de | Criterios de aceptación | SRS |
| --- | --- | --- | --- | --- |
| E7-01 | Configurar Netlify: adaptador de Next.js, variables de entorno por contexto y vistas previas por rama | P-05, E0-01 | Cada PR genera una URL de vista previa | RNF-25 |
| E7-02 | Dominio siete8.com en Netlify con HTTPS; `www` y siete8.netlify.app redirigen con 301 | E8-03 | Los registros MX, SPF, DKIM y DMARC del correo en DreamHost siguen intactos; se prueba enviar y recibir a hola@siete8.com después del cambio | RNF-08 |
| E7-03 | Encabezados de seguridad: CSP, HSTS, X-Frame-Options, Referrer-Policy | E7-01 | Calificación A en securityheaders.com; Turnstile y analítica siguen funcionando | RNF-17 |
| E7-04 | Función programada diaria de keep-alive a Supabase | E7-01 | Registro de ejecución diario visible en Netlify | RNF-29 |
| E7-05 | Respaldo diario con `pg_dump` desde GitHub Actions, retención de 30 días | E1-01 | Restauración probada una vez en una base local | RNF-30 |
| E7-06 | Monitoreo de errores con Sentry en cliente y servidor | E7-01 | Un error forzado aparece en Sentry con la ruta | RNF-27 |
| E7-07 | Imágenes servidas por el CDN de imágenes de Netlify | E3-05 | Ninguna imagen pública se sirve directo desde Supabase | RNF-31 |
| E7-08 | Revisión semanal de enlaces de proyectos activos, con aviso por correo | E6-03 | Aviso al administrador si una URL no responde; el estado no cambia solo | RF-POR-01 |

## 7. E8 QA y lanzamiento; orden de ejecución

### E8 QA y lanzamiento

| ID | Tarea | Depende de | Criterios de aceptación | SRS |
| --- | --- | --- | --- | --- |
| E8-01 | Pruebas de extremo a extremo con Playwright de los flujos críticos | E3, E4 | Cubre: solicitar un plan abre WhatsApp con el texto correcto; formulario crea lead; cambio de precio en el panel se refleja en el sitio; servicio oculto responde 404 | 7.1 |
| E8-02 | Auditoría de accesibilidad con axe y revisión manual con teclado y lector de pantalla | E3 | Cero errores críticos de axe en portada, servicio, artículo y contacto | RNF-12 |
| E8-03 | Revisión previa al lanzamiento con los criterios de aceptación del MVP | E8-01, E8-02 | Todos los puntos de SRS 7.1 marcados; pendientes de COPY §5 resueltos | 7.1 |
| E8-04 | Lanzamiento: cambio de dominio, envío del sitemap a Search Console y publicación del artículo | E8-03, E7-02 | Sitio en siete8.com; sitemap aceptado; correo funcionando | 7.1 |
| E8-05 | Seguimiento de la primera semana: errores, eventos de conversión e indexación | E8-04 | Informe corto con clics a WhatsApp, leads y páginas indexadas | RNF-26 |

### Orden de ejecución

El lanzamiento se divide en dos hitos para empezar a vender firmas antes de terminar todo el MVP.

**Hito A: firma y blog en línea.** Portada, catálogo, página de firma, blog con el primer artículo y el panel mínimo para editar precios y artículos.

| Bloque | Tareas |
| --- | --- |
| A1 Base | E0-01..04, E1-01..09, E7-01 |
| A2 Diseño y páginas | E2-01..04, E3-01, E3-02, E3-03, E3-06, E3-07, E3-09 |
| A3 Panel mínimo | E4-01, E4-02, E4-03, E4-04, E4-05, E4-08 |
| A4 SEO y salida | E5-01..03, E6-04, E7-02..06, E8-01..04 (sobre lo construido) |

**Hito B: MVP completo.** Portafolio, contacto con leads, facturador, analítica completa y operación.

| Bloque | Tareas |
| --- | --- |
| B1 Portafolio | E1-03 (si faltó), E6-01, E3-05, E4-06, E6-03, E7-07, E7-08 |
| B2 Leads | E3-08, E4-07, E5-04 |
| B3 Producto propio | E3-04 (solo si el facturador ya está en producción) |
| B4 Calidad | E5-05, E6-02, E8-05 |

La ruta crítica del hito A es P-04 → E1-01 → E1-02 → E1-09 → E3-03 → E8-04. Antes de E8-04 deben estar resueltos los pendientes de COPY §5.

## 8. Fase 1.1

Se detalla en tareas cuando el hito B esté en producción. Por ahora, alcance a nivel de épica.

| Épica | Alcance | Requisitos | Condición de entrada |
| --- | --- | --- | --- |
| E9 Cotizador | Tablas `quote_item` y `quote`, asistente paso a paso con subtotal en vivo, reglas de dependencia, resultado con rango y plazo, envío a WhatsApp, CRUD de ítems en el panel | RF-COT-01..10 | Precios del anexo C validados contra costos reales |
| E10 Asistente con IA | Ruta `/api/chat` con streaming y la API de Anthropic, contexto limitado al catálogo publicado, herramienta de creación de lead, handoff a WhatsApp, límites por sesión e IP, activación desde el panel, registro de conversaciones | RF-AST-01..09; RNF-15, 16, 28 | Catálogo completo cargado y copy de todos los servicios visibles aprobado |

Criterio de salida de la fase 1.1: 20 conversaciones reales revisadas sin respuestas inventadas y cotizaciones con precios coherentes con las propuestas formales.
