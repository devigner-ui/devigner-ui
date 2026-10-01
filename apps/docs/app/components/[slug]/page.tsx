import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/catalog";
import { components } from "@/lib/registry";
import { getRequestFor } from "@/lib/requests";
import { ComponentPage } from "../../../components/detail/component-page";

// Server side, so the client gets this component's data and the catalog's
// metadata - never every other component's source.
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = components[slug];
  if (!meta) notFound();
  // Only components built from a community request make this call.
  const post = await getRequestFor(meta.requestId);
  const request = post && { url: post.url, requester: post.requester };
  return <ComponentPage key={slug} meta={meta} entries={getCatalog()} request={request} />;
}
