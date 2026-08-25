"use client";

import { useState } from "react";

/**
 * Colorized code block. Highlighting happens on the SERVER at build time — pass
 * the resulting markup as `html`. Shiki must never be imported here: it used to
 * be pulled in dynamically inside an effect, which cost roughly 370ms of
 * blocking time on every page that rendered code.
 *
 * Without `html` the raw source still renders, unhighlighted but readable.
 *
 * Wraps long lines instead of scrolling on the x-axis, and optionally shows
 * line numbers / an expand-to-reveal control.
 */
export function CodeBlock({
  code,
  html = null,
  numbered = false,
  expandable = false,
}: {
  code: string;
  /** Server-rendered shiki markup. Omit to render plain source. */
  html?: string | null;
  lang?: string;
  numbered?: boolean;
  expandable?: boolean;
}) {
  const [expanded, setExpanded] = useState(!expandable);


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
