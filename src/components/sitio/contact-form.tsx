"use client";

import Link from "next/link";
import { Fragment, useActionState, useEffect, useRef, useState } from "react";

import { Button } from "@/components/sitio/button";
import { FormField } from "@/components/sitio/form-field";
import { CAMPAIGN_KEY } from "@/lib/analytics";
import type { ContactState } from "@/lib/contact-form";
import { cx } from "@/lib/cx";

// Texts from docs/COPY.md §10.

type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

const SCRIPT =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const IDLE: ContactState = { status: "idle" };

/** Loads Turnstile once per page and resolves when it is ready. */
function loadTurnstile(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  return new Promise((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT}"]`,
    );
    if (!script) {
      script = document.createElement("script");
      script.src = SCRIPT;
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", () => resolve(window.turnstile!));
    script.addEventListener("error", reject);
  });
}

/**
 * Contact form (E3-08, RF-PUB-07): consent before saving (RNF-19), Turnstile
 * and a honeypot against spam (RNF-16). `?servicio=<slug>` preselects the
 * service; the landing page's UTM travel in a hidden field.
 */
export function ContactForm({
  action: submit,
  siteKey,
  services,
}: {
  /** `submitLead` from `@/server/leads`, passed by the page. */
  action: (state: ContactState, formData: FormData) => Promise<ContactState>;
  siteKey: string;
  services: { slug: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(submit, IDLE);
  // Service from ?servicio=<slug>, read after mounting.
  const [preset, setPreset] = useState("");
  // Last chosen service, for the GA event.
  const chosen = useRef("");
  const [utm, setUtm] = useState("");
  const widget = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    const slug = new URLSearchParams(location.search).get("servicio");
    // Reading the address and storage is only possible after mounting.
    if (slug && services.some((s) => s.slug === slug)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreset(slug);
      chosen.current = slug;
    }
    try {
      setUtm(sessionStorage.getItem(CAMPAIGN_KEY) ?? "");
    } catch {
      // Storage blocked: the lead goes without its campaign.
    }
  }, [services]);

  useEffect(() => {
    let cancelled = false;
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !widget.current || widgetId.current) return;
        widgetId.current = turnstile.render(widget.current, {
          sitekey: siteKey,
          language: "es",
          action: "contacto",
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [siteKey]);

  // A token works once: after each answer, ask for a new one.
  useEffect(() => {
    if (state.status === "idle") return;
    if (widgetId.current) window.turnstile?.reset(widgetId.current);
    if (state.status === "success") {
      window.gtag?.("event", "generate_lead", {
        page_path: location.pathname,
        service: chosen.current || "ninguno",
      });
    }
  }, [state]);

  // After an error, the fields come back with what was typed.
  const typed = state.status === "error" ? (state.values ?? {}) : {};

  const invalid = (field: string) =>
    state.status === "error" && state.fields?.includes(field)
      ? "Revisa este campo."
      : undefined;

  if (state.status === "success") {
    return (
      <p role="status" className="text-h4 font-normal">
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <Fragment key={state.status === "error" ? state.at : "first"}>
        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            label="Nombre"
            name="name"
            autoComplete="name"
            required
            maxLength={120}
            defaultValue={typed.name}
            error={invalid("name")}
          />
          <FormField
            label="Celular"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            required
            maxLength={20}
            hint="Te respondemos por WhatsApp."
            defaultValue={typed.phone}
            error={invalid("phone")}
          />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            label="Correo (opcional)"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={200}
            defaultValue={typed.email}
            error={invalid("email")}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="field-service" className="font-medium">
              Servicio (opcional)
            </label>
            <select
              // Remounts when the preset arrives; after an error it keeps
              // what was chosen.
              key={preset}
              id="field-service"
              name="service"
              defaultValue={typed.service ?? preset}
              onChange={(event) => (chosen.current = event.target.value)}
              className="min-h-12 w-full rounded-control border border-field-border bg-bg px-3 text-fg"
            >
              <option value="">Todavía no sé</option>
              {services.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <FormField
          label="¿En qué te ayudamos? (opcional)"
          name="message"
          multiline
          maxLength={2000}
          defaultValue={typed.message}
          error={invalid("message")}
        />
      </Fragment>
      {/* Honeypot: hidden from people and screen readers, filled by bots. */}
      <div
        aria-hidden
        className="absolute -left-[9999px] h-px w-px overflow-hidden"
      >
        <label htmlFor="field-website">Sitio web</label>
        <input
          id="field-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <input type="hidden" name="utm" value={utm} />
      <label
        htmlFor="field-consent"
        className={cx(
          "flex items-start gap-3",
          invalid("consent") && "font-medium text-accent",
        )}
      >
        <input
          id="field-consent"
          name="consent"
          type="checkbox"
          required
          aria-invalid={invalid("consent") ? true : undefined}
          className="mt-1 size-5 shrink-0 accent-action"
        />
        <span>
          Acepto que Siete8 use mis datos para responder mi solicitud, según la{" "}
          <Link href="/privacidad">política de privacidad</Link>.
        </span>
      </label>
      <div ref={widget} className="min-h-[65px]" />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Enviando…" : "Enviar mensaje"}
        </Button>
        {state.status === "error" && (
          <p role="alert" className="font-medium text-accent">
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
