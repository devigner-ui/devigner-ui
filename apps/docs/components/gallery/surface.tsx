import Link from "next/link";
import { ArrowRight } from "reicon-react/icons/ArrowRight";
import { notFound } from "next/navigation";
import { getCategories } from "@/lib/registry";
import { PREVIEWS } from "./preview-map";

/**
 * Shared rendering for both gallery surfaces. Components and Blocks differ only
 * in which kind they read and where they link, so the layout lives once here.
 *
 * Server components throughout. Prints no counts and makes no breadth claim —
 * a category holds two designs at launch, and the argument is that each one is
 * finished. See spec §2.1.
 */

type Kind = "component" | "block";

const COPY: Record<Kind, { title: string; blurb: string; base: string }> = {
  component: {
    title: "Components",
    blurb:
      "The primitives you reach for on every screen. Each one arrives finished — states, variants and motion included.",
    base: "/components",
  },
  block: {
    title: "Blocks",
    blurb:
      "Whole sections, composed and ready to drop in. Install one and edit it like code you wrote.",
    base: "/blocks",
  },
};

function Tile({
  slug,
  name,
  href,
}: {
  slug: string;
  name: string;
  href: string;
}) {
  return (
    <li>
      <Link href={href} className="group flex flex-col gap-2.5">
        <div className="flex min-h-52 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background-200 p-6 transition-[border-color,background-color,box-shadow] duration-300 ease-out group-hover:border-border-hover group-hover:bg-background-100 group-hover:shadow-elevated">
          {PREVIEWS[slug] ?? (
            <span className="text-[13px] text-text-muted">{name}</span>
          )}
        </div>
        <span className="flex items-center justify-between px-0.5">
          <span className="text-[13px] font-medium text-text-secondary transition-colors duration-200 group-hover:text-foreground">
            {name}
          </span>
          <ArrowRight
            aria-hidden="true"
            className="size-4 -translate-x-1 text-accent opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
          />
        </span>
      </Link>
    </li>
  );
}

/** Surface index: every category on this surface, with its designs. */
export function GalleryIndex({ kind }: { kind: Kind }) {
  const copy = COPY[kind];
  const categories = getCategories(kind);

  return (
    <main className="min-h-screen bg-background">
      <div className="grain-overlay" />

      <section className="relative pt-32 pb-12 sm:pt-40 sm:pb-16">
        <div className="absolute inset-0 mesh-gradient" />
        <div className="relative mx-auto max-w-7xl px-5">
          <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] tracking-[-0.03em] text-foreground">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-lg text-base/relaxed text-text-secondary sm:text-lg">
            {copy.blurb}
          </p>
        </div>
      </section>

      <div className="section-editorial mx-auto max-w-7xl px-5 py-12 sm:py-16">
        {categories.map((category) => (
          <section key={category.slug} className="mb-16 last:mb-0">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <h2 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
                <Link
                  href={`${copy.base}/${category.slug}`}
                  className="transition-colors duration-200 hover:text-accent"
                >
                  {category.name}
                </Link>
              </h2>
              <p className="max-w-md text-[13px] leading-relaxed text-text-secondary">
                {category.description}
              </p>
            </div>

            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {category.components.map((component) => (
                <Tile
                  key={component.slug}
                  slug={component.slug}
                  name={component.name}
                  href={`${copy.base}/${category.slug}/${component.slug}`}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}

/** One category on one surface. */
export function CategoryPage({
  kind,
  categorySlug,
}: {
  kind: Kind;
  categorySlug: string;
}) {
  const copy = COPY[kind];
  const category = getCategories(kind).find((c) => c.slug === categorySlug);
  if (!category) notFound();

  return (
    <main className="min-h-screen bg-background">
      <div className="grain-overlay" />

      <section className="relative pt-32 pb-12 sm:pt-40 sm:pb-16">
        <div className="absolute inset-0 mesh-gradient" />
        <div className="relative mx-auto max-w-7xl px-5">
          <nav aria-label="Breadcrumb">
            <Link
              href={copy.base}
              className="text-[13px] text-text-secondary transition-colors duration-200 hover:text-foreground"
            >
              &larr; {copy.title}
            </Link>
          </nav>
          <h1 className="mt-4 font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] tracking-[-0.03em] text-foreground">
            {category.name}
          </h1>
          <p className="mt-4 max-w-lg text-base/relaxed text-text-secondary sm:text-lg">
            {category.description}
          </p>
        </div>
      </section>

      <div className="section-editorial mx-auto max-w-7xl px-5 py-12 sm:py-16">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {category.components.map((component) => (
            <Tile
              key={component.slug}
              slug={component.slug}
              name={component.name}
              href={`${copy.base}/${category.slug}/${component.slug}`}
            />
          ))}
        </ul>
      </div>
    </main>
  );
}
