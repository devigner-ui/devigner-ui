// Real, rendered preview markup for each registry component — shared between
// the ComponentRange bento grid and the hero carousel so both surfaces show
// the exact same components instead of two different visual claims.
// Keep in sync with lib/registry.ts (names, slugs, style counts).
// ponytail: hardcoded snapshot instead of importing the registry — importing
// would ship every style's source string to the client for five numbers.

export interface ComponentPreview {
  slug: string;
  name: string;
  styles: string[];
  preview: React.ReactNode;
}

export const COMPONENT_PREVIEWS: ComponentPreview[] = [
  {
    slug: "card",
    name: "Card",
    styles: ["Default", "Glass", "Spotlight"],
    preview: (
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-background p-3.5 shadow-subtle">
          <div className="text-xs font-semibold text-foreground">Default</div>
          <div className="mt-1 text-[11px] text-text-muted">
            Clean elevation
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-border p-3.5">
          <div className="absolute -top-4 -left-4 size-16 rounded-full bg-accent/25 blur-xl" />
          <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm" />
          <div className="relative">
            <div className="text-xs font-semibold text-foreground">Glass</div>
            <div className="mt-1 text-[11px] text-text-muted">
              Frosted blur
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-accent/25 bg-background p-3.5">
          <div className="pointer-events-none absolute -top-6 right-0 size-20 rounded-full bg-accent/20 blur-2xl" />
          <div className="relative">
            <div className="text-xs font-semibold text-foreground">
              Spotlight
            </div>
            <div className="mt-1 text-[11px] text-text-muted">
              Cursor-lit
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    slug: "badge",
    name: "Badge",
    styles: ["Default", "Pill", "Dot"],
    preview: (
      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-accent">
          Default
        </span>
        <span className="inline-flex items-center rounded-full border border-accent/20 bg-accent/5 px-2.5 py-0.5 text-[11px] font-medium text-accent">
          Pill
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-foreground">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-success" />
          </span>
          Live
        </span>
      </div>
    ),
  },
  {
    slug: "input",
    name: "Input",
    styles: ["Default", "Floating", "Underline"],
    preview: (
      <div className="space-y-2.5">
        <input
          type="text"
          placeholder="Default input"
          tabIndex={-1}
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-[13px] text-foreground placeholder:text-text-muted"
          readOnly
        />
        <input
          type="text"
          placeholder="Underline input"
          tabIndex={-1}
          className="w-full border-b-2 border-border bg-transparent px-0.5 pb-1.5 text-[13px] text-foreground placeholder:text-text-muted"
          readOnly
        />
      </div>
    ),
  },
  {
    slug: "hero-section",
    name: "Hero Section",
    styles: ["Default", "Gradient", "Parallax"],
    preview: (
      <div className="rounded-xl border border-border bg-background px-4 py-5 text-center">
        <div className="text-sm font-semibold tracking-tight text-foreground">
          Launch faster.
        </div>
        <div className="mt-1 text-[11px] text-text-muted">
          Three hero layouts, one prop API.
        </div>
        <div className="mt-3 flex justify-center gap-1.5">
          <span className="inline-flex h-6 items-center rounded-md bg-foreground px-2.5 text-[10px] font-medium text-background">
            Get started
          </span>
          <span className="inline-flex h-6 items-center rounded-md border border-border px-2.5 text-[10px] font-medium text-foreground">
            Docs
          </span>
        </div>
      </div>
    ),
  },
  {
    slug: "button",
    name: "Button",
    styles: ["Default", "Gradient", "Magnetic"],
    preview: (
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-9 items-center rounded-lg bg-foreground px-4 text-xs font-medium text-background">
          Default
        </span>
        <span className="inline-flex h-9 items-center rounded-lg bg-linear-to-r from-accent via-accent-secondary to-accent-tertiary px-4 text-xs font-medium text-accent-foreground">
          Gradient
        </span>
        <span className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-4 text-xs font-medium text-foreground">
          Magnetic
        </span>
      </div>
    ),
  },
];
