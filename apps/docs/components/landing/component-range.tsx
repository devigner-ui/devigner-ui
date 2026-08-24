import Link from "next/link";
import { getCategories } from "@/lib/registry";

/**
 * The catalog: both surfaces, their real categories, and what each one holds.
 * Reads the registry rather than hard-coding a range, so it stays true as
 * designs land.
 *
 * Server component — no scroll choreography, no client JS.
 *
 * Deliberately prints no counts and makes no breadth claim. At launch a
 * category holds two designs; the argument is that each is finished, not that
 * there are many.
 *
 * Every category links to /components until Phase 3 adds the per-category and
 * /blocks routes. Pointing at routes that do not exist yet would only ship 404s.
 */

const GROUPS = [
  {
    kind: "component" as const,
    label: "Components",
    blurb: "The primitives you reach for on every screen.",
  },
  {
    kind: "block" as const,
    label: "Blocks",
    blurb: "Whole sections, composed and ready to drop in.",
  },
];

export function ComponentRange() {
  return (
    <section className="section-editorial">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:py-24">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-text-muted">
          The catalog
        </h2>

        <div className="mt-12 flex flex-col gap-14">
          {GROUPS.map((group) => {
            const categories = getCategories(group.kind);
            if (categories.length === 0) return null;

            return (
              <div key={group.kind}>
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <h3 className="font-display text-2xl tracking-[-0.01em] text-foreground">
                    {group.label}
                  </h3>
                  <p className="text-[14px] text-text-secondary">
                    {group.blurb}
                  </p>
                </div>

                <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {categories.map((category) => (
                    <li key={category.slug}>
                      <Link
                        href="/components"
                        className="group flex h-full flex-col rounded-2xl border border-border bg-background-200 p-6 transition-[border-color,background-color] duration-300 ease-out hover:border-border-hover hover:bg-background-100"
                      >
                        <span className="text-[15px] font-medium text-foreground">
                          {category.name}
                        </span>
                        <span className="mt-2 text-[13px] leading-relaxed text-text-secondary">
                          {category.description}
                        </span>
                        <span className="mt-4 flex flex-wrap gap-1.5">
                          {category.components.map((component) => (
                            <span
                              key={component.slug}
                              className="rounded-pill border border-border px-2.5 py-0.5 text-[11px] text-text-muted"
                            >
                              {component.name}
                            </span>
                          ))}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
