import type { Metadata } from "next";
import Link from "next/link";
import { IconArrowRight } from "@devigner-ui/icons";
import { COMPONENT_CATEGORIES } from "@devignerui/shared";
import { components } from "@/lib/registry";
import { Navbar } from "../../components/landing/navbar";
import { SiteFooter } from "../../components/landing/closing";
import { CopyCommand } from "../../components/landing/copy-command";
import { Rack, type RackEntry } from "../../components/landing/rack";

export const metadata: Metadata = {
  title: "Components - Devigner UI",
  description:
    "Six free, live React components with every state designed. Press, drag and type on any of them, then add one with the CLI.",
};

// Server-side on purpose: the registry carries every component's source, and
// only these four fields need to reach the browser.
const ENTRIES: RackEntry[] = Object.values(components).map((c) => ({
  slug: c.slug,
  name: c.name,
  description: c.description,
  category:
    COMPONENT_CATEGORIES[c.category as keyof typeof COMPONENT_CATEGORIES] ??
    c.category,
}));

export default function ComponentsPage() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="grain-overlay" />
      <Navbar />
      <main className="relative overflow-x-clip">
        <div
          aria-hidden
          className="brand-glow pointer-events-none absolute -top-40 left-[-12%] size-240"
        />
        <section className="relative pt-32 pb-14 sm:pt-36">
          <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-end gap-10 px-5 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <h1 className="font-display text-[clamp(3.25rem,9vw,7.5rem)] leading-[0.88] font-extrabold tracking-[-0.055em] text-foreground">
                Components
              </h1>
              <p className="mt-6 max-w-xl text-[17px]/7 text-text-secondary sm:text-lg/8">
                Every component here is live and free. Click, drag and type on
                them, then install the one you want with a single command.
              </p>
            </div>
            <div className="w-full max-w-sm lg:pb-2">
              <CopyCommand command="npx devignerui init" highlight="init" />
              <p className="mt-3 px-1 text-[13px] text-text-muted">
                Set up once, then add any component by name.
              </p>
            </div>
          </div>
        </section>

        <section aria-label="All components" className="pb-24">
          <div className="mx-auto max-w-7xl px-5">
            <Rack entries={ENTRIES} />

            <div className="mt-4 flex flex-col gap-5 rounded-[30px] border border-border bg-background-100 p-7 sm:flex-row sm:items-center sm:justify-between sm:px-9">
              <p className="max-w-lg text-[17px]/7 text-text-secondary">
                <span className="text-foreground">Everything here is free.</span>{" "}
                Pro components are on the way. The plans are already posted.
              </p>
              <Link
                href="/#pricing"
                className="group inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-foreground px-6 text-[15px] font-medium text-background transition-transform duration-200 ease-out active:scale-[0.97]"
              >
                See the plans
                <IconArrowRight className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
