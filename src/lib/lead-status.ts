import type { Database } from "@/lib/database.types";

export type LeadStatus = Database["public"]["Enums"]["lead_status"];
export type LeadSource = Database["public"]["Enums"]["lead_source"];

export type ProformaStatus = Database["public"]["Enums"]["proforma_status"];

/** Panel labels (COPY §13), in the order a lead moves through (E11-05). */
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  proposal_sent: "Proforma enviada",
  won: "Ganado",
  lost: "Perdido",
};

export const PROFORMA_STATUS_LABELS: Record<ProformaStatus, string> = {
  sent: "Enviada",
  accepted: "Aceptada",
  rejected: "Rechazada",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  form: "Formulario",
  whatsapp: "WhatsApp",
  assistant: "Asistente",
};
