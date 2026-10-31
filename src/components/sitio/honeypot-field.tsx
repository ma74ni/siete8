/**
 * A field hidden from people and screen readers that only bots fill in
 * (RNF-16); `submitLead` drops any form that brings `website`.
 */
export function HoneypotField() {
  return (
    <div
      aria-hidden
      className="absolute -left-[9999px] h-px w-px overflow-hidden"
    >
      <label htmlFor="field-website">Sitio web</label>
      <input
        id="field-website"
        name="website"
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}
