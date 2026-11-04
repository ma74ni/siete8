import { describe, expect, it } from "vitest";

import { parseCsv, toCsv } from "@/lib/csv";

describe("CSV", () => {
  it("reads semicolons, quotes, CRLF and the BOM", () => {
    const text = '﻿nombre;notas\r\n"Heladería; Sur";"dice ""hola"""\r\n;\r\n';
    expect(parseCsv(text)).toEqual([
      ["nombre", "notas"],
      ["Heladería; Sur", 'dice "hola"'],
    ]);
  });

  it("reads commas when the file uses them", () => {
    expect(parseCsv("a,b\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("writes what it reads", () => {
    const rows = [
      ["nombre", "notas"],
      ["Heladería; Sur", 'dice "hola"\nadiós'],
    ];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});
