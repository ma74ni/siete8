---
paths:
  - "src/server/leads.ts"
  - "src/server/turnstile.ts"
  - "src/server/notify.ts"
  - "src/server/admin-leads*.ts"
  - "src/lib/contact-form.ts"
  - "src/lib/lead-status.ts"
  - "src/components/sitio/contact-form.tsx"
  - "src/components/sitio/campaign-capture.tsx"
  - "src/components/sitio/turnstile.ts"
  - "src/app/(sitio)/contacto/**"
---

# Leads y formulario de contacto

- Un lead no se guarda sin consentimiento (`consent_at`). El sitio y cualquier formulario nunca piden ni guardan documentos de identidad: esos se envían por WhatsApp.
- `submitLead` en `src/server/leads.ts` (E3-08) valida en este orden: honeypot (`website`), Turnstile, esquema `leadForm` de `@/lib/contact-form` (consentimiento incluido) y un límite de 3 envíos por celular o correo cada 10 minutos; solo entonces inserta con `createAdminClient()`, y avisa por Resend a `ADMIN_NOTIFICATION_EMAIL`.
- El celular se guarda normalizado (sin espacios ni guiones). Tras un error devuelve lo escrito, porque React vacía el formulario.
- El historial de estados del lead lo escribe el trigger `record_lead_status` en `lead_status_event`.
- `CampaignCapture` guarda los UTM de la página de llegada para GA y para el lead.
- Sin `TURNSTILE_SECRET_KEY` no se muestra el formulario; sin Resend se guarda el lead pero no llega el correo.
