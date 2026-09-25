"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { IconCheck, IconCopy } from "@devigner-ui/icons";
import { SPRING_LAYOUT, SPRING_SWAP } from "devignerui/motion";
import { cn } from "cn";
import type { ComponentData } from "@/lib/registry";
import { CodeBlock } from "../code-block";
import { CopyCommand } from "../landing/copy-command";

const TABS = ["Install", "Usage", "Props", "Notes"] as const;
type Tab = (typeof TABS)[number];

/** "Magnetic Button" keeps "Button" for the accent; one-word names get none. */
function Title({ name }: { name: string }) {
  const cut = name.lastIndexOf(" ");
  if (cut < 0) return <>{name}</>;
  return (
    <>
      {name.slice(0, cut)} <span className="accent-word">{name.slice(cut + 1)}</span>
    </>
  );
}

const added = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-8 mb-3 text-[20px] leading-tight font-semibold tracking-[-0.04em] text-foreground">
      {children}
    </h2>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mt-6 mb-2.5 font-mono text-[11.5px] text-text-muted">{children}</p>;
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md bg-surface px-1.5 py-0.5 font-mono text-[12.5px] text-foreground">
      {children}
    </code>
  );
}

/** A code figure with a labelled Copy in its corner. */
function CodeFigure({ code }: { code: string }) {
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <figure className="relative overflow-hidden rounded-xl border border-border">
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => setCopied(false), 1800);
          } catch {
            /* clipboard unavailable - the code is still selectable */
          }
        }}
        className="absolute top-2 right-2 z-10 inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-background px-2.5 text-[12px] font-medium text-text-secondary transition-colors duration-200 ease-out hover:text-foreground"
      >
        <motion.span
          key={copied ? "done" : "copy"}
          initial={reduce ? false : { scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={SPRING_SWAP}
          className="grid place-items-center"
        >
          {copied ? (
            <IconCheck aria-hidden className="size-3.5 text-success" />
          ) : (
            <IconCopy aria-hidden className="size-3.5" />
          )}
        </motion.span>
        {copied ? "Copied" : "Copy"}
      </button>
      <div className="p-1.5">
        <div className="overflow-hidden rounded-lg">
          <CodeBlock code={code} lang="tsx" />
        </div>
      </div>
    </figure>
  );
}

