"use client";

import { useEffect, useState } from "react";
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

/**
 * Highlighted HTML by source. A whole component file takes a long, blocking
 * moment to highlight; done on mount, it stalls whatever opens the block (the
 * code drawer's slide), so it is done once, ahead of time where possible.
 */
const cache = new Map<string, string>();

function highlight(h: HighlighterCore, code: string) {
  let html = cache.get(code);
  if (html === undefined) {
    html = h
      .codeToHtml(code, {
        lang: "tsx",
        themes: { light: "github-light", dark: "github-dark" },
        defaultColor: "light",
      })
      // shiki joins line spans with a literal "\n"; with white-space: pre-wrap
      // that renders as an extra blank row, so strip it (line breaks come
      // from .line being display: block instead).
      .replace(/\n(?=<span class="line)/g, "");
    cache.set(code, html);
  }
  return html;
}

/** Runs `fn` when the main thread is idle, so it never lands mid-animation. */
export function whenIdle(fn: () => void) {
  if (typeof requestIdleCallback === "function") {
    const id = requestIdleCallback(fn, { timeout: 1500 });
    return () => cancelIdleCallback(id);
  }
  const id = setTimeout(fn, 200);
  return () => clearTimeout(id);
}

/** Highlights `code` in the background so a CodeBlock showing it later opens
 *  with its colors already there. Returns a cancel. */
export function prewarmCode(code: string) {
  if (cache.has(code)) return () => {};
  let cancel = () => {};
  let alive = true;
  loadHighlighter()
    .then((h) => {
      if (alive) cancel = whenIdle(() => highlight(h, code));
    })
    .catch(() => {});
  return () => {
    alive = false;
    cancel();
  };
}

/**
 * Colorized tsx. Until the colors are ready it prints the same text in the
 * same box, so nothing shifts when they land, and a block not highlighted
 * ahead of time is colored once the thread is idle rather than during the
 * frame it mounts in. It wraps long lines instead of scrolling on the x-axis
 * and grows to its content - scrolling and any height cap belong to whatever
 * container it sits in.
 */
export function CodeBlock({ code }: { code: string }) {
  const [html, setHtml] = useState(() => cache.get(code));

  useEffect(() => {
    const cached = cache.get(code);
    setHtml(cached);
    if (cached !== undefined) return;
    let alive = true;
    let cancel = () => {};
    loadHighlighter()
      .then((h) => {
        if (!alive) return;
        cancel = whenIdle(() => {
          if (alive) setHtml(highlight(h, code));
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
      cancel();
    };
  }, [code]);

  return html ? (
    <div className="code-shiki" dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <div className="code-shiki">
      <pre className="text-text-secondary">{code}</pre>
    </div>
  );
}
