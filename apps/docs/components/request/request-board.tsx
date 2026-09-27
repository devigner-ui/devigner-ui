"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  IconAdd,
  IconArrowRight,
  IconChevronDown,
  IconLike,
  IconLink,
  IconMessage,
  IconSearchNormal,
} from "@devigner-ui/icons";
import { SPRING_LAYOUT } from "devignerui/motion";
import { cn } from "cn";
import type { RequestPost, Status } from "@/lib/requests";
import { DISCORD_URL, LogoDiscord } from "../brand-logos";

/** Mirrors STATUSES / STATUS_LABEL in lib/requests.ts, which is server only. */
const STATUS: { id: Status; label: string; dot: string; badge: string }[] = [
  { id: "pending", label: "Pending", dot: "bg-text-muted", badge: "text-text-secondary" },
  { id: "review", label: "In review", dot: "bg-brand", badge: "text-brand" },
  { id: "queue", label: "In queue", dot: "bg-warning", badge: "text-warning" },
  { id: "published", label: "Built", dot: "bg-success", badge: "text-success" },
];
const statusOf = (id: Status) => STATUS.find((s) => s.id === id)!;

type Sort = "votes" | "newest";
type Filter = Status | "all";

const date = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });

/** A pill that glides between options. One per group, keyed by `group`. */
function Segmented<T extends string>({
  group,
  label,
  value,
  options,
  onChange,
}: {
  group: string;
  label: string;
  value: T;
  options: { id: T; label: React.ReactNode }[];
  onChange: (v: T) => void;
}) {
  const reduce = useReducedMotion();
  return (
    <div role="radiogroup" aria-label={label} className="flex shrink-0 rounded-full border border-border bg-background-100 p-0.5">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.id)}
            className={cn(
              "relative inline-flex h-8 cursor-pointer items-center gap-2 rounded-full px-3 text-[13px] whitespace-nowrap transition-colors duration-150 ease-out",
              on ? "text-foreground" : "text-text-muted hover:text-text-secondary",
            )}
          >
            {on && (
              <motion.span
                layoutId={`${group}-pill`}
                transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
                className="absolute inset-0 rounded-full bg-surface-hover shadow-subtle"
              />
            )}
            <span className="relative inline-flex items-center gap-2">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function RequestBoard({
  posts,
  onRequest,
}: {
  posts: RequestPost[];
  /** Opens the request dialog, prefilled with what was searched for. */
  onRequest: (name?: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("votes");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts
      .filter((p) => filter === "all" || p.status === filter)
      .filter((p) => !q || `${p.title} ${p.details ?? ""}`.toLowerCase().includes(q))
      .sort((a, b) =>
        sort === "votes" ? b.votes - a.votes || b.createdAt - a.createdAt : b.createdAt - a.createdAt,
      );
  }, [posts, filter, sort, query]);

  const reduce = useReducedMotion();
  const glide = reduce ? { duration: 0 } : SPRING_LAYOUT;

  const count = (s: Filter) => (s === "all" ? posts.length : posts.filter((p) => p.status === s).length);

  return (
    <div className="mt-12">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Scrolls sideways on a phone rather than wrapping into two rows. */}
        <div className="-mx-5 overflow-x-auto px-5 scrollbar-none lg:mx-0 lg:px-0">
          <Segmented
            group="request-status"
            label="Filter by status"
            value={filter}
            onChange={setFilter}
            options={[{ id: "all" as Filter, label: "All", dot: "" }, ...STATUS].map((s) => ({
              id: s.id,
              label: (
                <>
                  {s.dot && <span aria-hidden className={cn("size-1.5 rounded-full", s.dot)} />}
                  {s.label}
                  <span className="font-mono text-[11.5px] text-text-muted tabular-nums">{count(s.id)}</span>
                </>
              ),
            }))}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-background-100 px-3.5 text-text-muted transition-colors duration-150 ease-out focus-within:border-border-hover lg:w-52 lg:flex-none">
            <IconSearchNormal aria-hidden className="size-3.5 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search requests"
              className="min-w-0 flex-1 bg-transparent text-[13.5px] text-foreground outline-none! placeholder:text-text-muted"
            />
          </label>
          <Segmented
            group="request-sort"
            label="Sort"
            value={sort}
            onChange={setSort}
            options={[
              { id: "votes", label: "Top" },
              { id: "newest", label: "New" },
            ]}
          />
        </div>
      </div>

      {shown.length > 0 ? (
        // The list resizes with its rows (a filter, an expanded row) instead of
        // snapping; motion keeps the corners round while it scales.
        <motion.ol
          layout
          transition={glide}
          style={{ borderRadius: 16 }}
          className="mt-5 overflow-hidden border border-border bg-background-100"
        >
          <AnimatePresence initial={false}>
            {shown.map((p) => (
              <Row
                key={p.id}
                post={p}
                open={open === p.id}
                onToggle={() => setOpen((o) => (o === p.id ? null : p.id))}
              />
            ))}
          </AnimatePresence>
        </motion.ol>
      ) : (
        <EmptyState
          query={query.trim()}
          filter={filter === "all" ? null : statusOf(filter).label}
          hasAny={posts.length > 0}
          onRequest={onRequest}
          onReset={() => {
            setQuery("");
            setFilter("all");
          }}
        />
      )}
    </div>
  );
}

