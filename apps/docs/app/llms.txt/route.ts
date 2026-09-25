import { SITE_URL, getCatalog } from "@/lib/catalog";
import { FAQS } from "@/components/landing/faq";

// llms.txt (llmstxt.org): a plain-markdown map of the site for AI assistants
// and answer engines. Built once per deploy from the same catalog as the pages.
export const dynamic = "force-static";

export function GET() {
  const entries = getCatalog();
  const body = `# Devigner UI

> Free animated React components for Tailwind CSS. Each component installs as a plain .tsx file in your repo with one command, and ships with keyboard support, reduced motion and light/dark themes built in.

- Site: ${SITE_URL}
- Requirements: React 18 or newer, Tailwind CSS v4
- Set up once per project: \`npx devignerui init\`
- Add a component: \`npx devignerui add <name>\` (writes components/ui/<name>.tsx and lists the packages it needs)
- npm package: devignerui (React components, motion tokens and the CLI)

## Components

${entries.map((e) => `- [${e.name}](${SITE_URL}/components/${e.slug}): ${e.description} Category: ${e.categoryLabel}. Install: \`npx devignerui add ${e.slug}\``).join("\n")}

## Pages

- [All components](${SITE_URL}/components): every component running live, with search and filters
- [Home](${SITE_URL}): overview, pricing and FAQ

## FAQ

${FAQS.map((f) => `### ${f.question}\n\n${f.answer}`).join("\n\n")}
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
