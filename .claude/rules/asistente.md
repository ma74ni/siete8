---
paths:
  - "src/server/assistant.ts"
  - "src/server/admin-assistant*.ts"
  - "src/lib/assistant*.ts"
  - "src/app/api/chat/**"
  - "src/components/admin/conversation.tsx"
---

# Asistente del sitio (E10)

- Código en `src/server/assistant.ts` y las rutas `api/chat/session` (inicia con aviso de privacidad y Turnstile) y `api/chat` (responde en streaming, una línea JSON por `ChatEvent`).
- Modelo `ASSISTANT_MODEL` y límites `LIMITS` en `@/lib/assistant`; el prompt de sistema (reglas fijas más el catálogo publicado, precios con `formatPriceWithVat`) en `@/lib/assistant-prompt`, y el panel solo agrega las instrucciones del negocio.
- El historial se lee de la base, nunca del navegador. Las conversaciones viven en `chat_session` y `chat_message` (solo admin lee; el servidor escribe con la clave secreta) y la IP se guarda solo como HMAC.
- La herramienta `registrar_contacto` crea el lead con origen `assistant` y devuelve el enlace de WhatsApp con el resumen.
- `assistant_enabled` (público) decide si el chat reemplaza al botón de WhatsApp; `assistant` (privado) guarda las instrucciones y el tope mensual, que apaga el chat al alcanzarse (`chat_cost_since`). Se edita en el panel (Asistente).
- La clave de Anthropic (`ANTHROPIC_API_KEY`) solo existe en código de servidor. Sin ella no se muestra el chat, aunque esté activado en el panel.
- Un fallo que el visitante solo ve como aviso se reporta con `Sentry.captureException`/`captureMessage`.
