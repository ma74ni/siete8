---
name: tarea
description: Arranca una tarea de docs/TAREAS.md (por ejemplo E3-04) leyendo sus requisitos, creando la rama desde dev y proponiendo un plan. Úsalo cuando el usuario pida trabajar en una tarea por su id.
argument-hint: <id de la tarea, por ejemplo E3-04>
---

# Arrancar la tarea $ARGUMENTS

1. **Leer la tarea.** Busca la fila de `$ARGUMENTS` en `docs/TAREAS.md`: objetivo, criterios de aceptación, dependencias y requisitos citados. Si no existe o depende de una tarea sin terminar, avisa y detente.
2. **Leer los requisitos.** Abre en `docs/SRS.md` cada `RF-*`/`RNF-*` que cita la tarea. Si toca textos visibles, ubica sus secciones en `docs/COPY.md`; si toca interfaz, las de `docs/DESIGN.md` y los mockups de `docs/mockups/`.
3. **Leer las reglas del área.** Según los archivos que vas a tocar, lee las reglas que correspondan en `.claude/rules/` (la tabla "Reglas por área" del CLAUDE.md dice cuál cubre qué).
4. **Revisar el estado de git.** `git status` debe estar limpio. Si hay cambios sin confirmar, pregunta qué hacer con ellos antes de cambiar de rama.
5. **Crear la rama** desde `dev` actualizado:
   ```
   git fetch origin
   git switch -c feat/$ARGUMENTS-<nombre-corto> origin/dev
   ```
   `<nombre-corto>` en kebab-case y en español, como en los ejemplos de TAREAS (`feat/E3-04-pagina-servicio`).
6. **Proponer el plan.** Pasos cortos, archivos que se crean o cambian, migraciones (si hay), pruebas nuevas y cómo se verifica cada criterio de aceptación. Señala textos que falten en COPY (`[COPY PENDIENTE: ...]`) y dudas abiertas.
7. **Esperar aprobación.** No escribas código hasta que el usuario apruebe el plan.
