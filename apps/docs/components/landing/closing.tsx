// The site footer: the bento, the pressed wordmark, and a bottom bar that
// carries the links.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import { IconArrowUp } from "@devigner-ui/icons";
import { getCatalog } from "@/lib/catalog";
import { DISCORD_URL, LogoDiscord, LogoX } from "../brand-logos";
import { PressedWordmark } from "./pressed-wordmark";
import { FooterBento } from "./footer-bento";
import uiPackage from "../../../../packages/ui/package.json";

const YEAR = new Date().getFullYear();

function shotUrl(slug: string) {
  const url = `/components/${slug}/preview`;
  try {
    const png = readFileSync(join(process.cwd(), "assets", "og", `${slug}.png`));
    return `${url}?v=${createHash("sha1").update(png).digest("hex").slice(0, 8)}`;
  } catch {
    return url;
  }
}

const LINKS = [
  ["Components", "/components"],
  ["Requests", "/requests"],
  ["Pricing", "/pricing"],
  ["llms.txt", "/llms.txt"],
] as const;

export function SiteFooter() {
  const catalog = getCatalog();
  const updated = new Date(`${catalog[0].addedAt}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  return (
    <footer className="fade-border relative overflow-hidden border-t">
      {/* The top edge is the details page's separator: a rule that fades out
          toward both ends. */}
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

      <div className="fade-border relative border-t bg-background">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4 text-[13px] text-text-muted">
          <span suppressHydrationWarning>Devigner &copy; {YEAR}</span>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
            {LINKS.map(([label, href]) => (
              <Link key={href} href={href} className="transition-colors duration-200 ease-out hover:text-foreground">
                {label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <a
              href="https://x.com/devignerui"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Devigner UI on X"
              className="grid size-9 place-items-center rounded-full text-text-secondary transition-colors duration-200 ease-out hover:bg-surface-hover hover:text-foreground"
            >
              <LogoX className="size-3.5" />
            </a>
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Devigner UI on Discord"
              className="grid size-9 place-items-center rounded-full text-text-secondary transition-colors duration-200 ease-out hover:bg-surface-hover hover:text-foreground"
            >
              <LogoDiscord className="size-4" />
            </a>
            <a
              href="#"
              aria-label="Back to top"
              className="ml-2 grid size-9 shrink-0 place-items-center rounded-full border border-border text-text-secondary transition-colors duration-200 ease-out hover:border-border-hover hover:bg-surface-hover hover:text-foreground"
            >
              <IconArrowUp aria-hidden className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
