---
name: release
description: Prepara el PR de dev a master para desplegar a producción en Netlify, con el resumen de tareas incluidas y los riesgos. Solo se usa cuando el usuario lo pide.
disable-model-invocation: true
---

# Release: PR de `dev` a `master`

`master` despliega a producción en cuanto se fusiona. Este skill **solo abre el PR**; nunca lo fusiona ni hace push a `master`.

1. **Actualizar.** `git fetch origin`.
2. **Qué entra.** `git log --oneline origin/master..origin/dev` y `gh pr list --base dev --state merged --limit 30` para listar las tareas (E*-*) fusionadas desde el último despliegue. Si no hay commits nuevos, avisa y detente.
3. **Riesgos.** Revisa `git diff --stat origin/master...origin/dev` y señala:
   - Migraciones nuevas en `supabase/migrations/`: hay que aplicarlas al remoto **antes o junto** con el despliegue. No las apliques tú; indica cuáles son.
   - Variables de entorno nuevas en `src/env/schema.ts` o `.env.example`: deben existir en Netlify (contexto de producción) antes de fusionar, o el build falla.
   - Cambios en `netlify.toml`, `netlify/functions/` o `.github/workflows/`.
4. **Checks.** `gh pr checks` del último PR a `dev` o `gh run list --branch dev --limit 3`: `CI` y `Database` deben estar en verde.
5. **Abrir el PR** con título `Release: <fecha>` y un cuerpo con: tareas incluidas, migraciones a aplicar, variables nuevas, y pasos de verificación en producción.
   ```
   gh pr create --base master --head dev --title "Release: AAAA-MM-DD" --body-file <archivo>
   ```
6. Devuelve el enlace del PR. La fusión la hace el usuario cuando el preview de Netlify esté revisado.
