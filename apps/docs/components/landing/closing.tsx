// A server component: the footer reads the catalog and the package version at
// build; the cards and the pressed wordmark are the client parts.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import { IconArrowRight, IconArrowUp } from "@devigner-ui/icons";
import { FooterBento } from "./footer-bento";
import { PressedWordmark } from "./pressed-wordmark";
import { getCatalog } from "@/lib/catalog";
import uiPackage from "../../../../packages/ui/package.json";
// Evaluated at build for the static HTML; the browser agrees except across
// a New Year, which suppressHydrationWarning covers.
const YEAR = new Date().getFullYear();

/** A component's preview shot, with a fingerprint of the PNG in the URL. The
 *  route is cached for a day, so without it a fresh shot (a component whose
 *  look changed) would sit behind the old one in browsers that saw it. */
function shotUrl(slug: string) {
  const url = `/components/${slug}/preview`;
  try {
    const png = readFileSync(join(process.cwd(), "assets", "og", `${slug}.png`));
    return `${url}?v=${createHash("sha1").update(png).digest("hex").slice(0, 8)}`;
  } catch {
    return url;
  }
}

/** The closing line before the footer, with the light of the footer's
 *  horizon rising into it. */
export function LastCall() {
  return (
    <section
      aria-labelledby="last-call-title"
      className="relative isolate px-5 pt-36 pb-28 text-center sm:pt-44"
    >
      <h2
        id="last-call-title"
        className="mx-auto max-w-4xl text-[clamp(2.5rem,6vw,5rem)] leading-[0.98] font-semibold tracking-[-0.055em] text-balance text-foreground"
      >
        Start with one <span className="accent-word">component</span>.
      </h2>
      <p className="mx-auto mt-6 max-w-md text-[17px]/7 text-pretty text-text-secondary">
        Pick any of them, run one command, and edit it like the rest of your
        code.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
        <Link
          href="/components"
          className="group inline-flex h-12 items-center gap-2 rounded-full bg-brand px-6 text-[15px] font-medium text-brand-foreground shadow-[inset_0_1px_0_var(--stage-light)] ring-1 ring-brand-hover transition-transform duration-200 ease-out active:scale-[0.97]"
        >
          Browse components
          <IconArrowRight
            aria-hidden
            className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
          />
        </Link>
        <Link
          href="/requests?new"
          className="text-[15px] font-medium text-text-secondary transition-colors duration-200 ease-out hover:text-foreground"
        >
          Or request one
        </Link>
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 -z-10 h-40 w-[min(1100px,92%)] -translate-x-1/2 bg-[radial-gradient(50%_100%_at_50%_100%,var(--glow),transparent)]"
      />
    </section>
  );
}

export function SiteFooter() {
  const catalog = getCatalog();
  const updated = new Date(`${catalog[0].addedAt}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  return (
    <footer className="relative overflow-hidden border-t border-border">
      {/* A lit horizon where the footer begins. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-px left-1/2 h-px w-[min(900px,90%)] -translate-x-1/2 bg-linear-to-r from-transparent via-brand/60 to-transparent"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -top-55 left-1/2 h-90 w-225 -translate-x-1/2 bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--brand)_8%,transparent),transparent)]"
      />
      <div className="relative mx-auto max-w-7xl px-5 pt-24">
        <FooterBento
          version={uiPackage.version}
          updated={updated}
          components={catalog.map((e) => ({
            slug: e.slug,
            name: e.name,
            isNew: e.isNew,
            description: e.description,
            shot: shotUrl(e.slug),
          }))}
        />
      </div>
      <div className="mx-auto max-w-7xl px-5">
        <PressedWordmark />
      </div>

      <div className="relative border-t border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 text-[13px] text-text-muted">
          <span suppressHydrationWarning>Devigner &copy; {YEAR}</span>
          <a
            href="#"
            aria-label="Back to top"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-text-secondary transition-colors duration-200 ease-out hover:border-border-hover hover:bg-surface-hover hover:text-foreground"
          >
            <IconArrowUp aria-hidden className="size-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}