/** The Docs panel: header, then Install / Usage / Props / Notes tabs. */
export function Inspector({
  meta,
  isNew,
  categoryLabel,
  usage,
  onOpenCode,
}: {
  meta: ComponentData;
  isNew: boolean;
  categoryLabel: string;
  usage: string;
  onOpenCode: () => void;
}) {
  const [tab, setTab] = useState<Tab>("Install");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const reduce = useReducedMotion();
  const file = `${meta.slug}.tsx`;
  const deps = meta.dependencies.filter((d) => d !== "react");

  // WAI-ARIA tabs: arrows move between tabs and select them.
  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    const to =
      e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : null;
    if (to === null) return;
    e.preventDefault();
    const next = (to + TABS.length) % TABS.length;
    setTab(TABS[next]);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="flex flex-col pb-32 lg:pb-12">
      <p className="flex items-center gap-2.5 font-mono text-[11.5px] text-text-muted">
        {isNew && (
          <span className="rounded-full bg-brand/15 px-2 py-0.5 font-sans text-[11px] font-medium text-brand">
            New
          </span>
        )}
        {categoryLabel} · added {added(meta.addedAt)}
      </p>
      <h1 className="mt-3 text-[38px] leading-[1.04] font-semibold tracking-tighter text-balance text-foreground">
        <Title name={meta.name} />
      </h1>
      <p className="mt-3 text-[14.5px]/relaxed text-pretty text-text-secondary">
        {meta.description}
      </p>

      <div
        role="tablist"
        aria-label="Documentation"
        className="mt-5 flex w-fit gap-1 rounded-full border border-border p-0.75"
      >
        {TABS.map((t, i) => (
          <button
            key={t}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`doc-tab-${t}`}
            aria-selected={tab === t}
            aria-controls={`doc-panel-${t}`}
            tabIndex={tab === t ? 0 : -1}
            onClick={() => setTab(t)}
            onKeyDown={(e) => onTabKey(e, i)}
            className={cn(
              "relative h-7 cursor-pointer rounded-full px-3 text-[12.5px] transition-colors duration-200 ease-out",
              tab === t ? "text-foreground" : "text-text-muted hover:text-text-secondary",
            )}
          >
            {tab === t && (
              <motion.span
                layoutId="doc-tab-pill"
                transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
                className="absolute inset-0 rounded-full bg-surface-hover"
              />
            )}
            <span className="relative">{t}</span>
          </button>
        ))}
      </div>

      {/* Every panel is in the page, inactive ones hidden, so search engines
          and AI crawlers read usage, props and notes, not just Install. */}
      <div>
        <div
          id="doc-panel-Install"
          role="tabpanel"
          aria-labelledby="doc-tab-Install"
          hidden={tab !== "Install"}
        >
            <H2>
              Install it in <span className="accent-word">one</span> line
            </H2>
            <CopyCommand
              command={`npx devignerui add ${meta.slug}`}
              highlight={meta.slug}
              className="w-full"
            />
            <p className="mt-3 text-[13.5px]/relaxed text-text-secondary">
              Writes <Mono>components/ui/{file}</Mono> and lists what it needs.
            </p>

            <Label>First time here</Label>
            <CopyCommand command="npx devignerui init" highlight="init" className="w-full" />

            <Label>Or by hand</Label>
            <ol className="flex list-decimal flex-col gap-3 pl-5 text-[13.5px]/relaxed text-text-secondary marker:font-mono marker:text-[12px] marker:text-text-muted">
              <li>Needs React 18+ and Tailwind CSS v4.</li>
              {deps.length > 0 && (
                <li>
                  <p className="mb-2">Install the dependencies.</p>
                  <CopyCommand
                    command={`npm i ${deps.join(" ")}`}
                    size="compact"
                    className="w-full"
                  />
                </li>
              )}
              <li>
                Paste the source from{" "}
                <button
                  type="button"
                  onClick={onOpenCode}
                  className="cursor-pointer font-medium text-foreground underline decoration-border-hover underline-offset-4 transition-colors duration-200 ease-out hover:decoration-foreground"
                >
                  Code
                </button>{" "}
                into <Mono>components/ui/{file}</Mono>.
              </li>
            </ol>
        </div>

        <div
          id="doc-panel-Usage"
          role="tabpanel"
          aria-labelledby="doc-tab-Usage"
          hidden={tab !== "Usage"}
        >
            <H2>Usage</H2>
            <CodeFigure code={usage} />
            {meta.customUsage && (
              <>
                <h3 className="mt-7 mb-3 text-[15px] font-semibold tracking-[-0.02em] text-foreground">
                  Custom composition
                </h3>
                <CodeFigure code={meta.customUsage} />
              </>
            )}
        </div>

        <div
          id="doc-panel-Props"
          role="tabpanel"
          aria-labelledby="doc-tab-Props"
          hidden={tab !== "Props"}
        >
            <H2>
              Every <span className="accent-word">prop</span>
            </H2>
            <div className="overflow-hidden rounded-xl border border-border">
              {meta.props.map((p, i) => (
                <div key={p.name} className={cn("px-4 py-3", i > 0 && "border-t border-border")}>
                  <div className="flex items-baseline justify-between gap-3">
                    <code className="font-mono text-[13px] font-medium text-foreground">
                      {p.name}
                    </code>
                    <code className="max-w-40 truncate font-mono text-[12.5px] text-text-secondary">
                      {p.default && p.default !== "-" ? p.default : "-"}
                    </code>
                  </div>
                  <code className="mt-1 block font-mono text-[12px] wrap-break-word text-text-muted">
                    {p.type}
                  </code>
                  <p className="mt-1.5 text-[13.5px]/relaxed text-text-secondary">
                    {p.description}
                  </p>
                </div>
              ))}
            </div>
        </div>

        <div
          id="doc-panel-Notes"
          role="tabpanel"
          aria-labelledby="doc-tab-Notes"
          hidden={tab !== "Notes"}
        >
            <H2>Notes</H2>
            {meta.notes && meta.notes.length > 0 && (
              <ul className="mb-6 flex list-disc flex-col gap-3 pl-5 text-[14px]/relaxed text-text-secondary marker:text-text-muted">
                {meta.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            )}
            <p className="text-[14px]/relaxed text-text-secondary">
              It&apos;s your code now. Edit it however you like. If something breaks in
              your setup, the{" "}
              <Link
                href="/components"
                className="font-medium text-foreground underline decoration-border-hover underline-offset-4 transition-colors duration-200 ease-out hover:decoration-foreground"
              >
                registry
              </Link>{" "}
              has the latest version.
            </p>
            <p className="mt-4 text-[14px]/relaxed text-text-secondary">
              Some of these designs take cues from interfaces we&apos;ve admired around the
              web. If one started as your idea and you&apos;d like credit, message us on{" "}
              <a
                href="https://x.com/devignerui"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-foreground underline decoration-border-hover underline-offset-4 transition-colors duration-200 ease-out hover:decoration-foreground"
              >
                X @devignerui
              </a>{" "}
              and we&apos;ll add it.
            </p>
        </div>
      </div>
    </div>
  );
}
