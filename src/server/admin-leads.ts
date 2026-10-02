import "server-only";

import type { LeadSource, LeadStatus } from "@/lib/lead-status";
import { requireAdmin } from "@/server/auth";
import { createSessionClient } from "@/server/supabase/session";

/** Panel reads of the leads (E4-07). RLS: only admins read `lead`. */

export async function listLeadsForAdmin(filters: {
  estado?: LeadStatus;
  origen?: LeadSource;
  servicio?: string;
}) {
  await requireAdmin();
  const supabase = await createSessionClient();
  let query = supabase
    .from("lead")
    .select("id, name, phone, email, status, source, created_at, service(name)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (filters.estado) query = query.eq("status", filters.estado);
  if (filters.origen) query = query.eq("source", filters.origen);
  if (filters.servicio) query = query.eq("service_id", filters.servicio);

  const [{ data, error }, { data: services, error: servicesError }] =
    await Promise.all([
      query,
      supabase.from("service").select("id, name").order("name"),
    ]);
  if (error || servicesError) {
    throw new Error(
      `Could not list leads: ${(error ?? servicesError)!.message}`,
    );
  }
  return { leads: data, services };
}

export async function getLeadForAdmin(id: string) {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("lead")
    .select(
      `id, name, phone, email, message, status, source, utm, notes, consent_at,
       created_at, updated_at, service(name, slug), plan(name),
       lead_status_event(status, created_at)`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Could not load lead ${id}: ${error.message}`);
  if (!data) return null;
  return {
    ...data,
    lead_status_event: [...data.lead_status_event].sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    ),
  };
}
