import { getCatalog } from "@/lib/catalog";
import { componentMarkdown, textResponse } from "@/lib/llms";

// /llms/<slug>.md: one component's page as markdown. Linked from llms.txt and
// from each component page's <link rel="alternate" type="text/markdown">.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getCatalog().map((e) => ({ file: `${e.slug}.md` }));
}

export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const entry = getCatalog().find((e) => `${e.slug}.md` === file);
  if (!entry) return new Response("Not found", { status: 404 });
  return textResponse(componentMarkdown(entry), "text/markdown");
}
