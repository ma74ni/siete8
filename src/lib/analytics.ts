/**
 * Pure helpers for Google Analytics (E5-04, RNF-26). Nothing here loads GA;
 * `@/components/sitio/analytics` does that only after consent.
 */

/** Where the visitor's choice is kept (browser storage). */
export const CONSENT_KEY = "siete8-analytics-consent";
/** Where the landing page's UTM parameters wait for consent. */
export const CAMPAIGN_KEY = "siete8-campaign";

export type Consent = "granted" | "denied";

const UTM_FIELDS = {
  utm_source: "campaign_source",
  utm_medium: "campaign_medium",
  utm_campaign: "campaign_name",
  utm_term: "campaign_term",
  utm_content: "campaign_content",
} as const;

type Campaign = Partial<
  Record<(typeof UTM_FIELDS)[keyof typeof UTM_FIELDS], string>
>;

/**
 * UTM parameters of a URL as GA campaign fields, or null without them. They
 * are read on the landing page and applied once GA loads, which may be on a
 * later page if the visitor accepts after navigating.
 */
export function campaignFromSearch(search: string): Campaign | null {
  const params = new URLSearchParams(search);
  const campaign: Campaign = {};
  for (const [utm, field] of Object.entries(UTM_FIELDS)) {
    const value = params.get(utm)?.trim();
    if (value) campaign[field] = value.slice(0, 100);
  }
  return Object.keys(campaign).length > 0 ? campaign : null;
}

/**
 * GA only runs on the site's own origin (https://siete8.com), so a local run
 * or a preview built with the ID never sends data.
 */
export function isSiteOrigin(currentOrigin: string, siteUrl: string): boolean {
  try {
    return new URL(siteUrl).origin === currentOrigin;
  } catch {
    return false;
  }
}

/** GA limits event parameter values to 100 characters. */
const MAX_PARAM = 100;

/**
 * Parameters of a `whatsapp_click` event, or null if the link does not open
 * WhatsApp. The prefilled message (COPY §2) already names the service and
 * the plan, so it is sent as is.
 */
export function whatsappClickParams(
  href: string,
  pagePath: string,
  label: string,
): { page_path: string; link_label: string; message: string } | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (url.hostname !== "wa.me") return null;
  return {
    page_path: pagePath,
    link_label: label.trim().slice(0, MAX_PARAM),
    message: (url.searchParams.get("text") ?? "").slice(0, MAX_PARAM),
  };
}
