import { describe, expect, it } from "vitest";

import type { DueClientService } from "@/lib/renewals";
import { dueThisWeek, owedByClient, type Receivable } from "@/lib/today";

const due = (
  id: string,
  expiresOn: string,
  expired = expiresOn < "2026-11-01",
): DueClientService => ({
  id,
  clientId: "c1",
  client: "Ana",
  service: "Hosting",
  expiresOn,
  expiry: "",
  expired,
  payment: "Pagado",
  priceWithVatCents: 11385,
  renewal: "",
  next: null,
});

describe("due this week", () => {
  const today = "2026-11-01";

  it("lists this week first, then what already expired", () => {
    const services = [
      due("long-expired", "2026-06-01"),
      due("expired", "2026-10-20"),
      due("today", "2026-11-01"),
      due("last-day", "2026-11-08"),
      due("next-week", "2026-11-09"),
    ];
    expect(dueThisWeek(services, today).map((service) => service.id)).toEqual([
      "today",
      "last-day",
      "expired",
      "long-expired",
    ]);
  });

  it("orders each part by date, whatever order it gets", () => {
    const services = [
      due("nov-5", "2026-11-05"),
      due("nov-2", "2026-11-02"),
      due("oct-1", "2026-10-01"),
      due("oct-30", "2026-10-30"),
    ];
    expect(dueThisWeek(services, today).map((service) => service.id)).toEqual([
      "nov-2",
      "nov-5",
      "oct-30",
      "oct-1",
    ]);
  });

  it("crosses the end of the month and the year", () => {
    expect(
      dueThisWeek([due("a", "2027-01-02", false)], "2026-12-28").map(
        (s) => s.id,
      ),
    ).toEqual(["a"]);
  });

  it("returns nothing for nothing", () => {
    expect(dueThisWeek([], today)).toEqual([]);
  });
});

describe("owed by client", () => {
  const row = (
    client: Receivable["client"],
    service: string,
    balanceCents: number,
  ): Receivable => ({ client, service, balance: { balanceCents } });
  const ana = { id: "a", name: "Ana" };
  const luis = { id: "l", name: "Luis" };

  it("adds up each client's periods, the largest debt first", () => {
    expect(
      owedByClient([
        row(ana, "Hosting", 1000),
        row(luis, "Firma electrónica", 2500),
        row(ana, "Dominio", 900),
      ]),
    ).toEqual([
      {
        clientId: "l",
        client: "Luis",
        services: ["Firma electrónica"],
        owedCents: 2500,
      },
      {
        clientId: "a",
        client: "Ana",
        services: ["Hosting", "Dominio"],
        owedCents: 1900,
      },
    ]);
  });

  it("names a service once, however many periods it owes", () => {
    const [owed] = owedByClient([
      row(ana, "Hosting", 1000),
      row(ana, "Hosting", 1000),
    ]);
    expect(owed).toMatchObject({ services: ["Hosting"], owedCents: 2000 });
  });

  it("groups the periods without a client together", () => {
    expect(
      owedByClient([row(null, "Hosting", 100), row(null, "Dominio", 200)]),
    ).toEqual([
      {
        clientId: null,
        client: "",
        services: ["Hosting", "Dominio"],
        owedCents: 300,
      },
    ]);
  });

  it("orders equal debts by name", () => {
    expect(
      owedByClient([row(luis, "Hosting", 500), row(ana, "Hosting", 500)]).map(
        (owed) => owed.client,
      ),
    ).toEqual(["Ana", "Luis"]);
  });

  it("returns nothing for nothing", () => {
    expect(owedByClient([])).toEqual([]);
  });
});
