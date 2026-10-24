import { describe, expect, it } from "vitest";

import { type FieldLike, restoredField } from "@/lib/form-restore";

function sent(entries: [string, string][]): FormData {
  const data = new FormData();
  for (const [name, value] of entries) data.append(name, value);
  return data;
}

function field(
  name: string,
  type: string,
  value = "",
  disabled = false,
): FieldLike {
  return { name, type, value, disabled };
}

describe("restoredField", () => {
  const typed = sent([
    ["name", "Ana Prueba"],
    ["message", "Necesito la firma."],
    ["service_id", "s1"],
    ["consent", "on"],
    ["service_ids", "a"],
    ["service_ids", "c"],
    ["charge_to", "client"],
  ]);

  it("puts back text, textareas and selects", () => {
    expect(restoredField(field("name", "text"), typed)).toEqual({
      value: "Ana Prueba",
    });
    expect(restoredField(field("message", "textarea"), typed)).toEqual({
      value: "Necesito la firma.",
    });
    expect(restoredField(field("service_id", "select-one"), typed)).toEqual({
      value: "s1",
    });
  });

  it("gives each row of a list its own value, by position", () => {
    // Like the social networks in Configuración: social_label, social_url, ...
    const rows = sent([
      ["social_label", "Instagram"],
      ["social_url", "https://instagram.com/siete8.ec"],
      ["social_label", "Facebook"],
      ["social_url", "https://facebook.com/siete8.ec"],
    ]);
    const label = (position: number) =>
      restoredField(field("social_label", "text"), rows, position);
    expect(label(0)).toEqual({ value: "Instagram" });
    expect(label(1)).toEqual({ value: "Facebook" });
    expect(label(2)).toBeNull();
  });

  it("checks the checkboxes and radios that were sent, and only those", () => {
    const box = (name: string, value: string) =>
      restoredField(field(name, "checkbox", value), typed);
    expect(box("consent", "on")).toEqual({ checked: true });
    expect(box("service_ids", "a")).toEqual({ checked: true });
    expect(box("service_ids", "b")).toEqual({ checked: false });
    expect(box("visible", "on")).toEqual({ checked: false });
    expect(
      restoredField(field("charge_to", "radio", "services"), typed),
    ).toEqual({ checked: false });
  });

  it("leaves disabled fields as they are: they are not sent", () => {
    expect(
      restoredField(field("consent", "checkbox", "on", true), typed),
    ).toBeNull();
    expect(
      restoredField(field("renews_every_value", "number", "1", true), typed),
    ).toBeNull();
  });

  it("leaves hidden, file and password fields, unnamed fields and fields not sent", () => {
    const data = sent([
      ["id", "x"],
      ["password", "secreto"],
    ]);
    expect(restoredField(field("id", "hidden", "x"), data)).toBeNull();
    expect(restoredField(field("password", "password"), data)).toBeNull();
    expect(restoredField(field("cover", "file"), data)).toBeNull();
    expect(restoredField(field("", "text"), data)).toBeNull();
    expect(restoredField(field("notes", "textarea"), data)).toBeNull();
  });
});
