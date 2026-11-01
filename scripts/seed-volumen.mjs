// Loads a realistic volume of made-up panel data into the LOCAL database, to
// see how each screen holds up with many clients (E14). Every name is
// invented; no real client appears. It refuses any Supabase that is not on
// this machine. `pnpm db:reset` removes it (and the test admins: run
// `pnpm e2e:admin` again afterwards).
//
//   pnpm db:seed:volumen

import { createClient } from "@supabase/supabase-js";

import { localSupabase } from "./local-supabase.mjs";

const CLIENTS = 40;
const LEADS = 30;
const PURCHASES = 20;
const MARK = "Datos de volumen (pnpm db:seed:volumen).";
/** Written last: without it, an earlier run stopped halfway. */
const LAST_CONCEPT = `Compra ${PURCHASES} (prueba)`;

// A seeded generator: the same names, services and amounts on every run.
// Dates move with today, so "por vencer" and "vencido" keep making sense.
let state = 20261101;
const random = () => {
  state = (state * 1103515245 + 12345) % 2 ** 31;
  return state / 2 ** 31;
};
const pick = (items) => items[Math.floor(random() * items.length)];
const between = (min, max) => min + Math.floor(random() * (max - min + 1));

const FIRST = [
  "Andrea",
  "Bruno",
  "Carla",
  "Elena",
  "Fausto",
  "Gabriela",
  "Hernán",
  "Inés",
  "Jorge",
  "Karina",
  "Luis",
  "Mónica",
  "Néstor",
  "Olga",
  "Pablo",
  "Rocío",
  "Santiago",
  "Tatiana",
  "Wilson",
];
const LAST = [
  "Almeida",
  "Benítez",
  "Cevallos",
  "Duque",
  "Espinoza",
  "Flores",
  "Guerrero",
  "Herrera",
  "Iturralde",
  "Jaramillo",
  "Loor",
  "Mena",
  "Naranjo",
  "Ortega",
  "Quishpe",
  "Rivadeneira",
  "Salazar",
  "Torres",
  "Villacís",
];
const BUSINESS = [
  "Ferretería",
  "Panadería",
  "Consultorio",
  "Estudio",
  "Distribuidora",
  "Taller",
  "Librería",
  "Farmacia",
  "Academia",
  "Cafetería",
];
const PLACE = [
  "Los Andes",
  "El Ejido",
  "La Mariscal",
  "Cumbayá",
  "Tumbaco",
  "Carcelén",
  "La Floresta",
  "San Rafael",
  "Conocoto",
  "El Batán",
];
const PROVIDERS = [
  "Proveedor Hosting (prueba)",
  "Registrador de dominios (prueba)",
  "Licencias de correo (prueba)",
  "Distribuidor de firmas (prueba)",
  "Nube y servidores (prueba)",
];

const now = new Date();
const today = new Date(
  Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
);
const day = (offsetDays) => {
  const date = new Date(today);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};
const addMonths = (iso, months) => {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
};
/** Total with VAT in cents, rounded half up: the formula of src/lib/price.ts. */
const withVatCents = (price, rate) =>
  Math.floor(
    (Math.round(price * 100) * (10_000 + Math.round(rate * 10_000)) + 5_000) /
      10_000,
  );

const { url, secretKey } = localSupabase();
const db = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function insert(table, rows) {
  const { data, error } = await db.from(table).insert(rows).select();
  if (error) throw new Error(`${table}: ${error.message}`);
  return data;
}

/**
 * Providers by name (unique, ignoring case): one left by an earlier test is
 * reused instead of failing.
 */
async function providersNamed(names) {
  const { data: existing, error } = await db
    .from("provider")
    .select("id, name");
  if (error) throw new Error(`provider: ${error.message}`);
  const key = (name) => name.trim().toLowerCase();
  const known = new Map(existing.map((row) => [key(row.name), row]));
  const missing = names.filter((name) => !known.has(key(name)));
  if (missing.length) {
    const created = await insert(
      "provider",
      missing.map((name) => ({ name })),
    );
    for (const row of created) known.set(key(row.name), row);
  }
  return names.map((name) => known.get(key(name)));
}

/** Whether the volume is already there, complete or halfway. */
async function loadedState() {
  const { count: clients } = await db
    .from("client")
    .select("id", { count: "exact", head: true })
    .eq("notes", MARK);
  if (!clients) return "empty";
  const { count: last } = await db
    .from("purchase")
    .select("id", { count: "exact", head: true })
    .eq("concept", LAST_CONCEPT);
  return last ? "complete" : "partial";
}

