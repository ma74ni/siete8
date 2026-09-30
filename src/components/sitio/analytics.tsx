"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/sitio/button";
import {
  CAMPAIGN_KEY,
  campaignFromSearch,
  CONSENT_KEY,
  type Consent,
  isSiteOrigin,
  whatsappClickParams,
} from "@/lib/analytics";

// Texts from docs/COPY.md §12.

/** Fired by `CookieSettingsButton` to show the banner again. */
const OPEN_EVENT = "siete8:cookie-settings";

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

// Browser storage can be missing or throw (private mode, blocked cookies):
// then the banner simply shows again on the next visit.
function read(storage: "localStorage" | "sessionStorage", key: string) {
  try {
    return window[storage].getItem(key);
  } catch {
    return null;
  }
}
function write(
  storage: "localStorage" | "sessionStorage",
  key: string,
  value: string,
) {
  try {
    window[storage].setItem(key, value);
  } catch {
    // Nothing to do: the choice lasts until the page closes.
  }
}

function loadGa(gaId: string) {
  (window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] = false;
  if (window.gtag) return;
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag() {
    // gtag.js expects the `arguments` object itself.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  const stored = read("sessionStorage", CAMPAIGN_KEY);
  const campaign = stored ? (JSON.parse(stored) as Record<string, string>) : {};
  window.gtag("js", new Date());
  window.gtag("config", gaId, campaign);
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);
}

function stopGa(gaId: string) {
  (window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] = true;
  // Remove the cookies GA may already have set (_ga, _ga_<id>).
  for (const name of document.cookie
    .split(";")
    .map((c) => c.split("=")[0]!.trim())) {
    if (name.startsWith("_ga")) {
      document.cookie = `${name}=; Max-Age=0; path=/; domain=.${location.hostname}`;
      document.cookie = `${name}=; Max-Age=0; path=/`;
    }
  }
}

/**
 * Google Analytics 4 with consent (E5-04, RNF-26, LOPDP): nothing loads until
 * the visitor accepts. Records WhatsApp clicks and keeps the landing page's
 * UTM parameters so the visit is credited to its campaign.
 */
export function Analytics({
  gaId,
  siteUrl,
}: {
  gaId: string;
  siteUrl: string;
}) {
  // null until mounted, so the server and first client render match.
  const [consent, setConsent] = useState<Consent | "unset" | null>(null);

  useEffect(() => {
    // Local runs and previews stay silent even if built with the ID.
    if (!isSiteOrigin(location.origin, siteUrl)) return;

    const campaign = campaignFromSearch(location.search);
    if (campaign)
      write("sessionStorage", CAMPAIGN_KEY, JSON.stringify(campaign));

    const stored = read("localStorage", CONSENT_KEY);
    // Reading storage is only possible after mounting.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsent(stored === "granted" || stored === "denied" ? stored : "unset");

    const reopen = () => setConsent("unset");
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, [siteUrl]);

  useEffect(() => {
    if (consent !== "granted") return;
    loadGa(gaId);
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a");
      if (!link) return;
      const params = whatsappClickParams(
        link.href,
        location.pathname,
        link.getAttribute("aria-label") ?? link.textContent ?? "",
      );
      // The link leaves the page: a beacon survives the navigation.
      if (params) {
        window.gtag?.("event", "whatsapp_click", {
          ...params,
          transport_type: "beacon",
        });
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [consent, gaId]);

  const choose = (choice: Consent) => {
    write("localStorage", CONSENT_KEY, choice);
    if (choice === "denied") stopGa(gaId);
    setConsent(choice);
  };

  if (consent !== "unset") return null;

  return (
    <section
      aria-label="Cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-bg pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between lg:px-12">
        <p>
          Usamos Google Analytics para saber cómo llegas al sitio y qué te
          sirve. Solo lo activamos si aceptas.{" "}
          <Link href="/privacidad">Política de privacidad</Link>
        </p>
        <div className="flex shrink-0 gap-3">
          <Button onClick={() => choose("granted")}>Aceptar</Button>
          <Button variant="secondary" onClick={() => choose("denied")}>
            Rechazar
          </Button>
        </div>
      </div>
    </section>
  );
}

/** Footer link that shows the cookie banner again to change the choice. */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
    >
      Preferencias de cookies
    </button>
  );
}
