"use server";

import "server-only";

import { type FormState, leadAdminForm } from "@/lib/admin-forms";
import { failed, INVALID, parse } from "@/server/admin-action-helpers";
import { requireAdmin } from "@/server/auth";
import { createSessionClient } from "@/server/supabase/session";
import { revalidatePath } from "next/cache";

// Panel writes of the leads (E4-07). The status history is written by a
// database trigger (lead_status_event). Texts from docs/COPY.md §13.

export async function saveLead(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(leadAdminForm, formData);
  if (!parsed.success) return INVALID;
  const { id, ...fields } = parsed.data;

  const supabase = await createSessionClient();
  const { error } = await supabase.from("lead").update(fields).eq("id", id);
  if (error) return failed("guardar el lead");
  // Leads are not on the public site: only the panel pages change.
  revalidatePath("/admin/leads", "layout");
  return { status: "success", message: "Lead guardado." };
}
