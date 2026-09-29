import type { Metadata } from "next";
import { SITE_URL, getCatalog } from "@/lib/catalog";
import { components } from "@/lib/registry";
import { REQUIREMENTS, markdownUrl } from "@/lib/llms";
import { JsonLd } from "../../../components/json-ld";

export function generateStaticParams() {
  return getCatalog().map((e) => ({ slug: e.slug }));
}

const find = (slug: string) => getCatalog().find((e) => e.slug === slug);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const entry = find((await params).slug);
  if (!entry) return { title: "Component not found" };

  // The longest form that fits: titles in 60 characters, descriptions in 155.
  const fit = (max: number, ...options: string[]) =>
    options.find((o) => o.length <= max) ?? options[options.length - 1];
  const title = fit(
    60,
    `${entry.name}: Animated React Component · Devigner UI`,
    `${entry.name}: Animated React Component`,
  );
  const description = fit(
    155,
    `${entry.description} Free for React and Tailwind CSS, installed with one command.`,
    `${entry.description} Free for React and Tailwind CSS.`,
    entry.description,
  );
  const url = `/components/${entry.slug}`;

  return {
    title: { absolute: title },
    description,
    // The markdown twin, for assistants that prefer plain text to the page.
    alternates: { canonical: url, types: { "text/markdown": markdownUrl(entry.slug) } },
    openGraph: { title, description, url },
  };
}

export default async function ComponentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const entry = find((await params).slug);
  const guide = entry && components[entry.slug].guide;
  return (
    <>
      {entry && guide && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Devigner UI", item: SITE_URL },
                  { "@type": "ListItem", position: 2, name: "Components", item: `${SITE_URL}/components` },
                  { "@type": "ListItem", position: 3, name: entry.name, item: `${SITE_URL}/components/${entry.slug}` },
                ],
              },
              // What the page is about, stated plainly for search and AI answers.
              {
                "@type": "SoftwareSourceCode",
                name: `${entry.name} React component`,
                description: entry.description,
                url: `${SITE_URL}/components/${entry.slug}`,
                image: `${SITE_URL}/components/${entry.slug}/opengraph-image`,
                programmingLanguage: ["TypeScript", "React"],
                runtimePlatform: REQUIREMENTS,
                softwareRequirements: REQUIREMENTS,
                codeSampleType: "full solution",
                keywords: [entry.categoryLabel, "animated React component", "Tailwind CSS", "accessible", "TypeScript"].join(", "),
                license: "https://opensource.org/licenses/MIT",
                encoding: { "@type": "MediaObject", encodingFormat: "text/markdown", contentUrl: markdownUrl(entry.slug) },
                dateCreated: entry.addedAt,
                isAccessibleForFree: true,
                author: { "@id": `${SITE_URL}/#organization` },
                isPartOf: { "@id": `${SITE_URL}/#website` },
              },
              // The Troubleshooting answers shown in the page's Guide tab.
              {
                "@type": "FAQPage",
                mainEntity: guide.troubleshooting.map((t) => ({
                  "@type": "Question",
                  name: t.question,
                  acceptedAnswer: { "@type": "Answer", text: t.answer },
                })),
              },
            ],
          }}
        />
      )}
      {children}
    </>
  );
}
