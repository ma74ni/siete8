import type { ReactNode } from "react";

import { IMAGE_TYPES } from "@/lib/admin-forms";

// Panel building blocks shared by the service, project and post editors.

const control =
  "min-h-12 w-full rounded-control border border-field-border bg-bg px-3 text-fg";

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6 border-t border-border pt-8">
      <h2 className="text-h3">{title}</h2>
      {children}
    </section>
  );
}

export function SelectField({
  label,
  id,
  name,
  defaultValue,
  children,
}: {
  label: string;
  id: string;
  name: string;
  defaultValue: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        className={control}
      >
        {children}
      </select>
    </div>
  );
}

/** File input for the image bucket: JPEG, PNG, WebP or AVIF, up to 2 MB. */
export function ImageField({
  label,
  id,
  name = "file",
}: {
  label: string;
  id: string;
  name?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="file"
        accept={IMAGE_TYPES.join(",")}
        required
        aria-describedby={`${id}-hint`}
        className="min-h-12 w-full py-2 file:mr-4 file:min-h-10 file:cursor-pointer file:rounded-control file:border file:border-fg file:bg-bg file:px-4 file:text-fg"
      />
      <p id={`${id}-hint`} className="text-small">
        JPEG, PNG, WebP o AVIF, hasta 2 MB. Súbela ya recortada.
      </p>
    </div>
  );
}
