"use client";

import { useEffect, useState } from "react";

/**
 * Colorized code block. Highlights with shiki (dynamically imported so it only
 * loads on pages that render code), wraps long lines instead of scrolling on
 * the x-axis, and optionally shows line numbers / an expand-to-reveal control.
 */
export function CodeBlock({
  code,
  lang = "tsx",
  numbered = false,
  expandable = false,
}: {
  code: string;
  lang?: string;
  numbered?: boolean;
  expandable?: boolean;
}) {
  const [html, setHtml] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!expandable);

  useEffect(() => {
    let alive = true;
    import("shiki")
      .then(({ codeToHtml }) =>
        codeToHtml(code, {
          lang,
          themes: { light: "github-light", dark: "github-dark" },
          defaultColor: "light",
        }),
      )
      // shiki joins line spans with a literal "\n"; with white-space: pre-wrap
      // that renders as an extra blank row, so strip it (line breaks come
      // from .line being display: block instead).
      .then((h) => h.replace(/\n(?=<span class="line)/g, ""))
      .then((h) => alive && setHtml(h))
      .catch(() => alive && setHtml(null));
    return () => {
      alive = false;
    };
  }, [code, lang]);

  return (
    <div className="relative">
      <div
        className={`code-shiki code-scroll ${numbered ? "numbered" : ""} ${
          expanded ? "max-h-130 overflow-y-auto" : "max-h-72 overflow-hidden"
        }`}
      >
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <pre className="m-0 whitespace-pre-wrap wrap-break-word p-4 font-mono text-xs leading-none text-text-secondary">
            {code}
          </pre>
        )}
      </div>
      {expandable && !expanded && (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-(--code-bg) to-transparent" />
          <button
            onClick={() => setExpanded(true)}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg border border-border bg-background px-4 py-1.5 text-xs font-medium text-foreground shadow-subtle transition-colors hover:bg-surface"
          >
            Expand
          </button>
        </>
      )}
    </div>
  );
}
