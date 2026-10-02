"use client";

import { MessageCircle, Send, X } from "lucide-react";
import Link from "next/link";
import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { Button, buttonClasses } from "@/components/sitio/button";
import { Markdown } from "@/components/sitio/markdown";
import { WhatsAppIcon } from "@/components/sitio/layout/whatsapp-icon";
import { loadTurnstile } from "@/components/sitio/turnstile";
import { CAMPAIGN_KEY } from "@/lib/analytics";
import { type ChatEvent, LIMITS } from "@/lib/assistant";
import { cx } from "@/lib/cx";

// Texts from docs/COPY.md §18.

type Message = { role: "user" | "assistant"; text: string };

type Saved = {
  sessionId: string;
  messages: Message[];
  handoff: string | null;
  closed: boolean;
};

/** The conversation survives page changes within the visit. */
const STORAGE_KEY = "siete8-chat";

function readSaved(): Saved | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

function writeSaved(saved: Saved) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // Storage blocked: the conversation lasts until the page changes.
  }
}

const floating =
  "fixed right-[calc(1rem+env(safe-area-inset-right))] bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40";

/**
 * Assistant on the site (E10, RF-AST-01..07). Replaces the floating WhatsApp
 * button when it is on: the window opens with the privacy notice and
 * Turnstile, then answers as it writes, and offers WhatsApp with a summary
 * once the visitor leaves their contact. WhatsApp is always one tap away.
 */
