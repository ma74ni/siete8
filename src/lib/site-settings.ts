import { z } from "zod";

/**
 * Site settings edited in the panel (E4-08, RF-ADM-08): WhatsApp, opening
 * hours, phone, email and social networks. They live in `site_settings`
 * (one row per key) and every public page reads them, so a change shows on
 * the whole site without a deploy.
 */

export type SocialLink = { label: string; url: string };

export type SiteSettings = {
  whatsapp: {
    /** As people dial it in Ecuador: 0967155626. */
    number: string;
    /** For wa.me links: 593967155626. */
    waMe: string;
    /** Opening hours, "HH:MM", every day. */
    from: string;
    to: string;
  };
  phone: string;
  email: string;
  social: SocialLink[];
};

/** Used when a row is missing, so the site never renders without contact. */
export const DEFAULT_SETTINGS: SiteSettings = {
  whatsapp: {
    number: "0967155626",
    waMe: "593967155626",
    from: "07:00",
    to: "20:00",
  },
  phone: "0999843108",
  email: "hola@siete8.com",
  social: [
    { label: "Facebook", url: "https://www.facebook.com/siete8.ec" },
    { label: "Instagram", url: "https://www.instagram.com/siete8.ec" },
    { label: "LinkedIn", url: "https://www.linkedin.com/company/siete8.ec" },
  ],
};

/** "0967155626" or "+593 96 715 5626" → "593967155626" (Ecuador's code). */
export function toWaMe(number: string): string {
  const digits = number.replace(/\D/g, "");
  return digits.startsWith("0") ? `593${digits.slice(1)}` : digits;
}

/** "593967155626" → "+593967155626", for tel: links and structured data. */
export function toTel(number: string): string {
  return `+${toWaMe(number)}`;
}

/** "Todos los días, de 07:00 a 20:00" (COPY §2). */
export function hoursText(settings: SiteSettings): string {
  return `Todos los días, de ${settings.whatsapp.from} a ${settings.whatsapp.to}`;
}

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const whatsappRow = z.object({
  number: z.string().regex(/^0\d{9}$/),
  wa_me: z.string().regex(/^\d{11,15}$/),
  hours: z.object({ from: time, to: time }),
});
const contactRow = z.object({ phone: z.string().min(7), email: z.email() });
const socialRow = z.array(z.object({ label: z.string().min(1), url: z.url() }));

/**
 * Settings from the `site_settings` rows. A missing or malformed row falls
 * back to its default instead of breaking every page.
 */
export function parseSettings(
  rows: { key: string; value: unknown }[],
): SiteSettings {
  const value = (key: string) => rows.find((row) => row.key === key)?.value;
  const whatsapp = whatsappRow.safeParse(value("whatsapp"));
  const contact = contactRow.safeParse(value("contact"));
  const social = socialRow.safeParse(value("social"));
  return {
    whatsapp: whatsapp.success
      ? {
          number: whatsapp.data.number,
          waMe: whatsapp.data.wa_me,
          from: whatsapp.data.hours.from,
          to: whatsapp.data.hours.to,
        }
      : DEFAULT_SETTINGS.whatsapp,
    phone: contact.success ? contact.data.phone : DEFAULT_SETTINGS.phone,
    email: contact.success ? contact.data.email : DEFAULT_SETTINGS.email,
    social: social.success ? social.data : DEFAULT_SETTINGS.social,
  };
}

/** Panel form (E4-08). Up to 8 networks; empty rows are dropped. */
export const settingsForm = z
  .object({
    whatsapp: z
      .string()
      .transform((value) => value.replace(/[\s-]/g, ""))
      .pipe(z.string().regex(/^0\d{9}$/)),
    from: time,
    to: time,
    phone: z
      .string()
      .transform((value) => value.replace(/[\s-]/g, ""))
      .pipe(z.string().regex(/^0\d{8,9}$/)),
    email: z.email(),
    social: z
      .array(z.object({ label: z.string().trim(), url: z.string().trim() }))
      .transform((rows) => rows.filter((row) => row.label || row.url))
      .pipe(
        z
          .array(
            z.object({
              label: z.string().min(1).max(30),
              url: z.string().regex(/^https:\/\/\S+$/),
            }),
          )
          .max(8),
      ),
  })
  .refine((form) => form.from < form.to, { path: ["to"] });
