import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export type FaqItem = { question: string; answer: ReactNode };

/**
 * Frequently asked questions with native <details>: keyboard accessible and
 * readable without JavaScript. The chevron turns in 200 ms (DESIGN §8).
 */
export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="border-t border-border">
      {items.map((item) => (
        <details key={item.question} className="group border-b border-border">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-3 font-medium [&::-webkit-details-marker]:hidden">
            {item.question}
            <ChevronDown
              aria-hidden
              strokeWidth={1.5}
              className="size-5 shrink-0 transition-transform duration-200 ease-out group-open:rotate-180"
            />
          </summary>
          <div className="max-w-[68ch] pb-4">{item.answer}</div>
        </details>
      ))}
    </div>
  );
}
