---
paths:
  - "netlify.toml"
  - "netlify/**"
  - "package.json"
  - ".github/**"
  - "public/**"
  - "supabase/config.toml"
---

# Infraestructura: Netlify, dominio, CI y respaldos

## Netlify

- La configuración de build de Netlify se declara en `netlify.toml`, no en la interfaz de Netlify. El adaptador `@netlify/plugin-nextjs` va declarado ahí y fijado en `package.json`, y necesita `publish = ".next"`; sin él Netlify publica la carpeta `.next` como estática y todo da 404.
- En la interfaz de Netlify, la versión de Node debe ser 22 (Dependency management): los plugins de build usan esa versión, no la del `netlify.toml`.
- `pnpm build` borra `.next/cache/fetch-cache` antes de compilar: Next reutiliza ahí las respuestas de Supabase entre builds (y Netlify conserva `.next/cache`), lo que dejaría precios o menús viejos.
- `dev` y `master` exigen dos checks para fusionar: `CI` y `netlify/siete8/deploy-preview`.
- `public/ce24dd8215336358aaaadd8607c5a049.txt` es la verificación de dominio de Mailjet del sitio anterior. No se borra sin confirmarlo con el usuario.

## Dominio y correo

- Dominio: siete8.com, registrado en Namecheap, con el DNS en **Netlify DNS** (NS1): los registros se agregan en Netlify > Domains, no en Namecheap.
- El correo vive en DreamHost y sus registros de la raíz (MX, SPF, DKIM y DMARC) no se tocan.
- Resend usa solo `resend._domainkey` (TXT), `send` y `rsend` (CNAME).
- El facturador envía con Mailjet y firma con `mailjet._domainkey` (TXT): no se borra. Su SPF no se agrega a la raíz; DMARC pasa con el DKIM.

## Respaldos

- `.github/workflows/backup.yml` hace cada día a las 03:00 (Quito) un `pg_dump` del esquema `public`, lo cifra con `BACKUP_PASSPHRASE` (el repo es público y sus artefactos se pueden descargar) y lo guarda 30 días como artefacto del workflow. Secretos: `SUPABASE_DB_URL` (cadena del _Session pooler_, porque el host directo es solo IPv6) y `BACKUP_PASSPHRASE`. No incluye los usuarios de Auth ni los archivos de Storage.
- Restaurar en la base local: descargar el artefacto, `gpg --decrypt siete8-AAAA-MM-DD.dump.gpg > siete8.dump` y `pg_restore --clean --if-exists --no-owner --schema=public -d postgresql://postgres:postgres@127.0.0.1:54322/postgres siete8.dump`. En el remoto solo se restaura si el usuario lo pide.
