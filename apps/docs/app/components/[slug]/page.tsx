import { getCatalog } from "@/lib/catalog";
import { components } from "@/lib/registry";
import { ComponentNotFound, ComponentPage } from "../../../components/detail/component-page";

// Server side, so the client gets this component's data and the catalog's
// metadata - never every other component's source.
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = components[slug];
  if (!meta) return <ComponentNotFound slug={slug} />;
  return <ComponentPage key={slug} meta={meta} entries={getCatalog()} />;
}
