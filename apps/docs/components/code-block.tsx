"use client";

import { useEffect, useMemo, useState } from "react";
import type { HighlighterCore } from "shiki/core";

/**
 * One highlighter for the whole page, built from shiki's fine-grained core:
 * the tsx grammar, two themes and the JavaScript regex engine. No WASM to
 * fetch and no full language bundle to compile, so it is ready in a moment.
 * A failed load clears the promise, so the next block retries instead of
 * staying plain for the rest of the session.
 */
let loading: Promise<HighlighterCore> | null = null;
function loadHighlighter() {
  loading ??= Promise.all([
    import("shiki/core"),
    import("shiki/engine/javascript"),
    import("shiki/langs/tsx.mjs"),
    import("shiki/themes/github-light.mjs"),
    import("shiki/themes/github-dark.mjs"),
  ])
    .then(([{ createHighlighterCore }, { createJavaScriptRegexEngine }, tsx, light, dark]) =>
      createHighlighterCore({
        engine: createJavaScriptRegexEngine(),
        langs: [tsx.default],
        themes: [light.default, dark.default],
      }),
    )
    .catch((error) => {
      loading = null;
      throw error;
    });
  return loading;
}

let ready: HighlighterCore | null = null;

/**
 * Colorized tsx. Highlighting is synchronous once the shared highlighter is
 * loaded, so a new `code` never shows the previous block's colors. Until then
 * it prints the same text in the same box, so nothing shifts when the colors
 * land. It wraps long lines instead of scrolling on the x-axis and grows to its
 * content - scrolling and any height cap belong to whatever container it sits in.
 */
export function CodeBlock({ code }: { code: string }) {
  const [highlighter, setHighlighter] = useState(ready);

  useEffect(() => {
    if (highlighter) return;
    let alive = true;
    loadHighlighter()
      .then((h) => {
        ready = h;
        if (alive) setHighlighter(h);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [highlighter]);

  const html = useMemo(
    () =>
      highlighter
        ?.codeToHtml(code, {
          lang: "tsx",
          themes: { light: "github-light", dark: "github-dark" },
          defaultColor: "light",
        })
        // shiki joins line spans with a literal "\n"; with white-space: pre-wrap
        // that renders as an extra blank row, so strip it (line breaks come
        // from .line being display: block instead).
        .replace(/\n(?=<span class="line)/g, ""),
    [highlighter, code],
  );

  return html ? (
    <div className="code-shiki" dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <div className="code-shiki">
      <pre className="text-text-secondary">{code}</pre>
    </div>
  );
}