export function AssistantChat({
  siteKey,
  whatsappHref,
}: {
  siteKey: string;
  /** General WhatsApp link, for when the chat cannot help. */
  whatsappHref: string;
}) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const titleId = useId();
  const launcher = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const widget = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const token = useRef("");

  // sessionStorage is only readable after mounting.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(readSaved());
  }, []);

  useEffect(() => {
    if (saved) writeSaved(saved);
  }, [saved]);

  // Turnstile only while the start screen is open.
  const starting = open && !saved;
  useEffect(() => {
    if (!starting) return;
    let cancelled = false;
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !widget.current || widgetId.current) return;
        widgetId.current = turnstile.render(widget.current, {
          sitekey: siteKey,
          language: "es",
          action: "asistente",
          callback: (value: string) => {
            token.current = value;
          },
          "expired-callback": () => {
            token.current = "";
          },
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = null;
      token.current = "";
    };
  }, [starting, siteKey]);

  // Focus the message box on open; Escape closes and returns focus.
  useEffect(() => {
    if (open && saved && !saved.closed) input.current?.focus();
  }, [open, saved]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [saved?.messages, pending]);

  // Back on the launcher after closing, once it is rendered again.
  const returnFocus = useRef(false);
  useEffect(() => {
    if (!open && returnFocus.current) launcher.current?.focus();
    returnFocus.current = false;
  }, [open]);

  const close = () => {
    returnFocus.current = true;
    setOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") close();
  };

  const start = async () => {
    setError(null);
    if (!token.current) {
      setError("Espera a que aparezca la marca de verificación.");
      return;
    }
    setPending(true);
    let utm: string | undefined;
    try {
      utm = sessionStorage.getItem(CAMPAIGN_KEY) ?? undefined;
    } catch {
      utm = undefined;
    }
    const response = await fetch("/api/chat/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turnstileToken: token.current,
        consent: true,
        utm,
      }),
    }).catch(() => null);
    setPending(false);
    const result = (await response?.json().catch(() => null)) as
      | { status: "ok"; sessionId: string }
      | { status: "error"; message: string }
      | null;
    if (result?.status === "ok") {
      setSaved({
        sessionId: result.sessionId,
        messages: [],
        handoff: null,
        closed: false,
      });
      return;
    }
    if (widgetId.current) window.turnstile?.reset(widgetId.current);
    token.current = "";
    setError(
      result?.message ??
        "No pudimos abrir el chat. Inténtalo de nuevo o escríbenos por WhatsApp.",
    );
  };

  const send = async (event?: FormEvent) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!saved || !text || pending) return;
    setDraft("");
    setNotice(null);
    setPending(true);
    const update = (change: (current: Saved) => Saved) =>
      setSaved((current) => (current ? change(current) : current));
    update((current) => ({
      ...current,
      messages: [
        ...current.messages,
        { role: "user", text },
        { role: "assistant", text: "" },
      ],
    }));

    const appendText = (delta: string) =>
      update((current) => {
        const messages = [...current.messages];
        const last = messages[messages.length - 1]!;
        messages[messages.length - 1] = { ...last, text: last.text + delta };
        return { ...current, messages };
      });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: saved.sessionId, message: text }),
      });
      if (!response.ok || !response.body) throw new Error("chat failed");
      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line) continue;
          const chatEvent = JSON.parse(line) as ChatEvent;
          if (chatEvent.type === "text") appendText(chatEvent.text);
          if (chatEvent.type === "handoff") {
            update((current) => ({ ...current, handoff: chatEvent.url }));
          }
          if (chatEvent.type === "notice") {
            setNotice(chatEvent.text);
            if (chatEvent.closed) {
              update((current) => ({ ...current, closed: true }));
            }
          }
        }
      }
    } catch {
      setNotice(
        "No pude responder en este momento. Inténtalo de nuevo o escríbenos por WhatsApp.",
      );
    } finally {
      // An answer that never came leaves no empty bubble.
      update((current) => ({
        ...current,
        messages: current.messages.filter((message) => message.text),
      }));
      setPending(false);
    }
  };

  const onEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  };

  const last = saved?.messages[saved.messages.length - 1];
  const writing = pending && (!last || last.role === "user" || !last.text);

  return (
    <>
      {!open && (
        <button
          ref={launcher}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-label="Abrir el asistente de Siete8"
          className={cx(
            floating,
            "flex size-14 items-center justify-center rounded-full bg-fg text-bg transition-colors duration-150 ease-out",
          )}
        >
          <MessageCircle aria-hidden className="size-7" />
        </button>
      )}
      {open && (
        <div
          role="dialog"
          aria-labelledby={titleId}
          onKeyDown={onKeyDown}
          className="fixed inset-x-0 bottom-0 z-50 flex h-[min(40rem,90dvh)] flex-col border border-border bg-bg md:inset-x-auto md:right-4 md:bottom-4 md:w-[26rem] md:rounded-control"
        >
          <div className="border-b border-border px-4 pt-2 pb-1">
            <div className="flex items-center justify-between gap-4">
              <h2 id={titleId} className="text-h4">
                Asistente de Siete8
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar el asistente"
                className="flex size-11 items-center justify-center rounded-control text-fg hover:bg-surface"
              >
                <X aria-hidden className="size-6" />
              </button>
            </div>
            {/* The way out of the bot, always in view (RF-AST-05). */}
            <a
              href={whatsappHref}
              className="inline-flex min-h-11 items-center gap-2 text-small"
            >
              <WhatsAppIcon className="size-5 shrink-0" />
              Hablar con una persona por WhatsApp
            </a>
          </div>

          {!saved ? (
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
              <p>
                Te ayudo a elegir un servicio y te cuento precios y requisitos.
                Si quieres contratar, te paso a WhatsApp con un resumen de lo
                que hablamos.
              </p>
              <p className="rounded-control bg-surface p-3">
                No envíes por aquí documentos, fotos ni tu número de cédula: eso
                se envía por WhatsApp cuando te lo pidamos.
              </p>
              <p className="text-small">
                Soy un asistente con inteligencia artificial y puedo
                equivocarme; los precios del sitio son los que valen. Al
                empezar, aceptas que guardemos esta conversación como dice la{" "}
                <Link href="/privacidad">Política de privacidad</Link>.
              </p>
              <div ref={widget} className="min-h-[65px]" />
              {error && (
                <p role="alert" className="text-small font-medium">
                  {error}
                </p>
              )}
              <Button onClick={start} disabled={pending}>
                {pending ? "Abriendo…" : "Empezar"}
              </Button>
              <a href={whatsappHref} className="self-center">
                Prefiero escribir por WhatsApp
              </a>
            </div>
          ) : (
            <>
              <div
                ref={log}
                role="log"
                aria-live="polite"
                className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
              >
                <p className="max-w-[85%] self-start rounded-control bg-surface px-3 py-2">
                  Hola, ¿en qué te ayudo? Puedes preguntarme por la firma
                  electrónica, el hosting, el correo o cualquier servicio.
                </p>
                {saved.messages.map((message, index) =>
                  message.role === "user" ? (
                    <p
                      key={index}
                      className="max-w-[85%] self-end rounded-control border border-border px-3 py-2 whitespace-pre-wrap"
                    >
                      <span className="sr-only">Tú: </span>
                      {message.text}
                    </p>
                  ) : (
                    <div
                      key={index}
                      className="max-w-[85%] self-start rounded-control bg-surface px-3 py-2"
                    >
                      <span className="sr-only">Asistente: </span>
                      <Markdown variant="chat">{message.text}</Markdown>
                    </div>
                  ),
                )}
                {writing && (
                  <p className="self-start text-small">Escribiendo…</p>
                )}
                {notice && (
                  <p role="status" className="text-small font-medium">
                    {notice}
                  </p>
                )}
                {saved.handoff && (
                  <a href={saved.handoff} className={buttonClasses()}>
                    Continuar por WhatsApp
                  </a>
                )}
              </div>
              {saved.closed ? (
                <div className="flex flex-col gap-2 border-t border-border p-4">
                  <a href={whatsappHref} className={buttonClasses()}>
                    Escribir por WhatsApp
                  </a>
                </div>
              ) : (
                <form
                  onSubmit={send}
                  className="flex items-end gap-2 border-t border-border p-3"
                >
                  <label htmlFor="assistant-message" className="sr-only">
                    Tu mensaje
                  </label>
                  <textarea
                    ref={input}
                    id="assistant-message"
                    rows={2}
                    maxLength={LIMITS.messageChars}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={onEnter}
                    placeholder="Escribe tu pregunta"
                    className="min-h-12 flex-1 resize-none rounded-control border border-field-border bg-bg px-3 py-2 text-fg"
                  />
                  <button
                    type="submit"
                    disabled={pending || !draft.trim()}
                    aria-label="Enviar"
                    className="flex size-12 shrink-0 items-center justify-center rounded-control bg-action text-on-action hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send aria-hidden className="size-5" />
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
