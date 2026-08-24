import { getCategories } from "@/lib/registry";
import { PREVIEWS } from "@/components/gallery/preview-map";

/**
 * The rail is the product argument: one category at a time, every design it
 * ships laid out together so the visitor compares rather than reads.
 *
 * Server component by design. Switching is CSS only — a radio group whose
 * checked input drives sibling panels — so the whole section costs no client
 * JavaScript and keeps working with scripting disabled. Tailwind cannot express
 * `peer-checked/<slug>` for slugs only known at build time, so the per-category
 * rules are emitted as one scoped <style> block instead.
 */

function Preview({ slug, name }: { slug: string; name: string }) {
  const preview = PREVIEWS[slug];
  return (
    <figure className="flex flex-col gap-2.5">
      <div className="flex min-h-44 items-center justify-center rounded-2xl border border-border bg-background-200 p-6">
        {preview ?? <span className="text-[13px] text-text-muted">{name}</span>}
      </div>
      <figcaption className="px-0.5 text-[13px] font-medium text-text-secondary">
        {name}
      </figcaption>
    </figure>
  );
}

export function CategoryRail() {
  const groups = [
    { kind: "component" as const, label: "Components" },
    { kind: "block" as const, label: "Blocks" },
  ];

  const categories = groups.flatMap((group) =>
    getCategories(group.kind).map((category) => ({
      ...category,
      groupLabel: group.label,
    })),
  );

  if (categories.length === 0) return null;

  // One rule per category: reveal its panel, mark its tab. Emitted rather than
  // authored because the slugs come from the registry.
  const css = categories
    .map(
      (
        c,
      ) => `#rail-${c.slug}:checked ~ .rail-panels [data-panel="${c.slug}"]{display:grid}
#rail-${c.slug}:checked ~ .rail-tabs [data-tab="${c.slug}"]{background:var(--foreground);color:var(--background);border-color:var(--foreground)}`,
    )
    .join("\n");

  return (
    <div className="rail">
      {categories.map((category, i) => (
        <input
          key={category.slug}
          type="radio"
          name="rail"
          id={`rail-${category.slug}`}
          defaultChecked={i === 0}
          className="sr-only"
        />
      ))}

      <div className="rail-tabs mb-8 flex flex-wrap gap-2">
        {categories.map((category) => (
          <label
            key={category.slug}
            htmlFor={`rail-${category.slug}`}
            data-tab={category.slug}
            className="cursor-pointer rounded-pill border border-border px-4 py-1.5 text-[13px] font-medium text-text-secondary transition-colors duration-200 ease-out hover:border-border-hover hover:text-foreground"
          >
            {category.name}
            <span className="ml-2 text-[11px] opacity-80">{category.groupLabel}</span>
          </label>
        ))}
      </div>

      <div className="rail-panels">
        {categories.map((category) => (
          <div
            key={category.slug}
            data-panel={category.slug}
            className="hidden gap-5 sm:grid-cols-2"
          >
            <p className="text-base/relaxed text-text-secondary sm:col-span-2">
              {category.description}
            </p>
            {category.components.map((component) => (
              <Preview
                key={component.slug}
                slug={component.slug}
                name={component.name}
              />
            ))}
          </div>
        ))}
      </div>

      <style>{css}</style>
    </div>
  );
}
