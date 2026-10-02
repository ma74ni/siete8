"use server";

import "server-only";

import type { FormState } from "@/lib/admin-forms";
import { settingsForm, toWaMe } from "@/lib/site-settings";
import { failed, INVALID, refreshSite } from "@/server/admin-action-helpers";
import { requireAdmin } from "@/server/auth";
import { createSessionClient } from "@/server/supabase/session";

// Site settings (E4-08, RF-ADM-08). Texts from docs/COPY.md §13.

export async function saveSettings(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const labels = formData.getAll("social_label").map(String);
  const urls = formData.getAll("social_url").map(String);
  const parsed = settingsForm.safeParse({
    whatsapp: String(formData.get("whatsapp") ?? ""),
    from: String(formData.get("from") ?? ""),
    to: String(formData.get("to") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    social: labels.map((label, index) => ({ label, url: urls[index] ?? "" })),
  });
  if (!parsed.success) return INVALID;
  const form = parsed.data;

  const supabase = await createSessionClient();
  const { error } = await supabase.from("site_settings").upsert(
    [
      {
        key: "whatsapp",
        value: {
          number: form.whatsapp,
          wa_me: toWaMe(form.whatsapp),
          hours: { from: form.from, to: form.to },
        },
        is_public: true,
      },
      {
        key: "contact",
        value: { phone: form.phone, email: form.email },
        is_public: true,
      },
      { key: "social", value: form.social, is_public: true },
    ],
    { onConflict: "key" },
  );
  if (error) return failed("guardar la configuración");
  // Every page shows the WhatsApp button and the footer.
  refreshSite();
  return { status: "success", message: "Configuración guardada." };
}
