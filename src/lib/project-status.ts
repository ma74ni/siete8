import type { Database } from "@/lib/database.types";

export type ProjectStatus = Database["public"]["Enums"]["project_status"];

/** Public label of each project status (SRS 3.7). */
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  in_development: "Próximamente",
  active: "En línea",
  internal: "Uso interno del cliente",
  replaced: "Versión anterior",
  archived: "Proyecto finalizado",
};

/** Only active projects link to the live site (SRS 3.7). */
export function showsLiveLink(status: ProjectStatus): boolean {
  return status === "active";
}
