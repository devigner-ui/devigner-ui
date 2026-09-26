// Server only. Markdown versions of the docs for AI assistants and answer
// engines: /llms.txt (the map), /llms-full.txt (everything) and
// /llms/<slug>.md (one component). Built from the same registry as the pages,
// so the text an assistant reads is the text a visitor sees.

import { FAQS } from "@/components/landing/faq";
import { SITE_URL, getCatalog, type CatalogEntry } from "./catalog";
import { components } from "./registry";

export const REQUIREMENTS = "React 18 or 19, Tailwind CSS v4";

export const SUMMARY =
  "Free animated React components for Tailwind CSS. Each component installs as a plain .tsx file in your repo with one command, and ships with keyboard support, reduced motion and light/dark themes built in.";

export const markdownUrl = (slug: string) => `${SITE_URL}/llms/${slug}.md`;

const list = (items: readonly string[]) => items.map((i) => `- ${i}`).join("\n");

/** One component as a self-contained markdown document. */
export function componentMarkdown(entry: CatalogEntry, heading = "#"): string {
  const meta = components[entry.slug];
  const g = meta.guide;
  const h = (level: number) => heading + "#".repeat(level);
  const deps = meta.dependencies.filter((d) => d !== "react");
  return `${heading} ${meta.name}

> ${meta.description}

- Page: ${SITE_URL}/components/${meta.slug}
- Category: ${entry.categoryLabel}
- Requirements: ${REQUIREMENTS}
- Install: \`npx devignerui add ${meta.slug}\` (writes components/ui/${meta.slug}.tsx)
- Packages it needs: ${deps.join(", ")}

${h(1)} What the demo shows

${g.demo}

${h(1)} When to use it

${list(g.whenToUse)}

${h(1)} When to reach for something else

${list(g.whenNotToUse)}

${h(1)} Usage

\`\`\`tsx
import { ${meta.name.replaceAll(" ", "")} } from "@/components/ui/${meta.slug}";

${meta.usage}
\`\`\`
${meta.customUsage ? `\nCustom composition:\n\n\`\`\`tsx\n${meta.customUsage}\n\`\`\`\n` : ""}
${g.recipes.map((r) => `${h(2)} ${r.title}\n\n${r.description}\n\n\`\`\`tsx\n${r.code}\n\`\`\``).join("\n\n")}

${h(1)} Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
${meta.props.map((p) => `| ${p.name} | \`${p.type.replaceAll("|", "\\|")}\` | ${p.default} | ${p.description} |`).join("\n")}

${h(1)} Keyboard

| Keys | Action |
| --- | --- |
${g.keyboard.map(([k, a]) => `| ${k} | ${a} |`).join("\n")}

${h(1)} Accessibility

${list(g.accessibility)}

${h(1)} Theming

${list(g.theming)}

${h(1)} Edge cases

${list(g.edgeCases)}

${h(1)} Troubleshooting

${g.troubleshooting.map((t) => `**${t.question}**\n${t.answer}`).join("\n\n")}
`;
}

function header(entries: CatalogEntry[]) {
  return `# Devigner UI

> ${SUMMARY}

- Site: ${SITE_URL}
- Requirements: ${REQUIREMENTS}
- Set up once per project: \`npx devignerui init\`
- Add a component: \`npx devignerui add <name>\` (writes components/ui/<name>.tsx and lists the packages it needs)
- npm package: devignerui (React components, motion tokens and the CLI)
- License: MIT, free including commercial use
- Components: ${entries.length}`;
}

const faq = () => FAQS.map((f) => `### ${f.question}\n\n${f.answer}`).join("\n\n");

/** llms.txt (llmstxt.org): the map. */
export function llmsIndex(): string {
  const entries = getCatalog();
  return `${header(entries)}

## Components

${entries.map((e) => `- [${e.name}](${SITE_URL}/components/${e.slug}): ${e.description} Category: ${e.categoryLabel}. Install: \`npx devignerui add ${e.slug}\`. Full guide: ${markdownUrl(e.slug)}`).join("\n")}

## Docs

- [Full documentation in one file](${SITE_URL}/llms-full.txt): every component's usage, props, keyboard, accessibility, theming, edge cases and troubleshooting
- [All components](${SITE_URL}/components): every component running live, with search and filters
- [Home](${SITE_URL}): overview, pricing and FAQ

## FAQ

${faq()}
`;
}

/** llms-full.txt: the whole library in one document. */
export function llmsFull(): string {
  const entries = getCatalog();
  return `${header(entries)}

## FAQ

${faq()}

${entries.map((e) => componentMarkdown(e, "##")).join("\n---\n\n")}`;
}

export const textResponse = (body: string, type = "text/plain") =>
  new Response(body, { headers: { "Content-Type": `${type}; charset=utf-8` } });
