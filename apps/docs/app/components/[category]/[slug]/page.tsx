import { notFound } from "next/navigation";
import { highlight } from "@/lib/highlight";
import { components } from "@/lib/registry";
import { DetailView } from "./detail-view";

/** Every component detail page is known at build time, so all of them prerender. */
export function generateStaticParams() {
  return Object.values(components)
    .filter((c) => c.kind === "component")
    .map((c) => ({ category: c.category, slug: c.slug }));
}

export default async function ComponentDetailPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const meta = components[slug];
  // Guard the pairing too: /components/cards/button must not resolve.
  if (!meta || meta.kind !== "component" || meta.category !== category) {
    notFound();
  }
  const [codeHtml, usageHtml] = await Promise.all([
    highlight(meta.code, "tsx"),
    highlight(meta.usage, "tsx"),
  ]);

  return <DetailView slug={slug} codeHtml={codeHtml} usageHtml={usageHtml} />;
}
