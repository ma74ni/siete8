import { describe, expect, it } from "vitest";

import {
  holderTypes,
  requirementsByHolder,
  type PlanWithRequirements,
} from "./service-page";

const natural = [
  { text: "Cédula", required: true, sortOrder: 1 },
  { text: "RUC", required: false, sortOrder: 3 },
  { text: "Correo", required: true, sortOrder: 2 },
];
const legal = [
  { text: "Cédula", required: true, sortOrder: 1 },
  { text: "Nombramiento", required: true, sortOrder: 2 },
];

const plan = (
  holderType: PlanWithRequirements["holderType"],
  sortOrder: number,
  requirements: PlanWithRequirements["requirements"],
): PlanWithRequirements => ({ holderType, sortOrder, requirements });

describe("holderTypes", () => {
  it("lists the present types, natural before legal entity", () => {
    expect(
      holderTypes([plan("legal_entity", 1, []), plan("natural", 1, [])]),
    ).toEqual(["natural", "legal_entity"]);
    expect(holderTypes([plan("not_applicable", 1, [])])).toEqual([
      "not_applicable",
    ]);
    expect(holderTypes([])).toEqual([]);
  });
});

describe("requirementsByHolder (RF-PUB-05)", () => {
  it("deduplicates the list repeated on every plan and keeps panel order", () => {
    const groups = requirementsByHolder([
      plan("natural", 1, natural),
      plan("natural", 2, natural),
      plan("legal_entity", 1, legal),
    ]);
    expect(groups).toEqual([
      {
        holderType: "natural",
        items: [
          { text: "Cédula", required: true },
          { text: "Correo", required: true },
          { text: "RUC", required: false },
        ],
      },
      {
        holderType: "legal_entity",
        items: [
          { text: "Cédula", required: true },
          { text: "Nombramiento", required: true },
        ],
      },
    ]);
  });

  it("marks a text required if any plan requires it", () => {
    const groups = requirementsByHolder([
      plan("natural", 1, [{ text: "RUC", required: false, sortOrder: 1 }]),
      plan("natural", 2, [{ text: "RUC", required: true, sortOrder: 1 }]),
    ]);
    expect(groups[0]!.items).toEqual([{ text: "RUC", required: true }]);
  });

  it("leaves out holder types without requirements", () => {
    expect(
      requirementsByHolder([
        plan("natural", 1, natural),
        plan("legal_entity", 1, []),
      ]),
    ).toHaveLength(1);
  });
});
