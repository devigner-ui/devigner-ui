import { notFound } from "next/navigation";
import { components } from "@/lib/registry";
import { DetailView } from "../../../components/[category]/[slug]/detail-view";

/** Blocks reuse the component detail view — same data shape, same affordances. */
export function generateStaticParams() {
  return Object.values(components)
    .filter((c) => c.kind === "block")
    .map((c) => ({ category: c.category, slug: c.slug }));
}

export default async function BlockDetailPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const meta = components[slug];
  if (!meta || meta.kind !== "block" || meta.category !== category) {
    notFound();
  }
  return <DetailView slug={slug} />;
}
