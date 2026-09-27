"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { IconArrowRight, IconSearchNormal } from "@devigner-ui/icons";
import { cn } from "cn";
import {
  categoryCounts,
  filterByCategory,
  searchEntries,
  sortEntries,
  type CatalogEntry,
  type CatalogSort,
} from "@/lib/catalog-query";
import { demos } from "../../demos";
import { FitToStage, LazyMount } from "../landing/canvas-frame";
import { CopyCommand } from "../landing/copy-command";

/* ─── Card ─── */

function Card({ entry }: { entry: CatalogEntry }) {
  const Demo = demos[entry.slug];
  const href = `/components/${entry.slug}`;
  const tick =
    "pointer-events-none absolute z-30 size-2.5 border-brand opacity-0 transition-opacity duration-200 ease-out group-focus-within:opacity-100 group-hover:opacity-100";

  return (
    <article
      aria-labelledby={`card-${entry.slug}`}
      className="group relative flex min-w-0 flex-col -mt-px -ml-px border border-border bg-background"
    >
      {/* Corner ticks, on hover or keyboard focus. */}
      <span
        aria-hidden
        className={cn(tick, "-top-px -left-px border-t border-l")}
      />
      <span
        aria-hidden
        className={cn(tick, "-right-px -bottom-px border-r border-b")}
      />

      <div className="frame-surface frame-dots relative h-95 overflow-hidden">
        {entry.isNew && (
          <span className="absolute top-4 right-4 z-20 rounded-full bg-brand/10 px-2.5 font-mono text-[10.5px] font-medium tracking-[0.06em] text-brand uppercase leading-loose">
            New
          </span>
        )}
        <LazyMount
          fallback={
            <div
              aria-hidden
              className="absolute inset-0 grid place-items-center px-6 text-center text-[clamp(1.75rem,3.5vw,2.5rem)] leading-none font-semibold tracking-tighter text-foreground/8"
            >
              {entry.name}
            </div>
          }
        >
          <FitToStage
            align={entry.stageAlign}
            className="transition-transform duration-300 ease-out group-hover:-translate-y-1"
          >
            <Demo />
          </FitToStage>
        </LazyMount>
      </div>

      <div className="flex flex-1 items-start justify-between gap-5 px-6 pt-5.5 pb-6 border-t border-border">
        <div className="min-w-0">
          <h2
            id={`card-${entry.slug}`}
            className="text-[22px] leading-tight font-semibold tracking-[-0.035em] text-foreground transition-colors duration-200 ease-out group-focus-within:text-brand group-hover:text-brand"
          >
            <Link href={href} className="rounded-md">
              {entry.name}
            </Link>
          </h2>
          <p className="mt-1.5 line-clamp-2 min-h-12 max-w-md text-[14.5px]/6 text-text-secondary">
            {entry.description}
          </p>
        </div>
        <Link
          href={href}
          aria-label={`${entry.name} docs`}
          className="grid size-10 shrink-0 place-items-center rounded-full border border-border-hover text-text-secondary transition-colors duration-200 ease-out group-hover:border-brand group-hover:bg-brand group-hover:text-brand-foreground"
        >
          <IconArrowRight aria-hidden className="size-4" />
        </Link>
      </div>
      <CopyCommand
        command={`npx devignerui add ${entry.slug}`}
        highlight={entry.slug}
        variant="strip"
        className="w-full border-t border-border"
      />
    </article>
  );
}

/* ─── Toolbar pieces ─── */

function Pill({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-200 ease-out cursor-pointer",
        pressed
          ? "bg-foreground text-background"
          : "text-text-secondary hover:bg-surface-hover hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

const isEditable = (el: Element | null) =>
  el instanceof HTMLElement &&
  (el.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

/* ─── Grid ─── */

export function CatalogGrid({ entries }: { entries: CatalogEntry[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<CatalogSort>("newest");
  const search = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key !== "/" ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        isEditable(document.activeElement)
      )
        return;
      e.preventDefault();
      search.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const shown = sortEntries(
    searchEntries(filterByCategory(entries, category), query),
    sort,
  );
  const filtering = query.trim() !== "" || category !== "all";

  return (
    <div>
      {/* Rides up into the navbar's spot while the navbar is scrolled away. */}
      <div className="sticky top-19 z-30 transition-transform duration-500 ease-drawer in-data-nav-hidden:-translate-y-16">
        <div className="flex flex-col gap-2 rounded-[20px] bg-background-100/85 p-1.5 shadow-elevated backdrop-blur-xl lg:flex-row lg:items-center">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-border bg-background px-4 ring-brand focus-within:ring-2 lg:max-w-xs">
            <IconSearchNormal
              aria-hidden
              className="size-4 shrink-0 text-text-muted"
            />
            <span className="sr-only">Search components</span>
            <input
              ref={search}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search components"
              // The global ring is unlayered and would win over a utility; the
              // label shows focus instead (focus-within:ring-2).
              style={{ outline: "none" }}
              className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-foreground placeholder:text-text-muted"
            />
            <kbd
              aria-hidden
              className="rounded-md border border-border px-1.5 font-mono text-[11px] text-text-muted"
            >
              /
            </kbd>
          </label>
          <div
            role="group"
            aria-label="Filter by category"
            className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-1"
          >
            <Pill
              pressed={category === "all"}
              onClick={() => setCategory("all")}
            >
              All{" "}
              <span className="font-mono text-[11px] opacity-60">
                {entries.length}
              </span>
            </Pill>
            {categoryCounts(entries).map((c) => (
              <Pill
                key={c.key}
                pressed={category === c.key}
                onClick={() => setCategory(c.key)}
              >
                {c.label}{" "}
                <span className="font-mono text-[11px] opacity-60">
                  {c.count}
                </span>
              </Pill>
            ))}
          </div>
          <div
            role="group"
            aria-label="Sort"
            className="flex shrink-0 gap-1 self-start rounded-full border border-border bg-background p-1 lg:self-auto"
          >
            <Pill pressed={sort === "newest"} onClick={() => setSort("newest")}>
              Newest
            </Pill>
            <Pill pressed={sort === "az"} onClick={() => setSort("az")}>
              A to Z
            </Pill>
          </div>
        </div>
      </div>

      <p
        aria-live="polite"
        className="min-h-6 px-2 pt-4 text-[14px] text-text-muted"
      >
        {filtering && `${shown.length} of ${entries.length} components`}
      </p>

      {shown.length > 0 ? (
        // Cards overlap by 1px so shared edges collapse into one border, and a
        // lone last card gets a border of its own instead of an empty cell.
        <div className="mt-2 grid grid-cols-1 pt-px pl-px lg:grid-cols-2">
          {shown.map((entry) => (
            <Card key={entry.slug} entry={entry} />
          ))}
        </div>
      ) : (
        <div className="mt-2 border border-border bg-background-100 px-7 py-16 text-center sm:py-20">
          <p className="text-[clamp(1.75rem,3.4vw,2.5rem)] leading-tight font-semibold tracking-tighter text-foreground">
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
            onClick={() => {
              setQuery("");
              search.current?.focus();
            }}
            className="mt-8 inline-flex h-11 items-center rounded-full bg-foreground px-5 text-[14px] font-medium text-background"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}
