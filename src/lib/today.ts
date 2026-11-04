import { addPeriod } from "@/lib/days";
import type { DueClientService } from "@/lib/renewals";

/**
 * "Hoy", the panel home (E14-03, DESIGN §12.2 rule 7): what is due this week
 * and who owes what, built from the same rows as Por vencer and Por cobrar.
 */

/** Days ahead that "Vence en 7 días" looks at. */
export const TODAY_WINDOW_DAYS = 7;

/** Rows per section of Hoy; the rest is one link away, in its section. */
export const TODAY_ROWS = 10;

/**
 * Client services that expire within the next 7 days, the soonest first, and
 * then the ones that already expired, the most recent first: what is due this
 * week leads, however long the list of old expirations is.
 */
export function dueThisWeek(
  services: readonly DueClientService[],
  today: string,
): DueClientService[] {
  const limit = addPeriod(today, TODAY_WINDOW_DAYS, "day");
  const byDate = (a: DueClientService, b: DueClientService) =>
    a.expiresOn.localeCompare(b.expiresOn);
  const coming = services
    .filter((service) => !service.expired && service.expiresOn <= limit)
    .sort(byDate);
  const expired = services
    .filter((service) => service.expired)
    .sort((a, b) => byDate(b, a));
  return [...coming, ...expired];
}

export type Receivable = {
  client: { id: string; name: string } | null;
  service: string;
  balance: { balanceCents: number };
};

export type OwedClient = {
  /** Null for periods whose client is missing; they are grouped together. */
  clientId: string | null;
  client: string;
  /** The services that owe, each once, in the order they were sold. */
  services: string[];
  owedCents: number;
};

/** What each client owes in all, the largest debt first. */
export function owedByClient(rows: readonly Receivable[]): OwedClient[] {
  const byClient = new Map<string | null, OwedClient>();
  for (const row of rows) {
    const clientId = row.client?.id ?? null;
    const owed = byClient.get(clientId) ?? {
      clientId,
      client: row.client?.name ?? "",
      services: [],
      owedCents: 0,
    };
    if (!owed.services.includes(row.service)) owed.services.push(row.service);
    owed.owedCents += row.balance.balanceCents;
    byClient.set(clientId, owed);
  }
  return [...byClient.values()].sort(
    (a, b) =>
      b.owedCents - a.owedCents || a.client.localeCompare(b.client, "es"),
  );
}