async function load() {
  const { data: services, error } = await db
    .from("service")
    .select(
      "id, name, plan(id, name, price_without_vat, vat_rate, duration_value, duration_unit)",
    );
  if (error) throw error;
  const withPlans = services.filter((service) => service.plan.length > 0);
  const withoutPlans = services.filter((service) => service.plan.length === 0);
  if (!withPlans.length || !withoutPlans.length) {
    throw new Error("The catalog needs services with and without plans.");
  }

  // Clients, their services, periods and payments ------------------------------

  const clients = await insert(
    "client",
    Array.from({ length: CLIENTS }, (_, index) => {
      const company = index % 4 === 0;
      const name = company
        ? `${pick(BUSINESS)} ${pick(PLACE)}`
        : `${pick(FIRST)} ${pick(LAST)} ${pick(LAST)}`;
      return {
        kind: company ? "company" : "person",
        name: `${name} (prueba)`,
        phone: `09${between(10000000, 99999999)}`,
        email: random() < 0.7 ? `contacto${index}@ejemplo.test` : null,
        notes: MARK,
      };
    }),
  );

  let serviceCount = 0;
  let paymentCount = 0;
  for (const client of clients) {
    const count = between(2, 5);
    const drafts = Array.from({ length: count }, () => {
      const service = random() < 0.75 ? pick(withPlans) : pick(withoutPlans);
      const plan = service.plan.length ? pick(service.plan) : null;
      const value = plan?.duration_value ?? 1;
      const unit = plan?.duration_unit ?? "year";
      return {
        service,
        plan,
        value,
        unit,
        months: unit === "month" ? value : unit === "year" ? value * 12 : 1,
        price: plan ? Number(plan.price_without_vat) : between(80, 900),
        rate: plan ? Number(plan.vat_rate) : 0.15,
        cancelled: random() < 0.1,
        // From long expired to just sold: some due soon, some overdue.
        start: day(-between(10, 540)),
        paid: random(),
      };
    });
    const rows = await insert(
      "client_service",
      drafts.map((draft) => ({
        client_id: client.id,
        service_id: draft.service.id,
        plan_id: draft.plan?.id ?? null,
        detail: draft.plan
          ? null
          : pick([
              "Mantenimiento mensual",
              "Desarrollo inicial",
              "Soporte por horas",
              null,
            ]),
        renews_every_value: draft.value,
        renews_every_unit: draft.unit,
        status: draft.cancelled ? "cancelled" : "active",
        cancelled_at: draft.cancelled ? today.toISOString() : null,
      })),
    );
    serviceCount += rows.length;
    const periods = await insert(
      "client_service_period",
      drafts.map((draft, index) => ({
        client_service_id: rows[index].id,
        sold_on: draft.start,
        starts_on: draft.start,
        ends_on: addMonths(draft.start, draft.months),
        price_without_vat: draft.price,
        vat_rate: draft.rate,
      })),
    );
    // 60 % paid in full, 20 % in part, 20 % owed.
    const payments = drafts.flatMap((draft, index) => {
      if (draft.paid >= 0.8) return [];
      const total = withVatCents(draft.price, draft.rate);
      const cents = draft.paid < 0.6 ? total : Math.round(total * 0.4);
      return [
        {
          period_id: periods[index].id,
          paid_on: draft.start,
          amount: cents / 100,
        },
      ];
    });
    if (payments.length) {
      await insert("client_payment", payments);
      paymentCount += payments.length;
    }
  }

  // Leads ---------------------------------------------------------------------

  await insert(
    "lead",
    Array.from({ length: LEADS }, (_, index) => {
      const status = pick([
        "new",
        "new",
        "contacted",
        "proposal_sent",
        "won",
        "lost",
      ]);
      return {
        name: `${pick(FIRST)} ${pick(LAST)} (prueba)`,
        phone: `09${between(10000000, 99999999)}`,
        email: random() < 0.5 ? `lead${index}@ejemplo.test` : null,
        service_id: pick(services).id,
        source: pick(["form", "whatsapp", "assistant"]),
        status,
        lost_reason: status === "lost" ? "No respondió" : null,
        consent_at: today.toISOString(),
        message: random() < 0.6 ? "Quisiera información y precios." : null,
      };
    }),
  );

  // Providers and purchases ---------------------------------------------------

  const providers = await providersNamed(PROVIDERS);
  for (let index = 1; index <= PURCHASES; index++) {
    const yearly = random() < 0.6;
    const unitCost = between(5, 180);
    const [purchase] = await insert("purchase", {
      provider_id: pick(providers).id,
      // The last one carries LAST_CONCEPT: the run finished.
      concept:
        index === PURCHASES
          ? LAST_CONCEPT
          : `${pick(["Plan", "Licencias", "Dominio", "Servidor", "Certificados"])} ${index} (prueba)`,
      renews_every_value: 1,
      renews_every_unit: yearly ? "year" : "month",
      auto_renew: random() < 0.4,
      quantity: between(1, 10),
      unit_cost: unitCost,
    });
    await insert("purchase_service", {
      purchase_id: purchase.id,
      service_id: pick(withPlans).id,
    });
    const from = day(-between(5, 400));
    await insert("purchase_payment", {
      purchase_id: purchase.id,
      paid_on: from,
      covers_from: from,
      covers_to: addMonths(from, yearly ? 12 : 1),
      amount: unitCost,
      vat_amount: (withVatCents(unitCost, 0.15) - unitCost * 100) / 100,
    });
  }

  console.log(
    `Loaded ${clients.length} clients, ${serviceCount} services, ${paymentCount} payments, ${LEADS} leads and ${PURCHASES} purchases into ${url}.`,
  );
}

const loaded = await loadedState();
if (loaded === "complete") {
  console.log("The volume data is already loaded. pnpm db:reset starts over.");
} else if (loaded === "partial") {
  console.error(
    "An earlier load stopped halfway: run pnpm db:reset and load again.",
  );
  process.exitCode = 1;
} else {
  try {
    await load();
  } catch (error) {
    console.error(
      `${error.message}\nThe load stopped halfway: run pnpm db:reset and load again.`,
    );
    process.exitCode = 1;
  }
}