function Row({ post: p, open, onToggle }: { post: RequestPost; open: boolean; onToggle: () => void }) {
  const reduce = useReducedMotion();
  const s = statusOf(p.status);
  const id = `request-${p.id}`;

  return (
    // Re-sorting glides each row to its new place instead of swapping them.
    // Position only: the row's own height is the expand animation's job.
    <motion.li
      layout="position"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
      className="border-b border-border last:border-b-0"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={id}
        className="flex w-full cursor-pointer items-center gap-4 px-4 py-3.5 text-left transition-colors duration-150 ease-out hover:bg-surface/60 sm:px-5"
      >
        {/* Votes lead the row: they are what the board ranks by. */}
        <span
          className={cn(
            "flex size-12 shrink-0 flex-col items-center justify-center rounded-xl border",
            p.votes > 0
              ? "border-brand/25 bg-brand/8 text-brand"
              : "border-border text-text-muted",
          )}
        >
          <IconLike aria-hidden className="size-4" />
          <span className="font-mono text-[12px]/4 tabular-nums">{p.votes}</span>
          <span className="sr-only">{p.votes === 1 ? "vote" : "votes"}</span>
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-[15px] font-medium text-foreground">{p.title}</span>
          </span>
          {p.details && (
            <span className="mt-0.5 block truncate text-[13.5px] text-text-secondary">{p.details}</span>
          )}
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-text-muted">
            <span className={cn("inline-flex items-center gap-1.5 font-medium", s.badge)}>
              <span aria-hidden className={cn("size-1.5 rounded-full", s.dot)} />
              {s.label}
            </span>
            <span>{date.format(p.createdAt)}</span>
            {p.replies > 0 && (
              <span className="inline-flex items-center gap-1">
                <IconMessage aria-hidden className="size-3" />
                {p.replies}
                <span className="sr-only">{p.replies === 1 ? "reply" : "replies"}</span>
              </span>
            )}
            {p.requester && <span className="truncate">by {p.requester}</span>}
          </span>
        </span>

        <IconChevronDown
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-text-muted transition-transform duration-200 ease-out",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
            className="overflow-hidden"
          >
            {/* Indented to the title, so the detail reads as belonging to it. */}
            <div className="flex flex-col gap-4 px-4 pb-5 sm:pr-5 sm:pl-21">
              {p.details ? (
                <p className="text-[14px]/relaxed whitespace-pre-line text-text-secondary">{p.details}</p>
              ) : (
                <p className="text-[14px] text-text-muted">No details given.</p>
              )}

              {p.images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {p.images.map((img) => (
                    <a
                      key={img.url}
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-xl border border-border transition-opacity duration-150 ease-out hover:opacity-85"
                    >
                      {/* Discord CDN, signed and short-lived: not worth next/image. */}
                      <img src={img.url} alt="" loading="lazy" className="h-28 w-auto max-w-64 object-cover" />
                    </a>
                  ))}
                </div>
              )}

              {p.links.length > 0 && (
                <ul className="flex flex-col gap-1.5">
                  {p.links.map((l) => (
                    <li key={l}>
                      <a
                        href={l}
                        target="_blank"
                        rel="noopener noreferrer nofollow ugc"
                        className="inline-flex max-w-full items-center gap-1.5 text-[13.5px] text-text-secondary transition-colors duration-150 ease-out hover:text-foreground"
                      >
                        <IconLink aria-hidden className="size-3.5 shrink-0" />
                        <span className="truncate">{l.replace(/^https?:\/\//, "")}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-wrap gap-2">
                {p.component && (
                  <Link
                    href={`/components/${p.component.slug}`}
                    className="group inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-[13.5px] font-medium text-background transition-transform duration-150 ease-out active:scale-[0.97]"
                  >
                    Open {p.component.name}
                    <IconArrowRight
                      aria-hidden
                      className="size-3.5 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
                    />
                  </Link>
                )}
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-border px-4 text-[13.5px] font-medium text-text-secondary transition-[color,border-color,scale] duration-150 ease-out hover:border-border-hover hover:text-foreground active:scale-[0.97]"
                >
                  <LogoDiscord className="size-3.5" />
                  Vote or discuss
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

/** Stand-ins for rows, so an empty board still reads as a board. Widths vary
 *  like real titles do; the stack fades out toward the bottom. */
const GHOSTS = [
  ["w-40", "w-64"],
  ["w-52", "w-44"],
  ["w-32", "w-56"],
  ["w-48", "w-36"],
];

function EmptyState({
  query,
  filter,
  hasAny,
  onRequest,
  onReset,
}: {
  query: string;
  /** The status tab in use, when that is what emptied the list. */
  filter: string | null;
  /** Whether the board has any requests at all. */
  hasAny: boolean;
  onRequest: (name?: string) => void;
  onReset: () => void;
}) {
  const narrowed = !!query || !!filter;
  const title = query
    ? `Nothing called “${query}” yet`
    : filter
      ? `Nothing ${filter.toLowerCase()} right now`
      : "No requests yet";
  const body = query
    ? "Nobody has asked for it. Request it and it goes on the board for others to vote on."
    : filter
      ? "Requests move through here as they get picked up. Check back soon."
      : "Tell us what you wish Devigner UI had. Every request goes on this board for others to vote on.";

  return (
    <div className="relative mt-5 min-h-84 overflow-hidden rounded-2xl border border-border bg-background-100">
      <div
        aria-hidden
        className="pointer-events-none flex flex-col mask-[linear-gradient(to_bottom,black,transparent_85%)]"
      >
        {GHOSTS.map(([a, b], i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border px-5 py-3.5">
            <span className="size-12 shrink-0 rounded-xl border border-dashed border-border" />
            <span className="flex flex-col gap-2">
              <span className={cn("h-3 rounded-full bg-surface-hover", a)} />
              <span className={cn("h-2.5 rounded-full bg-surface", b)} />
            </span>
          </div>
        ))}
      </div>

      {/* A soft pool of the card's own colour behind the message, so the ghost
          rows frame it without their lines running through the text. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_55%_60%_at_center,var(--color-background-100)_55%,transparent)] px-6 text-center">
        <span className="grid size-11 place-items-center rounded-2xl border border-border bg-background text-text-secondary shadow-subtle">
          {query ? <IconSearchNormal aria-hidden className="size-5" /> : <IconAdd aria-hidden className="size-5" />}
        </span>
        <p className="mt-4 text-[17px] font-semibold tracking-tight text-balance text-foreground">{title}</p>
        <p className="mt-1.5 max-w-sm text-[14px]/relaxed text-pretty text-text-secondary">{body}</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => onRequest(query || undefined)}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-foreground pr-4.5 pl-3.5 text-[14px] font-medium text-background transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            <IconAdd aria-hidden className="size-4" />
            <span className="max-w-56 truncate">{query ? `Request “${query}”` : "Request a component"}</span>
          </button>
          {narrowed && hasAny ? (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-10 cursor-pointer items-center rounded-full border border-border px-4.5 text-[14px] font-medium text-text-secondary transition-[color,border-color,scale] duration-150 ease-out hover:border-border-hover hover:text-foreground active:scale-[0.97]"
            >
              Show all requests
            </button>
          ) : (
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4.5 text-[14px] font-medium text-text-secondary transition-[color,border-color,scale] duration-150 ease-out hover:border-border-hover hover:text-foreground active:scale-[0.97]"
            >
              <LogoDiscord className="size-4" />
              Join the Discord
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
