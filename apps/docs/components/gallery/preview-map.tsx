import { Badge, Button, Card, CardContent, Input } from "@devignerui/ui";

/**
 * Live previews keyed by registry slug — the single source for the landing
 * rail and both gallery surfaces.
 *
 * These render the real components the CLI installs. Never hand-rolled markup
 * imitating a component: a gallery that mocks its own library is selling
 * something it does not ship.
 *
 * A slug with no entry here has no tile. There are no "coming soon" placeholders.
 */
export const PREVIEWS: Record<string, React.ReactNode> = {
  button: (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button size="sm">Get started</Button>
      <Button size="sm" variant="secondary">
        Docs
      </Button>
    </div>
  ),
  input: (
    <div className="w-full max-w-64">
      <Input placeholder="you@company.com" />
    </div>
  ),
  badge: (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Badge>Stable</Badge>
      <Badge variant="secondary">Beta</Badge>
      <Badge variant="outline">Draft</Badge>
    </div>
  ),
  card: (
    <Card className="w-full max-w-72">
      <CardContent className="p-5">
        <p className="text-[13px] text-text-secondary">
          Cards carry their own padding, border and elevation.
        </p>
      </CardContent>
    </Card>
  ),
  "hero-section": (
    <div className="w-full max-w-80 rounded-xl border border-border bg-background p-5 text-center">
      <p className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">
        Ship the section, not the scaffolding
      </p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-text-secondary">
        Headline, copy and actions, already composed.
      </p>
      <div className="mt-3 flex justify-center gap-2">
        <Button size="sm">Start</Button>
        <Button size="sm" variant="secondary">
          Docs
        </Button>
      </div>
    </div>
  ),
};
