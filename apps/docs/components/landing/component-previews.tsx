// Real, rendered preview markup for each registry component — shared between
// the ComponentRange bento grid and the hero carousel so both surfaces show
// the exact same components instead of two different visual claims.
// Keep in sync with lib/registry.ts (names, slugs).
// ponytail: hardcoded snapshot instead of importing the registry — importing
// would ship every component's source string to the client for a few labels.

export interface ComponentPreview {
  slug: string;
  name: string;
  preview: React.ReactNode;
}

export const COMPONENT_PREVIEWS: ComponentPreview[] = [
  {
    slug: "card",
    name: "Card",
    preview: (
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-background p-3.5 shadow-subtle">
          <div className="text-xs font-semibold text-foreground">Header</div>
          <div className="mt-1 text-[11px] text-text-muted">
            Clean elevation
          </div>
        </div>
        <div className="rounded-xl border border-border bg-background p-3.5 shadow-subtle">
          <div className="text-xs font-semibold text-foreground">Content</div>
          <div className="mt-1 text-[11px] text-text-muted">
            Compound sections
          </div>
        </div>
        <div className="rounded-xl border border-border bg-background p-3.5 shadow-subtle">
          <div className="text-xs font-semibold text-foreground">Footer</div>
          <div className="mt-1 text-[11px] text-text-muted">
            Own the markup
          </div>
        </div>
      </div>
    ),
  },
  {
    slug: "badge",
    name: "Badge",
    preview: (
      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-accent">
          Default
        </span>
        <span className="inline-flex items-center rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-medium text-foreground">
          Secondary
        </span>
        <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-foreground">
          Outline
        </span>
      </div>
    ),
  },
  {
    slug: "input",
    name: "Input",
    preview: (
      <div className="space-y-2.5">
        <input
          type="text"
          placeholder="you@example.com"
          tabIndex={-1}
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-[13px] text-foreground placeholder:text-text-muted"
          readOnly
        />
        <input
          type="password"
          placeholder="Password"
          tabIndex={-1}
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-[13px] text-foreground placeholder:text-text-muted"
          readOnly
        />
      </div>
    ),
  },
  {
    slug: "hero-section",
    name: "Hero Section",
    preview: (
      <div className="rounded-xl border border-border bg-background px-4 py-5 text-center">
        <div className="text-sm font-semibold tracking-tight text-foreground">
          Launch faster.
        </div>
        <div className="mt-1 text-[11px] text-text-muted">
          Centered, split, minimal — one prop API.
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
    preview: (
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-9 items-center rounded-lg bg-foreground px-4 text-xs font-medium text-background">
          Default
        </span>
        <span className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-4 text-xs font-medium text-foreground">
          Outline
        </span>
        <span className="inline-flex h-9 items-center rounded-lg bg-surface px-4 text-xs font-medium text-foreground">
          Secondary
        </span>
      </div>
    ),
  },
];
