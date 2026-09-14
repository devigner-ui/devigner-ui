"use client";

import { useEffect, useState } from "react";

/**
 * Colorized code block. Highlights with shiki (dynamically imported so it only
 * loads on pages that render code) and wraps long lines instead of scrolling
 * on the x-axis. It grows to its content - scrolling and any height cap belong
 * to whatever container it sits in.
 */
export function CodeBlock({ code, lang = "tsx" }: { code: string; lang?: string }) {
  const [html, setHtml] = useState<string | null>(null);

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

  return html ? (
    <div className="code-shiki" dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <pre className="m-0 whitespace-pre-wrap wrap-break-word p-4 font-mono text-xs leading-none text-text-secondary">
      {code}
    </pre>
  );
}
