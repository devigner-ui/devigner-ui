import type { Metadata } from "next";
import { SITE_URL, getCatalog } from "@/lib/catalog";
import { JsonLd } from "../../components/json-ld";
import { CatalogOverview } from "../../components/catalog/catalog-grid";

const TITLE = "Animated React Components for Tailwind CSS";

export function generateMetadata(): Metadata {
  const count = getCatalog().length;
  const description = `All ${count} Devigner UI components, running live: free, animated React components for Tailwind CSS. Try one, then install it with one command.`;
  return {
    title: TITLE,
    description,
    alternates: { canonical: "/components" },
    openGraph: { title: "Animated React Components · Devigner UI", description, url: "/components" },
  };
}

export default function ComponentsPage() {
  const entries = getCatalog();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "CollectionPage",
              name: TITLE,
              url: `${SITE_URL}/components`,
              mainEntity: {
                "@type": "ItemList",
                itemListElement: entries.map((e, i) => ({
                  "@type": "ListItem",
                  position: i + 1,
                  name: e.name,
                  url: `${SITE_URL}/components/${e.slug}`,
                })),
              },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Devigner UI", item: SITE_URL },
                { "@type": "ListItem", position: 2, name: "Components", item: `${SITE_URL}/components` },
              ],
            },
          ],
        }}
      />
      <CatalogOverview entries={entries} />
    </>
  );
}
