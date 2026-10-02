import type { Database } from "@/lib/database.types";

export type LeadStatus = Database["public"]["Enums"]["lead_status"];
export type LeadSource = Database["public"]["Enums"]["lead_source"];

/** Panel labels (COPY §13), in the order a lead moves through. */
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  closed: "Cerrado",
  lost: "Perdido",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  form: "Formulario",
  whatsapp: "WhatsApp",
  assistant: "Asistente",
};
