/**
 * Keeping what was typed after a Server Action error (E13-01). React clears a
 * form's fields when its action finishes, also when the action answers with
 * an error; ActionForm puts the sent values back. This decides, field by
 * field, what to put back; it only reads the field's name, type, value and
 * whether it is disabled, so it runs without a browser in the tests.
 */

/** The parts of an input, textarea or select that matter here. */
export type FieldLike = {
  name: string;
  type: string;
  value: string;
  disabled: boolean;
};

export type RestoredField = { value: string } | { checked: boolean } | null;

/** Never filled back: not typed by the person, or not safe to repeat. */
const SKIPPED = new Set([
  "hidden",
  "file",
  "password",
  "submit",
  "button",
  "reset",
  "image",
  "select-multiple",
]);

/** Checkboxes and radios: what matters is whether their value was sent. */
export function isChoice(field: Pick<FieldLike, "type">): boolean {
  return field.type === "checkbox" || field.type === "radio";
}

/**
 * What `field` shows again from the submitted data: its value, whether it is
 * checked, or null to leave it as it is (unnamed, skipped, disabled, or not
 * sent). `position` is the field's place among the enabled, non-choice
 * fields with its name: several rows can share a name, like the social
 * networks in Configuración, and each gets its own value back.
 */
export function restoredField(
  field: FieldLike,
  submitted: FormData,
  position = 0,
): RestoredField {
  if (!field.name || field.disabled || SKIPPED.has(field.type)) return null;
  const sent = submitted
    .getAll(field.name)
    .filter((value): value is string => typeof value === "string");
  if (isChoice(field)) return { checked: sent.includes(field.value) };
  const value = sent[position];
  return value === undefined ? null : { value };
}
