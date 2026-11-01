"use client";

import { useEffect, useState } from "react";

import { NOTICE_PARAM, noticeText } from "@/lib/notices";

/**
 * What the form that brought the person here did ("Servicio agregado."), at
 * the top of the page (E14-02). Takes the raw `?aviso=` value: only known
 * keys show, never words from the address. Once shown, the notice leaves the
 * address, so reloading or sharing the page does not show it again.
 */
export function Notice({ value }: { value: unknown }) {
  const message = noticeText(value);
  // A live region already holding its text when the page arrives is rarely
  // read aloud: screen readers hear it when the text goes in after mounting.
  const [announced, setAnnounced] = useState("");

  // On every render: another form may bring a new notice to the same page.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(NOTICE_PARAM)) return;
    url.searchParams.delete(NOTICE_PARAM);
    // `null` lets Next keep its router in step with the address.
    window.history.replaceState(null, "", url);
  });
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnnounced(message ?? "");
  }, [message]);

  return (
    <>
      <p role="status" className="sr-only">
        {announced}
      </p>
      {message && (
        <p
          aria-hidden
          className="rounded-control border-l-4 border-accent bg-surface px-4 py-3 font-medium"
        >
          {message}
        </p>
      )}
    </>
  );
}
