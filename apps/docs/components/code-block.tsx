"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Colorized code block. Highlights with shiki, dynamically imported and only
 * once the block is on screen: a hidden docs tab or a closed code panel never
 * pulls in shiki's ~600 KB engine. It wraps long lines instead of scrolling
 * on the x-axis. It grows to its content - scrolling and any height cap belong
 * to whatever container it sits in.
 */
export function CodeBlock({ code, lang = "tsx" }: { code: string; lang?: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [seen, setSeen] = useState(false);
  const box = useRef<HTMLPreElement>(null);

  // display: none never intersects, so hidden tabs wait until they open.
  useEffect(() => {
    const el = box.current;
    if (seen || !el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);

  useEffect(() => {
    if (!seen) return;
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
  }, [code, lang, seen]);

  return html ? (
    <div className="code-shiki" dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <pre ref={box} className="m-0 whitespace-pre-wrap wrap-break-word p-4 font-mono text-xs leading-none text-text-secondary">
      {code}
    </pre>
  );
}
