import { codeToHtml } from "shiki";

/**
 * Server-side syntax highlighting.
 *
 * Every gallery route is statically generated, and the code it renders comes
 * from the registry, so highlighting is fully knowable at build time. Doing it
 * here means shiki never reaches the browser — it was previously imported
 * dynamically inside a client effect, which cost ~370ms of blocking time on
 * every detail page.
 *
 * Results are memoised per (code, lang) because a detail page highlights the
 * same source more than once — the preview drawer and the code tab share it.
 */
const cache = new Map<string, string>();

export async function highlight(code: string, lang: string): Promise<string> {
  const key = `${lang}::${code}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const html = (
    await codeToHtml(code, {
      lang,
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: "light",
    })
  )
    // shiki joins line spans with a literal "\n"; with white-space: pre-wrap
    // that renders as an extra blank row, so strip it — line breaks come from
    // .line being display: block instead.
    .replace(/\n(?=<span class="line)/g, "");

  cache.set(key, html);
  return html;
}
