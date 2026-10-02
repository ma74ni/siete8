import { Check } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { cx } from "@/lib/cx";

// Headings in the body start at h2: the page already has its h1.
const components: Components = {
  h1: ({ children }) => <h2>{children}</h2>,
  h2: ({ children }) => <h2 className="mt-4 text-h3">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-2 text-h4">{children}</h3>,
  ul: ({ children }) => (
    <ul className="flex list-disc flex-col gap-2 pl-6">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="flex list-decimal flex-col gap-2 pl-6">{children}</ol>
  ),
  a: ({ href, children }) => {
    const external =
      href?.startsWith("http") && !href.startsWith("https://siete8.com");
    return (
      <a href={href} {...(external && { rel: "noopener noreferrer" })}>
        {children}
      </a>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="border-l-[3px] border-action pl-4">
      {children}
    </blockquote>
  ),
};

type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

/** Marks the items of bullet lists (not numbered ones) for the checklist. */
function rehypeChecklist() {
  const walk = (node: HastNode) => {
    for (const child of node.children ?? []) {
      if (node.tagName === "ul" && child.tagName === "li") {
        child.properties = { ...child.properties, dataCheck: "" };
      }
      walk(child);
    }
  };
  return (tree: HastNode) => walk(tree);
}

// Service pages (E6-02): "Qué incluye" reads as a checklist, two columns on
// wide screens. Numbered lists keep their numbers.
const checklist: Components = {
  ...components,
  ul: ({ children }) => (
    <ul className="grid gap-x-10 gap-y-3 md:grid-cols-2">{children}</ul>
  ),
  li: ({ children, node }) =>
    node?.properties && "dataCheck" in node.properties ? (
      <li className="flex gap-3">
        <Check
          aria-hidden
          strokeWidth={1.5}
          className="mt-0.5 size-6 shrink-0 text-action"
        />
        <span>{children}</span>
      </li>
    ) : (
      <li>{children}</li>
    ),
};

/**
 * Markdown written in the panel (project texts, articles, service pages).
 * Raw HTML is not rendered: react-markdown escapes it, so a pasted script
 * stays text.
 */
export function Markdown({
  children,
  variant = "prose",
  className,
}: {
  children: string;
  /** `checklist`: bullet lists get a check mark (service pages). */
  variant?: "prose" | "checklist";
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col gap-4", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={variant === "checklist" ? [rehypeChecklist] : []}
        components={variant === "checklist" ? checklist : components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
