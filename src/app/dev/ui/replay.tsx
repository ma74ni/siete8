"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/sitio/button";

/** Remounts its children to replay CSS load animations. Showcase only. */
export function Replay({ children }: { children: ReactNode }) {
  const [run, setRun] = useState(0);
  return (
    <div className="flex flex-col items-start gap-6">
      <Button variant="secondary" onClick={() => setRun((n) => n + 1)}>
        Repetir animación
      </Button>
      <div key={run} className="w-full">
        {children}
      </div>
    </div>
  );
}
