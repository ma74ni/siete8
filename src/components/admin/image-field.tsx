"use client";

import { useRef, useState } from "react";

import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/admin-forms";
import { fitWithin, QUALITIES, webpName } from "@/lib/image-resize";

// Texts from docs/COPY.md §13.

type Status =
  | { kind: "idle" }
  | { kind: "working" }
  | { kind: "ready"; message: string }
  | { kind: "error"; message: string };

const TOO_BIG =
  "No pudimos dejar la imagen por debajo de 2 MB. Elige otra o redúcela antes de subirla.";
const UNREADABLE =
  "El navegador no pudo leer esta imagen. Usa JPEG, PNG, WebP o AVIF.";

function megabytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

/** Reduces an image to WebP within MAX_SIDE, trying lower qualities to fit. */
async function reduce(file: File): Promise<File | null> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  for (const quality of QUALITIES) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality),
    );
    if (blob && blob.type === "image/webp" && blob.size <= MAX_IMAGE_BYTES) {
      return new File([blob], webpName(file.name), { type: "image/webp" });
    }
  }
  return null;
}

/**
 * File input for the image bucket (E4-04). A file over 2 MB, or in a format
 * the bucket does not take, is reduced to WebP in the browser before the form
 * can be sent; if that fails, the field is marked invalid and nothing is
 * uploaded. The server validates again.
 */
export function ImageField({
  label,
  id,
  name = "file",
}: {
  label: string;
  id: string;
  name?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onChange() {
    const field = input.current!;
    const file = field.files?.[0];
    field.setCustomValidity("");
    if (!file) return setStatus({ kind: "idle" });

    // Blocks sending while the image is checked or reduced.
    field.setCustomValidity("Espera: estamos revisando la imagen.");
    setStatus({ kind: "working" });

    // A file named .png that is not an image would upload as a broken one.
    const readable = await createImageBitmap(file)
      .then((bitmap) => (bitmap.close(), true))
      .catch(() => false);
    if (!readable) {
      field.setCustomValidity(UNREADABLE);
      return setStatus({ kind: "error", message: UNREADABLE });
    }
    if (IMAGE_TYPES.includes(file.type) && file.size <= MAX_IMAGE_BYTES) {
      field.setCustomValidity("");
      return setStatus({ kind: "idle" });
    }

    const reduced = await reduce(file).catch(() => undefined);
    if (!reduced) {
      const message = reduced === null ? TOO_BIG : UNREADABLE;
      field.setCustomValidity(message);
      return setStatus({ kind: "error", message });
    }
    const files = new DataTransfer();
    files.items.add(reduced);
    field.files = files.files;
    field.setCustomValidity("");
    setStatus({
      kind: "ready",
      message: `La reducimos de ${megabytes(file.size)} a ${megabytes(reduced.size)} para subirla.`,
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      <input
        ref={input}
        id={id}
        name={name}
        type="file"
        accept="image/*"
        required
        onChange={onChange}
        aria-invalid={status.kind === "error" || undefined}
        aria-describedby={`${id}-hint ${id}-status`}
        className="min-h-12 w-full py-2 file:mr-4 file:min-h-10 file:cursor-pointer file:rounded-control file:border file:border-fg file:bg-bg file:px-4 file:text-fg"
      />
      <p id={`${id}-hint`} className="text-small">
        JPEG, PNG, WebP o AVIF. Si pesa más de 2 MB, la reducimos al subirla.
        Súbela ya recortada.
      </p>
      <p
        id={`${id}-status`}
        role={status.kind === "error" ? "alert" : "status"}
        className={
          status.kind === "error"
            ? "text-small font-medium text-accent"
            : "text-small"
        }
      >
        {status.kind === "working" && "Revisando la imagen…"}
        {(status.kind === "ready" || status.kind === "error") && status.message}
      </p>
    </div>
  );
}
