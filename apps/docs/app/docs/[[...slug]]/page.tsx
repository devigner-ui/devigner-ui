import { notFound } from "next/navigation";
import {
  DocsPage,
  DocsBody,
  DocsDescription,
  DocsTitle,
} from "fumadocs-ui/page";
import type { DocData } from "fumadocs-mdx/runtime/types";
import { source } from "@/lib/source";
import { getMDXComponents } from "@/mdx-components";

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  // `getPage()`'s generic inference doesn't carry the compiled-MDX fields
  // (body/toc) through fumadocs-mdx 14.x's collection types — they exist at
  // runtime (confirmed), just not surfaced on the inferred PageData type.
  const data = page.data as typeof page.data & DocData;
  const MDXContent = data.body;

  return (
    <DocsPage toc={data.toc}>
      <DocsTitle>{page.data.title}</DocsTitle>
      {page.data.description && (
        <DocsDescription>{page.data.description}</DocsDescription>
      )}
      <DocsBody>
        <MDXContent components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
