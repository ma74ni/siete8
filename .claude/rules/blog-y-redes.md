---
paths:
  - "src/app/(sitio)/blog/**"
  - "src/server/blog.ts"
  - "src/server/admin-blog*.ts"
  - "src/lib/blog.ts"
  - "src/lib/announce.ts"
  - "src/lib/rss.ts"
  - "src/components/sitio/post-list.tsx"
  - "src/components/admin/post-fields.tsx"
  - "netlify/functions/announce-posts.mts"
  - "docs/MAKE.md"
---

# Blog y publicación en redes

- Fechas en hora de Quito con `@/lib/blog` (`formatPostDate`, `toQuitoInput`, `fromQuitoInput`); el autor visible es `post.author_name` (o "Siete8"), porque `profile` es privado.
- El layout de `(sitio)` tiene `revalidate = 3600`: un artículo programado aparece en su fecha con un margen de una hora como máximo, sin que nadie guarde en el panel.
- Redes sociales: `netlify/functions/announce-posts.mts` corre cada 15 minutos (solo en producción) y envía al webhook de Make (`MAKE_WEBHOOK_URL`) cada artículo publicado, con fecha pasada y `post.social_sent_at` nulo; después lo marca. La lógica está en `@/lib/announce` (con pruebas) y usa la clave secreta por REST, como tarea del sistema.
- La portada va como JPEG por `/.netlify/images` (Instagram no acepta WebP), por eso `netlify.toml` permite las imágenes de Storage. Los pasos de Make están en `docs/MAKE.md`.
- `/blog/rss.xml` (`@/lib/rss`) queda para lectores de RSS.
