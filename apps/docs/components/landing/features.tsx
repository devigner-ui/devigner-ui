const PANELS: { title: string; body: string; visual: React.ReactNode }[] = [
  {
    title: "Own the output",
    body: "The CLI writes plain .tsx files into your repo. Uninstall us afterwards and everything keeps working.",
    visual: (
      <div className="mt-7 rounded-xl border border-border bg-background p-4 font-mono text-[12px]/6">
        <div className="text-text-muted">components/ui/</div>
        <div className="pl-4 text-foreground">
          card.tsx
          <span className="ml-2 rounded-full bg-success/10 px-1.5 py-px text-[10px] font-medium text-success">
            added
          </span>
        </div>
        <div className="pl-4 text-foreground">
          button.tsx
          <span className="ml-2 rounded-full bg-success/10 px-1.5 py-px text-[10px] font-medium text-success">
            added
          </span>
        </div>
        <div className="mt-1 text-text-muted">lib/</div>
        <div className="pl-4 text-foreground">utils.ts</div>
      </div>
    ),
  },
  {
    title: "Tailwind-native",
    body: "Styled with Tailwind v4 semantic tokens. Retheme everything at once by editing CSS variables, not components.",
    visual: (
      <div className="mt-7 grid grid-cols-2 gap-2.5">
        {(
          [
            ["--color-accent", "bg-accent"],
            ["--color-surface", "bg-surface"],
            ["--color-border", "bg-border"],
            ["--color-foreground", "bg-foreground"],
          ] as const
        ).map(([name, cls]) => (
          <div
            key={name}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5"
          >
            <span
              className={`size-4 shrink-0 rounded-full border border-border ${cls}`}
            />
            <code className="truncate text-[11px] text-text-secondary">
              {name}
            </code>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Framework-idiomatic",
    body: "Written the way you would write it: TypeScript, CVA variants, motion only where it earns its place.",
    visual: (
      <div className="mt-7 rounded-xl border border-border bg-background p-4 font-mono text-[12px]/6">
        <div>
          <span className="text-text-muted">&lt;</span>
          <span className="text-accent">Button</span>
        </div>
        <div className="pl-4">
          <span className="text-warning">variant</span>
          <span className="text-text-muted">=</span>
          <span className="text-success">&quot;outline&quot;</span>
        </div>
        <div className="pl-4">
          <span className="text-warning">size</span>
          <span className="text-text-muted">=</span>
          <span className="text-success">&quot;lg&quot;</span>
        </div>
        <div>
          <span className="text-text-muted">/&gt;</span>
        </div>
      </div>
    ),
  },
];

/**
 * Three reasons the copy-paste model holds. These are table stakes in this
 * category rather than the lead argument, so they sit as a quiet band: no
 * display heading, no pinned horizontal track, no scroll choreography.
 */
export function Features() {
  return (
    <section className="section-editorial">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:py-24">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-text-muted">
          Why copy-paste wins
        </h2>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-text-secondary">
          A component library you install is a dependency. A component you
          paste is a starting point.
        </p>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PANELS.map((panel) => (
            <div
              key={panel.title}
              className="glass-card rounded-3xl p-7 transition-[border-color] duration-300 ease-out hover:border-border-hover sm:p-8"
            >
              <h3 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
                {panel.title}
              </h3>
              <p className="mt-3 text-[14px] leading-relaxed text-text-secondary">
                {panel.body}
              </p>
              {panel.visual}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
