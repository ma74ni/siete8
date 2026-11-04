"use server";

import "server-only";

import { formValues } from "@/lib/admin-forms";
import { buildImport, type ImportState } from "@/lib/client-import";
import { parseCsv } from "@/lib/csv";
import { todayInQuito } from "@/lib/days";
import { importClients, refreshClients } from "@/server/admin-client-helpers";
import { getClientCatalog, getExistingTaxIds } from "@/server/admin-clients";
import { requireAdmin } from "@/server/auth";

// Panel import of clients from a CSV (RF-CRM-07). Texts from docs/COPY.md §13.

const MAX_CSV_CHARS = 1_000_000;

/**
 * "Revisar archivo" shows what would be imported; "Importar" checks the same
 * text again and saves it all or nothing. The browser sends the file's text,
 * which is never trusted: it is parsed and validated on every call.
 */
export async function importClientsCsv(
  _state: ImportState,
  formData: FormData,
): Promise<ImportState> {
  await requireAdmin();
  const { csv = "", intent } = formValues(formData);
  if (!csv.trim() || csv.length > MAX_CSV_CHARS) {
    return {
      status: "error",
      message: "Elige el archivo CSV con tus clientes.",
      errors: [],
    };
  }

  const [catalog, existing] = await Promise.all([
    getClientCatalog(),
    getExistingTaxIds(),
  ]);
  const result = buildImport(parseCsv(csv), catalog, existing, todayInQuito());
  if (result.errors.length > 0) {
    return {
      status: "error",
      message: "Corrige el archivo y súbelo de nuevo; no se guardó nada.",
      errors: result.errors,
    };
  }
  if (intent !== "import") {
    return {
      status: "preview",
      newClients: result.newClients,
      existingClients: result.existingClients,
      services: result.services,
    };
  }

  const { error, result: saved } = await importClients(result.clients);
  if (error) {
    return {
      status: "error",
      message:
        error.code === "23505"
          ? "Hay dos clientes con el mismo RUC o cédula. Corrige el archivo y súbelo de nuevo; no se guardó nada."
          : "No se pudo importar. Inténtalo de nuevo; si sigue fallando, avísanos.",
      errors: [],
    };
  }
  refreshClients();
  return {
    status: "done",
    message: `${saved!.clients_created} clientes y ${saved!.services_created} servicios importados.`,
  };
}
