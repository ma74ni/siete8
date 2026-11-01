import { mkdirSync, writeFileSync } from "node:fs";

import { type Page, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../src/lib/database.types";
import { localSupabase } from "../scripts/local-supabase.mjs";

// Measures every panel screen with the volume data loaded (E14-01), so the
// redesign is judged by numbers: height, open forms, save buttons, fields and
// sideways scroll on a phone. Not part of `pnpm e2e`: run `pnpm e2e:medir`
// after `pnpm db:seed:volumen`. The table lands in test-results/.

test.skip(!process.env.E2E_MEDIR, "Only with pnpm e2e:medir.");

type Measure = {
  height: number;
  forms: number;
  saveButtons: number;
  fields: number;
  sideways: boolean;
  /** On a phone, the outermost element that sticks out sideways. */
  culprit: string;
};

/** What is on screen now: only visible forms, buttons and fields count. */
async function measure(page: Page): Promise<Measure> {
  return page.evaluate(() => {
    const visible = (element: Element) =>
      (element as HTMLElement).offsetParent !== null;
    const all = (selector: string) =>
      Array.from(document.querySelectorAll(selector)).filter(visible);
    return {
      height: document.documentElement.scrollHeight,
      forms: all("main form").length,
      saveButtons: all('main form button[type="submit"]').length,
      fields: all('main input:not([type="hidden"]), main select, main textarea')
        .length,
      sideways:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
      culprit: (() => {
        const width = document.documentElement.clientWidth;
        // The outermost element wider than the screen whose parent is not,
        // skipping what a scrolling box inside the screen clips (a table
        // inside DataTable's region).
        const clipped = (element: Element) => {
          for (let box = element.parentElement; box; box = box.parentElement) {
            if (
              getComputedStyle(box).overflowX !== "visible" &&
              box.getBoundingClientRect().right <= width + 1
            ) {
              return true;
            }
          }
          return false;
        };
        const outside = Array.from(document.querySelectorAll("body *")).find(
          (element) =>
            element.getBoundingClientRect().right > width + 1 &&
            (element.parentElement?.getBoundingClientRect().right ?? 0) <=
              width + 1 &&
            !clipped(element),
        );
        if (!outside) return "";
        const label =
          outside.getAttribute("aria-label") ??
          outside.textContent?.trim().slice(0, 40) ??
          "";
        const classes = String(outside.className).slice(0, 50);
        return `<${outside.tagName.toLowerCase()} class="${classes}"> ${label}`;
      })(),
    };
  });
}

/** Ids of real local records to open: the client with most services, etc. */
async function sampleIds() {
  const { url, secretKey } = localSupabase();
  const db = createClient<Database>(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  /** The id of the first row of a query, or null; a failed query fails. */
  const idOf = ({
    data,
    error,
  }: {
    data: { id: string }[] | null;
    error: { message: string } | null;
  }) => {
    if (error) throw new Error(error.message);
    return data?.[0]?.id ?? null;
  };

  const { data: services, error } = await db
    .from("client_service")
    .select("client_id");
  if (error) throw new Error(error.message);
  const counts = new Map<string, number>();
  for (const row of services ?? []) {
    counts.set(row.client_id, (counts.get(row.client_id) ?? 0) + 1);
  }
  const client =
    [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  // A lead with proformas (left by the e2e tests) and a volume purchase:
  // older hand-made rows have ids the panel rejects.
  const { data: proformas, error: proformaError } = await db
    .from("proforma")
    .select("lead_id, lead!inner(name)")
    .like("lead.name", "Lead E2E%")
    .order("created_at")
    .limit(1);
  if (proformaError) throw new Error(proformaError.message);
  return {
    client,
    lead: proformas?.[0]?.lead_id ?? null,
    purchase: idOf(
      await db
        .from("purchase")
        .select("id")
        .like("concept", "% (prueba)")
        .order("created_at")
        .limit(1),
    ),
    service: idOf(
      await db
        .from("service")
        .select("id")
        .eq("slug", "firma-electronica")
        .limit(1),
    ),
    project: idOf(
      await db.from("project").select("id").order("created_at").limit(1),
    ),
    post: idOf(await db.from("post").select("id").order("created_at").limit(1)),
    chat: idOf(
      await db.from("chat_session").select("id").order("created_at").limit(1),
    ),
  };
}

test("@medicion every panel screen", async ({ page }) => {
  test.setTimeout(600_000);
  const ids = await sampleIds();
  const screens: [string, string | null][] = [
    ["Inicio (servicios)", "/admin"],
    [
      "Servicio: Firma electrónica",
      ids.service && `/admin/servicios/${ids.service}`,
    ],
    ["Proyectos", "/admin/proyectos"],
    ["Proyecto", ids.project && `/admin/proyectos/${ids.project}`],
    ["Proyecto nuevo", "/admin/proyectos/nuevo"],
    ["Blog", "/admin/blog"],
    ["Artículo", ids.post && `/admin/blog/${ids.post}`],
    ["Artículo nuevo", "/admin/blog/nuevo"],
    ["Leads", "/admin/leads"],
    ["Lead con proforma", ids.lead && `/admin/leads/${ids.lead}`],
    ["Lead nuevo", "/admin/leads/nuevo"],
    ["Clientes", "/admin/clientes"],
    [
      "Cliente con más servicios",
      ids.client && `/admin/clientes/${ids.client}`,
    ],
    ["Cliente nuevo", "/admin/clientes/nuevo"],
    ["Importar clientes", "/admin/clientes/importar"],
    ["Por vencer", "/admin/por-vencer"],
    ["Por cobrar", "/admin/por-cobrar"],
    ["Compras", "/admin/compras"],
    ["Compra", ids.purchase && `/admin/compras/${ids.purchase}`],
    ["Compra nueva", "/admin/compras/nueva"],
    ["Ganancias", "/admin/ganancias"],
    ["Asistente", "/admin/asistente"],
    ["Conversación", ids.chat && `/admin/asistente/${ids.chat}`],
    ["Enlaces", "/admin/enlaces"],
    ["Configuración", "/admin/configuracion"],
  ];

  const rows: string[] = [];
  for (const [name, path] of screens) {
    if (!path) {
      rows.push(`| ${name} | (sin datos) | | | | | |`);
      continue;
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(path);
    const desktop = await measure(page);
    await page.setViewportSize({ width: 360, height: 800 });
    await page.reload();
    const phone = await measure(page);
    rows.push(
      `| ${name} | ${desktop.height} | ${phone.height} | ${desktop.forms} | ${desktop.saveButtons} | ${desktop.fields} | ${phone.sideways ? `sí: ${phone.culprit || "ningún elemento visible; algo con posición absoluta escapa de un recorte"}` : "no"} |`,
    );
  }

  const table = [
    "| Pantalla | Alto 1440 (px) | Alto 360 (px) | Formularios | Botones de enviar | Campos | Desborde a 360 |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
  mkdirSync("test-results", { recursive: true });
  writeFileSync("test-results/medicion-panel.md", `${table}\n`);
  console.log(`\n${table}\n`);
});
