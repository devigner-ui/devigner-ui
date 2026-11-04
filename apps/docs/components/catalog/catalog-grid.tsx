"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { SPRING_LAYOUT } from "devignerui/motion";
import { IconArrowRight } from "@devigner-ui/icons";
import { cn } from "cn";
import {
  groupByCategory,
  searchEntries,
  sortEntries,
  type CatalogEntry,
  type CatalogSort,
} from "@/lib/catalog-query";
import { demos } from "../../demos";
import { FitToStage, LazyMount } from "../landing/canvas-frame";
import { CopyCommand } from "../landing/copy-command";
import { NewBadge } from "../new-badge";
import {
  ComponentsPanel,
  Pill,
  SIDEBAR_W,
  SidebarBrand,
  SidebarSheet,
  StageGround,
} from "../detail/component-page";

/* ─── Tile ─── */

/** One live component on a ruled grid: tiles overlap by 1px so shared edges
 *  are one line, never a card inside the stage box. */
function Tile({ entry }: { entry: CatalogEntry }) {
  const Demo = demos[entry.slug];
  const href = `/components/${entry.slug}`;

  return (
    <article
      aria-labelledby={`tile-${entry.slug}`}
      className="group relative -mt-px -ml-px flex min-w-0 flex-col border border-border"
    >
      <div className="frame-surface frame-dots relative h-72 overflow-hidden">
        {(entry.isNew || entry.isUpdated) && (
          <NewBadge
            updated={!entry.isNew}
            className="absolute top-3.5 right-3.5 z-20"
          />
        )}
        <LazyMount
          fallback={
            <div
              aria-hidden
              className="absolute inset-0 grid place-items-center px-6 text-center text-[28px] leading-none font-semibold tracking-tighter text-foreground/8"
            >
              {entry.name}
            </div>
          }
        >
          <FitToStage align={entry.stageAlign}>
            <Demo />
          </FitToStage>
        </LazyMount>
      </div>

      <div className="flex flex-1 items-center gap-4 border-t border-border px-5 py-4">
        <div className="min-w-0 flex-1">
          <h3
            id={`tile-${entry.slug}`}
            className="text-[15.5px] leading-tight font-semibold tracking-[-0.02em] text-foreground"
          >
            <Link
              href={href}
              className="rounded-md transition-colors duration-200 ease-out hover:text-brand focus-visible:text-brand"
            >
              {entry.name}
            </Link>
          </h3>
          <p className="mt-1 truncate text-[13px] text-text-secondary">
            {entry.description}
          </p>
        </div>
        <Link
          href={href}
          aria-label={`${entry.name} docs`}
          className="grid size-9 shrink-0 place-items-center rounded-full border border-border-hover text-text-secondary transition-colors duration-200 ease-out group-hover:border-brand group-hover:bg-brand group-hover:text-brand-foreground focus-visible:border-brand focus-visible:bg-brand focus-visible:text-brand-foreground"
        >
          <IconArrowRight aria-hidden className="size-4" />
        </Link>
      </div>
      <CopyCommand
        command={`npx devignerui add ${entry.slug}`}
        highlight={entry.slug}
        variant="strip"
        // Icon-only Copy, a step smaller, so the slug fits three across; the
        // button's label still names the whole command.
        className="h-12 w-full border-t border-border pl-5 text-[12px] [&_button]:px-4 [&_button>span:last-child]:hidden"
      />
    </article>
  );
}

/* ─── Sort ─── */

const SORTS: { id: CatalogSort; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "az", label: "A to Z" },
];

