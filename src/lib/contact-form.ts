import { z } from "zod";

/**
 * Contact form (E3-08, RF-PUB-07): validation of what the browser sends and
 * the notification email. Pure, shared by the Server Action and the tests.
 */

/**
 * "099 123-4567" → "0991234567", "+593 (99) 123 4567" → "+593991234567":
 * one way to write each number, so the rate limit recognizes repeats.
 */
export function normalizePhone(value: string): string {
  return value.replace(/[\s\-().]/g, "");
}

const optionalText = (max: number) =>
  z
    .string()
    .optional()
    .transform((value) => value?.trim() || null)
    .pipe(z.string().max(max).nullable());

/** UTM fields kept from the landing page (see CAMPAIGN_KEY in @/lib/analytics). */
const UTM_KEYS = {
  campaign_source: "source",
  campaign_medium: "medium",
  campaign_name: "campaign",
  campaign_term: "term",
  campaign_content: "content",
} as const;

/** The hidden `utm` field: JSON of campaign fields → `{ source, medium, … }`. */
export function parseUtm(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const utm: Record<string, string> = {};
    for (const [field, key] of Object.entries(UTM_KEYS)) {
      const text = (value as Record<string, unknown>)[field];
      if (typeof text === "string" && text.trim()) {
        utm[key] = text.trim().slice(0, 100);
      }
    }
    return utm;
  } catch {
    return {};
  }
}

export const leadForm = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z
    .string()
    .transform(normalizePhone)
    .pipe(z.string().regex(/^\+?[0-9 ]{7,20}$/)),
  email: optionalText(200).pipe(z.email().nullable()),
  service: optionalText(80),
  message: optionalText(2000),
  // LOPDP (RNF-19): without consent nothing is saved.
  consent: z.literal("on"),
  // Honeypot: hidden from people, filled by bots.
  website: z.string().max(0).optional(),
  utm: z.string().optional().transform(parseUtm),
});

export type LeadForm = z.infer<typeof leadForm>;

/** Answer of the contact form's Server Action. */
export type ContactState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | {
      status: "error";
      message: string;
      fields?: string[];
      /** What the visitor typed: React clears the form after each answer. */
      values?: Record<string, string>;
      /** Changes on every answer, so the fields reload the values. */
      at?: number;
    };

/** Fields given back after an error (never the token or the honeypot). */
export const KEPT_FIELDS = [
  "name",
  "phone",
  "email",
  "service",
  "message",
] as const;

/** Which fields failed, to mark them in the form. */
export function invalidFields(error: z.ZodError): string[] {
  return [...new Set(error.issues.map((issue) => String(issue.path[0])))];
}

/** Plain-text email to the admin about a new lead. */
export function leadEmail(
  lead: Pick<LeadForm, "name" | "phone" | "email" | "message" | "utm"> & {
    serviceName: string | null;
  },
  panelUrl: string,
): { subject: string; text: string } {
  const utm = Object.entries(lead.utm)
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");
  const lines = [
    `Nombre: ${lead.name}`,
    `Celular: ${lead.phone}`,
    lead.email ? `Correo: ${lead.email}` : null,
    lead.serviceName ? `Servicio: ${lead.serviceName}` : null,
    utm ? `Origen: ${utm}` : null,
    "",
    lead.message ?? "(Sin mensaje)",
    "",
    `Ver en el panel: ${panelUrl}`,
  ].filter((line): line is string => line !== null);
  return {
    subject: `Nuevo contacto desde el sitio: ${lead.name}${lead.serviceName ? ` (${lead.serviceName})` : ""}`,
    text: lines.join("\n"),
  };
}
