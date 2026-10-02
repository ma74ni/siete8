import { z } from "zod";

import { normalizePhone } from "@/lib/contact-form";

/**
 * Assistant on the site (E10, RF-AST-01..09). Pure parts shared by the chat
 * route, the chat window and the panel: limits, settings, cost and the
 * contact tool. Texts from docs/COPY.md §18.
 */

/** Best quality for the price for a short sales chat (decided in E10). */
export const ASSISTANT_MODEL = "claude-sonnet-5";

/** USD per million tokens of ASSISTANT_MODEL (5-minute cache writes). */
const PRICES = {
  input: 2,
  output: 10,
  cacheWrite: 2.5,
  cacheRead: 0.2,
} as const;

// Limits against abuse and cost (RF-AST-08, RNF-16, RNF-28).
export const LIMITS = {
  /** Messages a visitor can send in one conversation. */
  messagesPerSession: 20,
  /** Characters per message. */
  messageChars: 1000,
  /** Conversations started from one IP in 24 hours. */
  sessionsPerIpPerDay: 5,
  /** Messages sent from one IP in 24 hours, across its conversations. */
  messagesPerIpPerDay: 60,
} as const;

export type AssistantSettings = {
  /** Business instructions, edited in the panel (RF-ADM-08). */
  prompt: string;
  /** Spend at which the chat turns itself off for the month (RNF-28). */
  monthlyBudgetUsd: number;
};

export const DEFAULT_ASSISTANT: AssistantSettings = {
  prompt: "",
  monthlyBudgetUsd: 10,
};

const assistantRow = z.object({
  prompt: z.string(),
  monthly_budget_usd: z.number().nonnegative(),
});

/** The private `assistant` row; a missing or broken row uses the defaults. */
export function parseAssistant(value: unknown): AssistantSettings {
  const row = assistantRow.safeParse(value);
  return row.success
    ? { prompt: row.data.prompt, monthlyBudgetUsd: row.data.monthly_budget_usd }
    : DEFAULT_ASSISTANT;
}

/** Panel form of the assistant. */
export const assistantForm = z.object({
  enabled: z
    .literal("on")
    .optional()
    .transform((value) => value === "on"),
  prompt: z.string().trim().max(4000),
  budget: z.coerce.number().min(0).max(500),
});

type Usage = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
};

/** Estimated cost in USD of one model response. */
export function costUsd(usage: Usage): number {
  const perToken = (price: number) => price / 1_000_000;
  return (
    usage.input_tokens * perToken(PRICES.input) +
    usage.output_tokens * perToken(PRICES.output) +
    (usage.cache_creation_input_tokens ?? 0) * perToken(PRICES.cacheWrite) +
    (usage.cache_read_input_tokens ?? 0) * perToken(PRICES.cacheRead)
  );
}

/** Start of the current month in Quito (UTC−5, no daylight saving). */
export function monthStart(now: Date): Date {
  const quito = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  return new Date(
    Date.UTC(quito.getUTCFullYear(), quito.getUTCMonth(), 1, 5, 0, 0),
  );
}

/** Input of the `registrar_contacto` tool, validated before it runs. */
export const contactInput = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .transform(normalizePhone)
    .pipe(z.string().regex(/^(0\d{9}|\+\d{9,15})$/)),
  service: z.string().trim().max(80).optional(),
  summary: z.string().trim().min(5).max(600),
});

export type ContactInput = z.infer<typeof contactInput>;

/** Prefilled WhatsApp message of the handoff (COPY §18). */
export function handoffMessage(contact: {
  name: string;
  summary: string;
}): string {
  return `Hola, vengo del asistente del sitio de Siete8. Soy ${contact.name}. ${contact.summary}`;
}

/** What the browser sends to start a conversation. */
export const startRequest = z.object({
  turnstileToken: z.string().min(1).max(2048),
  // LOPDP (RNF-19): the visitor accepts the privacy notice first.
  consent: z.literal(true),
  utm: z.string().max(2000).optional(),
});

/** What the browser sends with each message. */
export const chatRequest = z.object({
  sessionId: z.uuid(),
  message: z.string().trim().min(1).max(LIMITS.messageChars),
});

/**
 * Events of the chat stream, one JSON object per line:
 * text as it is written, the WhatsApp link once the contact is registered,
 * and a closing event (`notice` replaces the answer when the chat cannot
 * reply: limit reached, turned off, error).
 */
export type ChatEvent =
  | { type: "text"; text: string }
  | { type: "handoff"; url: string }
  | { type: "notice"; text: string; closed: boolean }
  | { type: "end" };
