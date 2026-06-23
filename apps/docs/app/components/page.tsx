import Link from "next/link";
import { ThemeToggle } from "../../components/theme-provider";

const components = [
  {
    name: "Button",
    slug: "button",
    category: "Primitives",
    styles: 3,
    variants: 6,
    description: "Flexible button with multiple design styles and variants",
    styleNames: ["Default", "Gradient", "Magnetic"],
  },
  {
    name: "Card",
    slug: "card",
    category: "Primitives",
    styles: 3,
    variants: 3,
    description: "Compound card with multiple design styles",
    styleNames: ["Default", "Glass", "Spotlight"],
  },
  {
    name: "Input",
    slug: "input",
    category: "Forms",
    styles: 3,
    variants: 4,
    description: "Form input with multiple design styles",
    styleNames: ["Default", "Floating", "Underline"],
  },
  {
    name: "Badge",
    slug: "badge",
    category: "Primitives",
    styles: 3,
    variants: 6,
    description: "Small label with multiple design styles",
    styleNames: ["Default", "Pill", "Dot"],
  },
  {
    name: "Hero Section",
    slug: "hero-section",
    category: "Marketing",
    styles: 3,
    variants: 3,
    description: "Animated hero with multiple design styles",
    styleNames: ["Default", "Gradient", "Parallax"],
  },
];

const categories = ["All", "Primitives", "Forms", "Marketing"];

export default function ComponentsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-[50px] max-w-6xl items-center justify-between px-[16px]">
          <Link href="/" className="text-[24px] font-semibold leading-[32px] tracking-[-0.96px] text-foreground">
            Devigner UI
          </Link>
          <div className="flex items-center gap-[24px]">
            <Link
              href="/"
              className="text-[14px] font-medium leading-[20px] text-text-secondary hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link
              href="/pricing"
              className="text-[14px] font-medium leading-[20px] text-text-secondary hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-[16px] py-[48px]">
        <h1 className="text-[32px] font-semibold leading-[48px] tracking-[-1.28px] text-foreground">Components</h1>
        <p className="mt-[8px] text-[16px] leading-[24px] text-text-secondary">
          Browse all available components. Multiple design styles per component, each with its own variants.
        </p>

        {/* Stats */}
        <div className="mt-[24px] flex gap-[24px] text-[14px] leading-[21px] text-text-muted">
          <span>
            <strong className="text-foreground">{components.length}</strong> components
          </span>
          <span>
            <strong className="text-foreground">{components.reduce((a, c) => a + c.styles, 0)}</strong> design styles
          </span>
          <span>
            <strong className="text-foreground">{components.reduce((a, c) => a + c.variants, 0)}</strong> variants
          </span>
        </div>

        {/* Filters */}
        <div className="mt-[32px] flex items-center gap-[8px]">
          {categories.map((cat) => (
            <button
              key={cat}
              className="inline-flex items-center rounded-[6px] border border-border px-[12px] py-[6px] text-[14px] font-medium leading-[20px] text-foreground transition-colors hover:bg-surface"
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="mt-[32px] grid gap-[16px] sm:grid-cols-2 lg:grid-cols-3">
          {components.map((comp) => (
            <Link
              key={comp.slug}
              href={`/components/${comp.slug}`}
              className="group rounded-[16px] border border-border p-[24px] transition-colors hover:border-accent hover:bg-surface"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[24px] font-semibold leading-[32px] tracking-[-0.96px] text-foreground">{comp.name}</h3>
                <span className="text-[12px] leading-[16px] text-text-muted">
                  {comp.styles} styles
                </span>
              </div>
              <p className="mt-[8px] text-[14px] leading-[21px] text-text-secondary">
                {comp.description}
              </p>
              <div className="mt-[16px] flex flex-wrap gap-[6px]">
                {comp.styleNames.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center rounded-[6px] border border-border px-[8px] py-[2px] text-[12px] leading-[16px] text-text-muted"
                  >
                    {name}
                  </span>
                ))}
              </div>
              <div className="mt-[12px] flex items-center gap-[8px]">
                <span className="text-[12px] leading-[16px] text-text-muted">
                  {comp.variants} variants per style
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
