"use server";

import "server-only";

import { clientEnv } from "@/env/client";
import { serverEnv } from "@/env/server";
import { formValues } from "@/lib/admin-forms";
import {
  type ContactState,
  invalidFields,
  KEPT_FIELDS,
  leadEmail,
  leadForm,
} from "@/lib/contact-form";
import { notify } from "@/server/notify";
import { createAdminClient } from "@/server/supabase/admin";
import { getSiteSettings } from "@/server/site-settings";
import { passesTurnstile } from "@/server/turnstile";
import { hoursText, type SiteSettings } from "@/lib/site-settings";

// Contact form (E3-08, RF-PUB-07, RNF-16, RNF-19). Texts from docs/COPY.md §10.

// The number and hours come from the site settings (E4-08).
function sent(settings: SiteSettings): ContactState {
  return {
    status: "success",
    message: `Recibimos tu mensaje. Te escribimos por WhatsApp o al correo, ${hoursText(settings).toLowerCase()}.`,
  };
}

function failed(settings: SiteSettings): ContactState {
  return {
    status: "error",
    message: `No pudimos enviar tu mensaje. Inténtalo de nuevo o escríbenos por WhatsApp al ${settings.whatsapp.number}.`,
  };
}

/** Same phone or email more than this many times in 10 minutes: rejected. */
const MAX_RECENT = 3;

/**
 * Saves a lead from the contact form. Only after the honeypot, Turnstile,
 * the Zod schema (consent included) and the rate limit pass does it write,
 * with the secret key: anon has no insert policy on `lead`.
 */
export async function submitLead(
  state: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const result = await handleLead(formData);
  if (result.status !== "error") return result;
  const values = formValues(formData);
  return {
    ...result,
    values: Object.fromEntries(
      KEPT_FIELDS.map((key) => [key, values[key] ?? ""]),
    ),
    at: Date.now(),
  };
}

async function handleLead(formData: FormData): Promise<ContactState> {
  const values = formValues(formData);
  const settings = await getSiteSettings();
  const SENT = sent(settings);
  const FAILED = failed(settings);

  // A bot filled the hidden field: answer as if it worked, save nothing.
  if (values.website) return SENT;

  const secret = serverEnv.TURNSTILE_SECRET_KEY;
  if (!secret || !clientEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return FAILED;

  const parsed = leadForm.safeParse(values);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisa los campos marcados.",
      fields: invalidFields(parsed.error),
    };
  }
  const lead = parsed.data;

  if (!(await passesTurnstile(values["cf-turnstile-response"] ?? "", secret))) {
    return {
      status: "error",
      message:
        "No pudimos comprobar que no eres un robot. Espera a que aparezca la marca de verificación y envía de nuevo.",
    };
  }

  const supabase = createAdminClient();
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  // One query per contact field: the values go as parameters, never inside
  // a filter string built from user input.
  const recent = async (column: "phone" | "email", value: string) => {
    const { count, error } = await supabase
      .from("lead")
      .select("id", { count: "exact", head: true })
      .eq(column, value)
      .gte("created_at", since);
    return error ? null : (count ?? 0);
  };
  const byPhone = await recent("phone", lead.phone);
  const byEmail = lead.email ? await recent("email", lead.email) : 0;
  if (byPhone === null || byEmail === null) return FAILED;
  const count = Math.max(byPhone, byEmail);
  if ((count ?? 0) >= MAX_RECENT) {
    return {
      status: "error",
      message: `Ya recibimos tus mensajes. Te escribimos pronto; si es urgente, escríbenos por WhatsApp al ${settings.whatsapp.number}.`,
    };
  }

  // Only visible services can be chosen.
  const { data: service } = lead.service
    ? await supabase
        .from("service")
        .select("id, name")
        .eq("slug", lead.service)
        .eq("visible", true)
        .maybeSingle()
    : { data: null };

  const { data: saved, error } = await supabase
    .from("lead")
    .insert({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      message: lead.message,
      service_id: service?.id ?? null,
      source: "form",
      utm: lead.utm,
      consent_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) return FAILED;

  const email = leadEmail(
    { ...lead, serviceName: service?.name ?? null },
    new URL(
      `/admin/leads/${saved.id}`,
      clientEnv.NEXT_PUBLIC_SITE_URL,
    ).toString(),
  );
  await notify(email.subject, email.text, lead.email);
  return SENT;
}
