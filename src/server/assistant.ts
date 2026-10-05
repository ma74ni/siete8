import "server-only";

import { createHmac } from "node:crypto";

import Anthropic from "@anthropic-ai/sdk";
import * as Sentry from "@sentry/nextjs";

import { clientEnv } from "@/env/client";
import { serverEnv } from "@/env/server";
import {
  ASSISTANT_MODEL,
  type ChatEvent,
  type ContactInput,
  contactInput,
  costUsd,
  handoffMessage,
  LIMITS,
  monthStart,
  parseAssistant,
} from "@/lib/assistant";
import { systemPrompt } from "@/lib/assistant-prompt";
import { parseUtm } from "@/lib/contact-form";
import { hoursText, type SiteSettings } from "@/lib/site-settings";
import { generalMessage, whatsappUrl } from "@/lib/whatsapp";
import {
  getServiceMenu,
  getServicePage,
  type ServicePage,
} from "@/server/catalog";
import { notify } from "@/server/notify";
import { getSiteSettings } from "@/server/site-settings";
import { createAdminClient } from "@/server/supabase/admin";
import { clientIp, passesTurnstile } from "@/server/turnstile";

// Assistant on the site (E10, RF-AST-01..09). Texts from docs/COPY.md §18.
// Every write uses the secret key, after these checks: the chat is on,
// Turnstile when a conversation starts, the limits per conversation and per
// IP, and the monthly cap.

/** Tokens per answer, thinking included: answers are a few sentences. */
const MAX_TOKENS = 2048;
/** Model calls per message: an answer, the contact tool, the follow-up. */
const MAX_ROUNDS = 3;

export type StartResult =
  { status: "ok"; sessionId: string } | { status: "error"; message: string };

const CONTACT_TOOL: Anthropic.Tool = {
  name: "registrar_contacto",
  description:
    "Registra a la persona como contacto de Siete8 para que el equipo siga la conversación por WhatsApp. Úsala solo cuando la persona quiera contratar, cotizar o hablar con alguien, y después de confirmar su nombre, su celular y lo que necesita. Una sola vez por conversación.",
  eager_input_streaming: true,
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Nombre de la persona." },
      phone: {
        type: "string",
        description: "Celular, como lo escribió la persona (ej: 0991234567).",
      },
      service: {
        type: "string",
        description:
          "Identificador del servicio que le interesa, tomado de su página: para /servicios/firma-electronica es firma-electronica. Omítelo si no está claro.",
      },
      summary: {
        type: "string",
        description:
          "Resumen en primera persona, de una a tres frases, de lo que necesita la persona, con los datos clave que dio (plan, tipo de persona, formato .p12 o nube, urgencia). Es el mensaje que llegará por WhatsApp. Sin cédula, RUC ni datos sensibles.",
      },
    },
    required: ["name", "phone", "summary"],
    additionalProperties: false,
  },
};

const NOTICES = {
  unavailable:
    "El asistente no está disponible ahora. Escríbenos por WhatsApp y te ayudamos.",
  sessionLimit:
    "Llegamos al límite de mensajes de esta conversación. Para seguir, escríbenos por WhatsApp.",
  ipLimit:
    "Llegamos al límite de mensajes de hoy. Para seguir, escríbenos por WhatsApp.",
  error:
    "No pude responder en este momento. Inténtalo de nuevo o escríbenos por WhatsApp.",
  refusal:
    "No puedo ayudarte con eso por aquí. Si es sobre nuestros servicios, escríbenos por WhatsApp.",
};

function hashIp(ip: string | undefined) {
  return createHmac("sha256", serverEnv.SUPABASE_SECRET_KEY)
    .update(ip ?? "local")
    .digest("hex");
}

/** Whether the chat can answer: on in the panel and with an API key. */
export async function isAssistantAvailable(settings?: SiteSettings) {
  const { assistantEnabled } = settings ?? (await getSiteSettings());
  return assistantEnabled && Boolean(serverEnv.ANTHROPIC_API_KEY);
}

async function getAssistantSettings() {
  const { data } = await createAdminClient()
    .from("site_settings")
    .select("value")
    .eq("key", "assistant")
    .maybeSingle();
  return parseAssistant(data?.value);
}

/** Published catalog, kept for a few minutes between messages. */
let catalogCache: { services: ServicePage[]; at: number } | null = null;
const CATALOG_TTL = 5 * 60 * 1000;

async function getCatalog(): Promise<ServicePage[]> {
  if (catalogCache && Date.now() - catalogCache.at < CATALOG_TTL) {
    return catalogCache.services;
  }
  const menu = await getServiceMenu();
  const pages = await Promise.all(
    menu.flatMap((category) =>
      category.services.map((service) => getServicePage(service.slug)),
    ),
  );
  const services = pages.filter((page): page is ServicePage => page !== null);
  catalogCache = { services, at: Date.now() };
  return services;
}

const since24h = () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

/**
 * Starts a conversation (RF-AST-01): the visitor accepted the privacy
 * notice and passed Turnstile, and their IP has not started too many today.
 */
