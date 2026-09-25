import type { Metadata } from "next";
import Link from "next/link";
import { IconArrowRight } from "@devigner-ui/icons";
import { SITE_URL, getCatalog } from "@/lib/catalog";
import { JsonLd } from "../../components/json-ld";
import { Navbar } from "../../components/landing/navbar";
import { SiteFooter } from "../../components/landing/closing";
import { CopyCommand } from "../../components/landing/copy-command";
import { CatalogGrid } from "../../components/catalog/catalog-grid";

const TITLE = "React Components for Tailwind CSS";
const INTRO =
  "Free animated React components for Tailwind CSS. Every card below is running, so try it right here, then copy the command that installs it.";

export function generateMetadata(): Metadata {
  const count = getCatalog().length;
  const description = `Every Devigner UI component, running live: ${count} free, animated React components for Tailwind CSS. Try one, then install it with a single command.`;
  return {
    title: TITLE,
    description,
    alternates: { canonical: "/components" },
    openGraph: { title: `${TITLE} · Devigner UI`, description, url: "/components" },
  };
}

export default function ComponentsPage() {
  const entries = getCatalog();

  return (
    <div className="min-h-dvh bg-background">
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
      <Navbar autoHide />
      <main>
        <section className="relative overflow-hidden pt-32 pb-12 sm:pt-40">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-120 bg-[radial-gradient(50%_60%_at_20%_0%,var(--glow),transparent_70%)]"
          />
          <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-end gap-10 px-5 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <p className="inline-flex h-7.5 items-center gap-2.5 rounded-full border border-border px-3 text-[12.5px] text-text-secondary">
                <span className="font-medium text-foreground">{entries.length} components</span>
                <span aria-hidden className="h-3 w-px bg-border-hover" />
                Newest: {entries[0].name}
              </p>
              <h1 className="mt-6 max-w-3xl text-[clamp(2.5rem,5vw,3.75rem)] leading-[1.04] font-semibold tracking-[-0.055em] text-balance text-foreground">
                React <span className="accent-word">Components</span> for Tailwind CSS
              </h1>
              <p className="mt-5 max-w-xl text-[17px]/7 text-pretty text-text-secondary">{INTRO}</p>
            </div>
            <div className="w-full max-w-sm lg:pb-2">
              <CopyCommand command="npx devignerui init" highlight="init" className="w-full" />
              <p className="mt-3 px-1 text-[13px] text-text-muted">
                Once per project, then add any of these by name
              </p>
            </div>
          </div>
        </section>

        <section aria-label="All components" className="pb-20">
          <div className="mx-auto max-w-7xl px-5">
            <CatalogGrid entries={entries} />

            <p className="mt-14 flex flex-col gap-3 border-t border-border pt-8 text-[15px] text-text-secondary sm:flex-row sm:items-center sm:justify-between">
              Pro components are on the way, as a separate paid set. Everything here stays free.
              <Link
                href="/#pricing"
                className="group inline-flex min-h-11 shrink-0 items-center gap-1.5 font-medium whitespace-nowrap text-foreground"
              >
                See what Pro will cost
                <IconArrowRight
                  aria-hidden
                  className="size-4 text-brand transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                />
              </Link>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