/** A segmented control: the interface well with a raised thumb. */
function SortControl({
  sort,
  onSort,
}: {
  sort: CatalogSort;
  onSort: (sort: CatalogSort) => void;
}) {
  const reduce = useReducedMotion();
  return (
    <div
      role="radiogroup"
      aria-label="Sort"
      className="flex rounded-[10px] border border-border bg-background/40 p-0.5 shadow-[inset_0_1px_2px_oklch(0%_0_0/0.08)]"
    >
      {SORTS.map((s) => {
        const on = s.id === sort;
        return (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onSort(s.id)}
            className={cn(
              "relative h-7.5 cursor-pointer px-3 text-[13px] tracking-[-0.01em] transition-colors duration-200 ease-out",
              on
                ? "text-foreground"
                : "text-text-muted hover:text-foreground",
            )}
          >
            {on && (
              <motion.span
                layoutId="catalog-sort-thumb"
                transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
                className="absolute inset-0 rounded-lg border border-border bg-white shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_6%,transparent),0_1px_2px_oklch(0%_0_0/0.12)] dark:bg-foreground/7"
              />
            )}
            <span className="relative">{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Empty ─── */

function NoMatch({
  query,
  entries,
  onClear,
}: {
  query: string;
  entries: CatalogEntry[];
  onClear: () => void;
}) {
  return (
    <div className="border border-border px-7 py-16 text-center sm:py-20">
      <p className="text-[clamp(1.5rem,3vw,2.25rem)] leading-tight font-semibold tracking-tighter text-foreground">
        Nothing called &ldquo;{query.trim()}&rdquo; yet.
      </p>
      <p className="mt-4 text-[16px] text-text-secondary">
        Tell us you want one.{" "}
        <a
          href="https://x.com/devignerui"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline decoration-brand underline-offset-4"
        >
          Ask @devignerui on X
        </a>{" "}
        or{" "}
        <Link
          href={`/requests?new&name=${encodeURIComponent(query.trim())}`}
          className="font-medium text-foreground underline decoration-brand underline-offset-4"
        >
          request it here
        </Link>
      </p>
      <p className="mt-6 text-[15px] text-text-muted">
        Or try:{" "}
        {entries.slice(0, 4).map((e, i, list) => (
          <span key={e.slug}>
            <Link
              href={`/components/${e.slug}`}
              className="text-text-secondary underline-offset-4 hover:text-foreground hover:underline"
            >
              {e.name}
            </Link>
            {i < list.length - 1 && ", "}
          </span>
        ))}
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-8 inline-flex h-11 cursor-pointer items-center rounded-full bg-foreground px-5 text-[14px] font-medium text-background transition-transform duration-200 ease-out active:scale-[0.97]"
      >
        Clear search
      </button>
    </div>
  );
}

/* ─── Overview ─── */

/** /components: the component page's shell, with the whole catalog in the
 *  stage box. The sidebar's search filters the grid too. */
export function CatalogOverview({ entries }: { entries: CatalogEntry[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<CatalogSort>("newest");
  const [navOpen, setNavOpen] = useState(false);

  // Below lg the sidebar is a sheet: "/" opens it, Esc puts it away.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") setNavOpen(false);
      if (e.key !== "/" || matchMedia("(min-width: 1024px)").matches) return;
      const el = e.target as HTMLElement;
      if (el.closest?.("input, textarea, select, [contenteditable='true']"))
        return;
      e.preventDefault();
      setNavOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const groups = groupByCategory(searchEntries(entries, query)).map((g) => ({
    ...g,
    items: sortEntries(g.items, sort),
  }));
  const shown = groups.reduce((n, g) => n + g.items.length, 0);
  const filtering = query.trim() !== "";

  const clear = () => {
    setQuery("");
    // Whichever search field is on screen: the sidebar's, or the sheet's.
    const fields = document.querySelectorAll<HTMLInputElement>(
      'input[aria-label="Search components"]',
    );
    [...fields].find((f) => f.offsetParent)?.focus();
  };

  return (
    <div className="relative flex h-dvh overflow-hidden bg-background">
      <aside
        aria-label="Components"
        style={{ width: SIDEBAR_W }}
        className="flex shrink-0 flex-col pt-5 pl-3 max-lg:hidden"
      >
        <div className="mb-4.5 ml-2 self-start">
          <SidebarBrand />
        </div>
        <ComponentsPanel
          sidebar
          entries={entries}
          current=""
          query={query}
          onQuery={setQuery}
        />
      </aside>

      <main className="relative min-w-0 flex-1 overflow-hidden lg:m-3 lg:rounded-2xl lg:border lg:border-border lg:shadow-subtle">
        <StageGround />
        <div className="code-scroll absolute inset-0 overflow-y-auto overscroll-contain">
          <div className="mx-auto max-w-300 px-5 pt-24 pb-16 sm:px-8 lg:px-10 lg:pt-14">
            <header className="grid grid-cols-1 items-end gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0">
                <h1 className="max-w-2xl text-[clamp(2rem,3.6vw,2.875rem)] leading-[1.05] font-semibold tracking-[-0.05em] text-balance wrap-break-word text-foreground">
                  React Components for Tailwind CSS
                </h1>
                <p className="mt-4 max-w-xl text-[16px]/7 text-pretty text-text-secondary">
                  Free animated React components for Tailwind CSS. Every
                  tile below is running, so try it right here, then copy the
                  command that installs it.
                </p>
              </div>
              <div className="w-full max-w-sm">
                <CopyCommand
                  command="npx devignerui init"
                  highlight="init"
                  className="w-full"
                />
                <p className="mt-3 px-1 text-[13px] text-text-muted">
                  Once per project, then add any of these by name
                </p>
                <Link
                  href="/requests?new"
                  className="group mt-1 inline-flex min-h-9 items-center gap-1.5 px-1 text-[13px] text-text-secondary transition-colors duration-200 ease-out hover:text-foreground"
                >
                  Missing one? Request a component
                  <IconArrowRight
                    aria-hidden
                    className="size-3.5 text-brand transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none"
                  />
                </Link>
              </div>
            </header>

            <div className="mt-12 flex items-center justify-between gap-4 border-b border-border pb-4">
              <p aria-live="polite" className="text-[13px] text-text-muted">
                {filtering
                  ? `${shown} of ${entries.length} match “${query.trim()}”`
                  : `${entries.length} components`}
              </p>
              <SortControl sort={sort} onSort={setSort} />
            </div>

            {shown === 0 ? (
              <div className="mt-8">
                <NoMatch query={query} entries={entries} onClear={clear} />
              </div>
            ) : (
              groups.map((g) => (
                <section
                  key={g.label}
                  aria-labelledby={`group-${g.label}`}
                  className="mt-10"
                >
                  <h2
                    id={`group-${g.label}`}
                    className="flex items-baseline gap-2 text-[17px] font-semibold tracking-[-0.02em] text-foreground"
                  >
                    {g.label}
                    <span className="text-[13px] font-normal text-text-muted tabular-nums">
                      {g.items.length}
                    </span>
                  </h2>
                  <div className="mt-4 grid grid-cols-1 pt-px pl-px md:grid-cols-2 xl:grid-cols-3">
                    {g.items.map((entry) => (
                      <Tile key={entry.slug} entry={entry} />
                    ))}
                  </div>
                </section>
              ))
            )}

          </div>
        </div>

        <div className="absolute top-3.5 left-1/2 z-30 -translate-x-1/2 lg:hidden">
          <Pill onMenu={() => setNavOpen(true)} />
        </div>
      </main>

      <SidebarSheet
        open={navOpen}
        onClose={() => setNavOpen(false)}
        entries={entries}
        current=""
        query={query}
        onQuery={setQuery}
      />
    </div>
  );
}
