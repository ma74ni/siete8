import "server-only";

import { createPublicClient } from "@/server/supabase/public";

/** Visible buttons of /enlaces, in panel order (RLS hides the rest). */
export async function getLinkButtons() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("link_button")
    .select("id, label, kind, url, highlight")
    .order("sort_order");
  if (error) throw new Error(`Could not load link buttons: ${error.message}`);
  return data;
}
