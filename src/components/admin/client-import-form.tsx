"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/sitio/button";
import type { ImportState } from "@/lib/clients";

// Texts from docs/COPY.md §13 (Clientes: Importar).

const IDLE: ImportState = { status: "idle" };

/**
 * CSV import with a preview (RF-CRM-07). The file is read in the browser and
 * its text sent to the action, so "Importar" sends the same file that was
 * reviewed even after React resets the form.
 */
export function ClientImportForm({
  action,
}: {
  action: (state: ImportState, formData: FormData) => Promise<ImportState>;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE);
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="import-file" className="font-medium">
          Archivo CSV
        </label>
        <input
          id="import-file"
          type="file"
          accept=".csv,text/csv"
          className="min-h-12"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            setFileName(file?.name ?? "");
            setCsv(file ? await file.text() : "");
          }}
        />
        {fileName && <p className="text-small">{fileName}</p>}
      </div>
      <input type="hidden" name="csv" value={csv} />

      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="submit"
          name="intent"
          value="review"
          variant={state.status === "preview" ? "secondary" : "primary"}
          disabled={pending || !csv}
        >
          Revisar archivo
        </Button>
        {state.status === "preview" && (
          <Button type="submit" name="intent" value="import" disabled={pending}>
            Importar
          </Button>
        )}
      </div>

      <div role={state.status === "error" ? "alert" : "status"}>
        {state.status === "preview" && (
          <p>
            {state.newClients} clientes nuevos, {state.existingClients}{" "}
            existentes y {state.services} servicios listos para importar.
          </p>
        )}
        {state.status === "done" && (
          <p className="font-medium">{state.message}</p>
        )}
        {state.status === "error" && (
          <div className="flex flex-col gap-2">
            <p className="font-medium text-accent">{state.message}</p>
            {state.errors.length > 0 && (
              <ul className="flex list-disc flex-col gap-1 pl-5">
                {state.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
