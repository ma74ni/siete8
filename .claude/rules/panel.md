---
paths:
  - "src/app/admin/**"
  - "src/components/admin/**"
  - "src/server/admin-*.ts"
  - "src/server/auth*.ts"
  - "src/lib/admin-*.ts"
  - "src/lib/image-resize.ts"
  - "src/proxy.ts"
---

# Panel de administración

- Toda escritura del panel se valida con Zod en el servidor y verifica el rol admin.
- El panel (`/admin`) se protege en dos capas: `src/proxy.ts` (el middleware de Next 16) redirige al login sin sesión y responde 403 sin rol admin; además, el layout del panel y **toda** Server Action del panel llaman primero a `requireAdmin()` (`@/server/auth`). Los registros públicos de Supabase Auth están cerrados; las cuentas del panel se crean a mano.
- Los esquemas de formulario viven en `@/lib/admin-forms` (con pruebas); las lecturas en `src/server/admin-<área>.ts` y las Server Actions en `src/server/admin-<área>-actions.ts` (por ejemplo, `admin-catalog.ts` y `admin-catalog-actions.ts`), que escriben con `createSessionClient()` (RLS de admin) y terminan con `revalidatePath("/", "layout")`, así el cambio se ve en el sitio sin desplegar.
- Los formularios usan `ActionForm` (mensaje con el mismo verbo del botón) y `DeleteButton` (confirmación en línea). El panel usa los componentes del sitio, los de formulario (`src/components/form/`, DESIGN §7.1) y la clase `.panel` (títulos en `wdth` 100, DESIGN §12). Los campos conservan lo escrito tras un error de la acción (`ActionForm`).
- Imágenes: `uploadImage`/`removeImage` de `src/server/admin-action-helpers.ts`, validadas con `imageFile`. En el navegador, `ImageField` (`@/components/admin/image-field`) decodifica el archivo y, si pesa más de 2 MB o no es de un tipo aceptado, lo reduce a WebP (lado mayor 2400 px) antes de enviarlo: así nunca se pasa del límite de 3 MB de las Server Actions. Las de galería exigen texto alternativo; las portadas son decorativas (el título va al lado). `images.dangerouslyAllowLocalIP` solo se activa cuando Supabase corre en local.
- `src/proxy.ts` no debe interceptar el túnel de Sentry `/monitoring`.
