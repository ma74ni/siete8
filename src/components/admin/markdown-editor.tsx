"use client";

import { useId, useState } from "react";

import { Markdown } from "@/components/sitio/markdown";
import { cx } from "@/lib/cx";

// Texts from docs/COPY.md §13.

const tab =
  "min-h-11 border-b-2 px-4 font-medium transition-colors duration-150 ease-out";

/**
 * Markdown textarea with a preview rendered like the article (E4-05). The
 * textarea stays in the form while previewing, so its value is submitted.
 */
export function MarkdownEditor({
  name,
  label,
  defaultValue,
  hint,
}: {
  name: string;
  label: string;
  defaultValue: string;
  hint: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [preview, setPreview] = useState(false);
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        <div className="flex">
          {[
            { on: false, text: "Escribir" },
            { on: true, text: "Vista previa" },
          ].map((option) => (
            <button
              key={option.text}
              type="button"
              aria-pressed={preview === option.on}
              onClick={() => setPreview(option.on)}
              className={cx(
                tab,
                preview === option.on
                  ? "border-action text-fg"
                  : "border-transparent text-fg hover:border-border",
              )}
            >
              {option.text}
            </button>
          ))}
        </div>
      </div>
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={24}
        aria-describedby={`${id}-hint`}
        className={cx(
          "w-full rounded-control border border-field-border bg-bg px-3 py-3 text-fg",
          preview && "hidden",
        )}
      />
      {preview && (
        <div className="min-h-64 rounded-control border border-border p-5">
          {value.trim() ? (
            <Markdown>{value}</Markdown>
          ) : (
            <p>Sin texto todavía.</p>
          )}
        </div>
      )}
      <p id={`${id}-hint`} className="text-small">
        {hint}
      </p>
    </div>
  );
}
