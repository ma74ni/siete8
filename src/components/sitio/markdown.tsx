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

/**
 * Markdown written in the panel (project texts, articles). Raw HTML is not
 * rendered: react-markdown escapes it, so a pasted script stays text.
 */
export function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col gap-4", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
