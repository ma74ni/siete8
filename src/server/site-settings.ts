import "server-only";

import { cache } from "react";

import { parseSettings, type SiteSettings } from "@/lib/site-settings";
import { createPublicClient } from "@/server/supabase/public";

/**
 * Public site settings (E4-08): WhatsApp, hours, phone, email, social
 * networks and whether the assistant is on (E10). Read once per render; a
 * missing or broken row falls back to the defaults in `@/lib/site-settings`.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["whatsapp", "contact", "social", "assistant_enabled"]);
  if (error) throw new Error(`Could not load site settings: ${error.message}`);
  return parseSettings(data);
});
