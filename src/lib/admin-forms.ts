import { z } from "zod";

/**
 * Schemas of the panel forms (E4-02, E4-03). They parse `FormData` values
 * as sent by the browser: empty text means "no value", checkboxes are "on"
 * or missing, and prices accept a decimal comma. Server Actions validate
 * with them before writing (CLAUDE.md: every panel write is checked with Zod).
 */

/** Trimmed text; an empty field becomes null. */
const optionalText = (max: number) =>
  z
    .string()
    .optional()
    .transform((value) => value?.trim() || null)
    .pipe(z.string().max(max).nullable());

const requiredText = (max: number) => z.string().trim().min(1).max(max);

/** Unchecked checkboxes are not sent at all. */
const checkbox = z
  .string()
  .optional()
  .transform((value) => value === "on");

/** "17,99" or "17.99" → 17.99, with at most two decimals. */
export const money = z
  .string()
  .trim()
  .transform((value) => value.replace(",", "."))
  .pipe(z.string().regex(/^\d{1,8}(\.\d{1,2})?$/))
  .transform(Number);

/** VAT typed as a percentage ("15") and stored as a rate (0.15). */
const vatPercent = z
  .string()
  .trim()
  .transform((value) => value.replace(",", "."))
  .pipe(z.string().regex(/^\d{1,3}(\.\d{1,2})?$/))
  .transform(Number)
  .pipe(z.number().min(0).max(100))
  .transform((percent) => Math.round(percent * 100) / 10_000);

const order = z.coerce.number().int().min(0).max(10_000);

export const holderType = z.enum(["natural", "legal_entity", "not_applicable"]);

export const serviceForm = z.object({
  id: z.uuid(),
  visible: checkbox,
  summary: optionalText(400),
  requirements_intro: optionalText(400),
  closing_title: optionalText(120),
  seo_title: optionalText(70),
  seo_description: optionalText(160),
  related_service_id: z
    .string()
    .optional()
    .transform((value) => value || null)
    .pipe(z.uuid().nullable()),
  cross_sell_text: optionalText(300),
  cross_sell_cta: optionalText(60),
});

export const planForm = z.object({
  id: z.uuid().optional(),
  service_id: z.uuid(),
  name: requiredText(60),
  holder_type: holderType,
  price_without_vat: money,
  vat_rate: vatPercent,
  visible: checkbox,
  recommended: checkbox,
  sort_order: order,
});

export const idForm = z.object({ id: z.uuid() });

/** One requirement per line; blank lines are dropped. */
export const requirementLines = z
  .string()
  .transform((value) =>
    value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.string().max(300)).max(20));

export const requirementsForm = z.object({
  service_id: z.uuid(),
  holder_type: holderType,
  items: requirementLines,
});

export const stepForm = z.object({
  id: z.uuid().optional(),
  service_id: z.uuid(),
  body: requiredText(300),
  sort_order: order,
});

export const faqForm = z.object({
  id: z.uuid().optional(),
  service_id: z.uuid(),
  question: requiredText(200),
  answer: requiredText(1000),
  sort_order: order,
});

/** An empty note removes it. */
export const holderNoteForm = z.object({
  service_id: z.uuid(),
  holder_type: holderType,
  body: optionalText(300),
});

// Portfolio (E4-06) ------------------------------------------------------------

/** Same rule as the `slug` check constraints in the database. */
export const slug = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  .max(80);

/** Lowercase, accents removed, words joined by hyphens: "Año Nuevo" → "ano-nuevo". */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

export const projectStatus = z.enum([
  "in_development",
  "active",
  "internal",
  "replaced",
  "archived",
]);

export const projectForm = z
  .object({
    id: z.uuid().optional(),
    title: requiredText(120),
    slug,
    status: projectStatus,
    client_name: optionalText(120),
    show_client_name: checkbox,
    sector: optionalText(120),
    year: z
      .string()
      .optional()
      .transform((value) => (value?.trim() ? Number(value) : null))
      .pipe(z.number().int().min(2000).max(2100).nullable()),
    summary: optionalText(300),
    challenge_md: optionalText(5000),
    solution_md: optionalText(5000),
    results_md: optionalText(5000),
    /** Comma separated: "Laravel, MySQL". */
    tech_stack: z
      .string()
      .optional()
      .transform((value) =>
        (value ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      )
      .pipe(z.array(z.string().max(40)).max(20)),
    live_url: optionalText(300).pipe(
      z
        .string()
        .regex(/^https:\/\/\S+$/)
        .nullable(),
    ),
    featured: checkbox,
    published: checkbox,
    sort_order: order,
  })
  // Same rule as the database: the card shows the client's name or the sector.
  .refine(
    (project) =>
      project.show_client_name
        ? project.client_name !== null
        : project.sector !== null,
    { path: ["sector"] },
  );

/** Images accepted by the Storage bucket (E1-08). */
export const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export const imageFile = z
  .instanceof(File)
  .refine((file) => file.size > 0 && file.size <= MAX_IMAGE_BYTES)
  .refine((file) => IMAGE_TYPES.includes(file.type));

export const projectImageForm = z.object({
  project_id: z.uuid(),
  alt: requiredText(200),
  device: z.enum(["desktop", "mobile"]),
  sort_order: order,
});

export const projectCoverForm = z.object({ project_id: z.uuid() });

export const projectServicesForm = z.object({
  project_id: z.uuid(),
  service_ids: z.array(z.uuid()).max(20),
});

/** Result of a panel Server Action, shown next to its form. */
export type FormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export const IDLE: FormState = { status: "idle" };

/** Plain object from FormData, for `schema.safeParse`. */
export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData) {
    if (typeof value === "string") values[key] = value;
  }
  return values;
}