export async function startSession(input: {
  turnstileToken: string;
  utm?: string;
}): Promise<StartResult> {
  const fail = (message: string): StartResult => ({ status: "error", message });
  if (!(await isAssistantAvailable())) return fail(NOTICES.unavailable);

  const secret = serverEnv.TURNSTILE_SECRET_KEY;
  if (!secret || !(await passesTurnstile(input.turnstileToken, secret))) {
    return fail(
      "No pudimos comprobar que no eres un robot. Espera la marca de verificación e inténtalo de nuevo.",
    );
  }

  const supabase = createAdminClient();
  const ipHash = hashIp(await clientIp());
  const { count, error: countError } = await supabase
    .from("chat_session")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since24h());
  if (countError) return fail(NOTICES.error);
  if ((count ?? 0) >= LIMITS.sessionsPerIpPerDay) return fail(NOTICES.ipLimit);

  const { data, error } = await supabase
    .from("chat_session")
    .insert({
      ip_hash: ipHash,
      consent_at: new Date().toISOString(),
      utm: parseUtm(input.utm),
    })
    .select("id")
    .single();
  if (error) return fail(NOTICES.error);
  return { status: "ok", sessionId: data.id };
}

type Session = {
  id: string;
  ip_hash: string;
  lead_id: string | null;
  consent_at: string;
  utm: unknown;
  message_count: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
};

/** The reason the chat cannot answer this message, or null. */
async function blocked(session: Session): Promise<string | null> {
  if (session.message_count >= LIMITS.messagesPerSession) {
    return NOTICES.sessionLimit;
  }
  const supabase = createAdminClient();
  const [
    { data: today, error: todayError },
    { data: spent, error: spentError },
  ] = await Promise.all([
    supabase
      .from("chat_session")
      .select("message_count")
      .eq("ip_hash", session.ip_hash)
      .gte("created_at", since24h()),
    supabase.rpc("chat_cost_since", {
      since: monthStart(new Date()).toISOString(),
    }),
  ]);
  if (todayError || spentError) return NOTICES.error;
  const sent = today.reduce((sum, row) => sum + row.message_count, 0);
  if (sent >= LIMITS.messagesPerIpPerDay) return NOTICES.ipLimit;
  const { monthlyBudgetUsd } = await getAssistantSettings();
  // Monthly cap reached: the chat stays off until next month (RNF-28).
  if (spent >= monthlyBudgetUsd) return NOTICES.unavailable;
  return null;
}

/**
 * Registers the visitor as a lead with source `assistant` (RF-AST-04/06)
 * and returns the WhatsApp link with the summary (RF-AST-05). A second call
 * returns the same kind of link without a second lead.
 */
