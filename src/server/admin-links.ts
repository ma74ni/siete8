import "server-only";

import { requireAdmin } from "@/server/auth";
import { createSessionClient } from "@/server/supabase/session";

/** Panel read of the links page buttons, hidden ones included. */

export type LinkButtonForAdmin = {
  id: string;
  label: string;
  kind: "url" | "whatsapp" | "latest_post";
  url: string | null;
  highlight: boolean;
  visible: boolean;
  sort_order: number;
  updated_at: string;
};

export async function listLinkButtonsForAdmin(): Promise<LinkButtonForAdmin[]> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("link_button")
    .select("id, label, kind, url, highlight, visible, sort_order, updated_at")
    .order("sort_order");
  if (error) throw new Error(`Could not list link buttons: ${error.message}`);
  return data;
}
