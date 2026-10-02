import "server-only";

import { monthStart, parseAssistant } from "@/lib/assistant";
import { requireAdmin } from "@/server/auth";
import { createSessionClient } from "@/server/supabase/session";

/** Panel reads of the assistant (E10, RF-ADM-07/08). RLS: only admins. */

export async function getAssistantForAdmin() {
  await requireAdmin();
  const supabase = await createSessionClient();
  const [settings, month, recent] = await Promise.all([
    supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["assistant", "assistant_enabled"]),
    supabase
      .from("chat_session")
      .select("cost_usd")
      .gte("created_at", monthStart(new Date()).toISOString()),
    supabase
      .from("chat_session")
      .select("id, created_at, message_count, cost_usd, lead(id, name)")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  const error = settings.error ?? month.error ?? recent.error;
  if (error) throw new Error(`Could not load the assistant: ${error.message}`);

  const rows = settings.data ?? [];
  const sessions = month.data ?? [];
  const value = (key: string) => rows.find((row) => row.key === key)?.value;
  return {
    enabled: value("assistant_enabled") === true,
    settings: parseAssistant(value("assistant")),
    spentThisMonth: sessions.reduce(
      (sum, row) => sum + Number(row.cost_usd),
      0,
    ),
    conversationsThisMonth: sessions.length,
    recent: recent.data ?? [],
  };
}

/** One conversation with its messages, in order (RF-ADM-07). */
export async function getConversationForAdmin(id: string) {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("chat_session")
    .select(
      "id, created_at, message_count, cost_usd, utm, lead(id, name), chat_message(role, content, created_at)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error)
    throw new Error(`Could not load conversation ${id}: ${error.message}`);
  if (!data) return null;
  return {
    ...data,
    chat_message: [...data.chat_message].sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    ),
  };
}

/** The conversations that brought a lead, oldest first. */
export async function getLeadConversations(leadId: string) {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("chat_session")
    .select("id, created_at, chat_message(role, content, created_at)")
    .eq("lead_id", leadId)
    .order("created_at");
  if (error)
    throw new Error(`Could not load the conversations: ${error.message}`);
  return data.map((session) => ({
    ...session,
    chat_message: [...session.chat_message].sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    ),
  }));
}
