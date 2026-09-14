// Real, rendered preview markup for each registry component - shared between
// the ComponentRange bento grid and the hero carousel so both surfaces show
// the exact same components instead of two different visual claims.
// Keep in sync with lib/registry.ts (names, slugs).
// ponytail: hardcoded snapshot instead of importing the registry - importing
// would ship every component's source string to the client for a few labels.
// ponytail: static markup, not the live MagneticButton - inside the carousel's
// 3D transform the pill would fight the card's own transform. A still frame is
// what these surfaces need.

export interface ComponentPreview {
  slug: string;
  name: string;
  preview: React.ReactNode;
}

export const COMPONENT_PREVIEWS: ComponentPreview[] = [
  {
    slug: "magnetic-button",
    name: "Magnetic Button",
    preview: (
      <div className="flex items-center justify-center gap-4 py-2">
        <span className="relative inline-flex items-center overflow-hidden rounded-full bg-foreground px-6 py-3 text-xs font-medium text-background">
          Get started
        </span>
        <span className="relative inline-flex items-center overflow-hidden rounded-full border border-border px-6 py-3 text-xs font-medium text-foreground">
          {/* mid-sweep: the fill caught halfway up the pill */}
          <span
            aria-hidden
            className="pointer-events-none absolute top-[25%] left-[-6%] h-[260%] w-[112%] rounded-[50%] bg-linear-to-t from-accent from-25% to-accent/40 to-70%"
          />
          <span className="relative z-10">Read the docs</span>
        </span>
      </div>
    ),
  },
];