async function registerContact(
  session: Session,
  contact: ContactInput,
  settings: SiteSettings,
): Promise<string> {
  const url = whatsappUrl(handoffMessage(contact), settings.whatsapp.waMe);
  if (session.lead_id) return url;

  const supabase = createAdminClient();
  const { data: service } = contact.service
    ? await supabase
        .from("service")
        .select("id, name")
        .eq("slug", contact.service)
        .eq("visible", true)
        .maybeSingle()
    : { data: null };

  const { data: lead, error } = await supabase
    .from("lead")
    .insert({
      name: contact.name,
      phone: contact.phone,
      message: contact.summary,
      service_id: service?.id ?? null,
      source: "assistant",
      utm: (session.utm ?? {}) as Record<string, string>,
      consent_at: session.consent_at,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Could not save the lead: ${error.message}`);

  session.lead_id = lead.id;
  await supabase
    .from("chat_session")
    .update({ lead_id: lead.id })
    .eq("id", session.id);

  const panelUrl = new URL(
    `/admin/leads/${lead.id}`,
    clientEnv.NEXT_PUBLIC_SITE_URL,
  ).toString();
  await notify(
    `Nuevo contacto del asistente: ${contact.name}${service ? ` (${service.name})` : ""}`,
    [
      `Nombre: ${contact.name}`,
      `Celular: ${contact.phone}`,
      service ? `Servicio: ${service.name}` : null,
      "",
      contact.summary,
      "",
      `Ver la conversación en el panel: ${panelUrl}`,
    ]
      .filter((line) => line !== null)
      .join("\n"),
    null,
  );
  return url;
}

/**
 * Answers one message as a stream of `ChatEvent` lines (RF-AST-01..06).
 * The history comes from the database, never from the browser, so a
 * visitor cannot put words in the assistant's mouth.
 */
export async function chat(
  sessionId: string,
  message: string,
  signal: AbortSignal,
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  const settings = await getSiteSettings();
  const whatsapp = whatsappUrl(generalMessage(), settings.whatsapp.waMe);

  const single = (text: string): ReadableStream<Uint8Array> =>
    new ReadableStream({
      start(controller) {
        for (const event of [
          { type: "notice", text, closed: true },
          { type: "handoff", url: whatsapp },
          { type: "end" },
        ] satisfies ChatEvent[]) {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        }
        controller.close();
      },
    });

  if (!(await isAssistantAvailable(settings)))
    return single(NOTICES.unavailable);

  const supabase = createAdminClient();
  const { data: session } = await supabase
    .from("chat_session")
    .select(
      "id, ip_hash, lead_id, consent_at, utm, message_count, input_tokens, output_tokens, cost_usd",
    )
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return single(NOTICES.unavailable);

  const reason = await blocked(session);
  if (reason) return single(reason);

  const { error: saveError } = await supabase
    .from("chat_message")
    .insert({ session_id: session.id, role: "user", content: message });
  if (saveError) return single(NOTICES.error);
  session.message_count += 1;
  await supabase
    .from("chat_session")
    .update({ message_count: session.message_count })
    .eq("id", session.id);

  const { data: history } = await supabase
    .from("chat_message")
    .select("role, content")
    .eq("session_id", session.id)
    .order("created_at");
  const messages: Anthropic.MessageParam[] = (history ?? []).map((row) => ({
    role: row.role as "user" | "assistant",
    content: row.content,
  }));

  const [services, assistant] = await Promise.all([
    getCatalog(),
    getAssistantSettings(),
  ]);
  const system = systemPrompt({
    services,
    hours: hoursText(settings),
    instructions: assistant.prompt,
  });
  const client = new Anthropic({ apiKey: serverEnv.ANTHROPIC_API_KEY });

  return new ReadableStream({
    async start(controller) {
      // The visitor may close the window mid-answer: then nothing is sent.
      const send = (event: ChatEvent) => {
        if (signal.aborted) return;
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };
      let answer = "";
      const usage = { input: 0, output: 0, cost: 0 };

      try {
        for (let round = 0; round < MAX_ROUNDS; round++) {
          const stream = client.messages.stream(
            {
              model: ASSISTANT_MODEL,
              max_tokens: MAX_TOKENS,
              thinking: { type: "adaptive" },
              output_config: { effort: "low" },
              // Caches the catalog and the conversation so far.
              cache_control: { type: "ephemeral" },
              system,
              tools: [CONTACT_TOOL],
              messages,
            },
            { signal },
          );
          stream.on("text", (delta) => {
            answer += delta;
            send({ type: "text", text: delta });
          });
          const reply = await stream.finalMessage();
          usage.input +=
            reply.usage.input_tokens +
            (reply.usage.cache_read_input_tokens ?? 0) +
            (reply.usage.cache_creation_input_tokens ?? 0);
          usage.output += reply.usage.output_tokens;
          usage.cost += costUsd(reply.usage);

          if (reply.stop_reason === "refusal") {
            send({ type: "notice", text: NOTICES.refusal, closed: false });
            break;
          }
          const calls = reply.content.filter(
            (block): block is Anthropic.ToolUseBlock =>
              block.type === "tool_use",
          );
          // A tool input cut off at max_tokens may still look valid: never run it.
          if (calls.length === 0 || reply.stop_reason === "max_tokens") break;

          messages.push({ role: "assistant", content: reply.content });
          const results: Anthropic.ToolResultBlockParam[] = [];
          for (const call of calls) {
            const contact = contactInput.safeParse(call.input);
            if (call.name !== CONTACT_TOOL.name || !contact.success) {
              results.push({
                type: "tool_result",
                tool_use_id: call.id,
                is_error: true,
                content:
                  "Datos incompletos o no válidos: confirma el nombre, un celular de Ecuador y un resumen.",
              });
              continue;
            }
            const url = await registerContact(session, contact.data, settings);
            send({ type: "handoff", url });
            results.push({
              type: "tool_result",
              tool_use_id: call.id,
              content:
                "Contacto registrado. En la ventana del chat ya aparece el botón para continuar por WhatsApp con el resumen. Díselo en una frase, sin escribir el enlace.",
            });
          }
          messages.push({ role: "user", content: results });
          if (answer && !answer.endsWith("\n")) {
            answer += "\n\n";
            send({ type: "text", text: "\n\n" });
          }
        }
      } catch (error) {
        if (!signal.aborted) {
          console.error(
            error instanceof Anthropic.APIError
              ? `Assistant failed: HTTP ${error.status} ${error.message}`
              : `Assistant failed: ${error instanceof Error ? error.message : error}`,
          );
          // The visitor only sees the notice: Sentry tells the admin (E7-06).
          Sentry.captureException(error, { tags: { area: "assistant" } });
          send({ type: "notice", text: NOTICES.error, closed: false });
        }
      }

      // The record of the conversation and its cost (RF-AST-06, RNF-28).
      const text = answer.trim().slice(0, 4000);
      if (text) {
        await supabase
          .from("chat_message")
          .insert({ session_id: session.id, role: "assistant", content: text });
      }
      await supabase
        .from("chat_session")
        .update({
          input_tokens: session.input_tokens + usage.input,
          output_tokens: session.output_tokens + usage.output,
          cost_usd: Number(session.cost_usd) + usage.cost,
        })
        .eq("id", session.id);

      send({ type: "end" });
      if (!signal.aborted) controller.close();
    },
  });
}
