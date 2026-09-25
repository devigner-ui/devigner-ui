"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { IconCheck, IconCopy, IconTerminal } from "@devigner-ui/icons";
import { cn } from "cn";
import { SPRING_SWAP } from "devignerui/motion";

/** A shell command you can copy. The command stays selectable text, so a
 *  blocked clipboard still leaves the user a way to take it. When the
 *  highlighted token (the slug in `add <slug>`) changes, it rolls in.
 *  `tile` is the squarer chip that sits inside a sentence; `strip` is a
 *  borderless card footer with a labelled copy cell on the right. */
export function CopyCommand({
  command,
  className,
  highlight,
  size = "default",
  variant = "pill",
  step,
}: {
  command: string;
  className?: string;
  /** Trailing token to tint, e.g. the slug in `add <slug>`. */
  highlight?: string;
  size?: "default" | "compact";
  variant?: "pill" | "tile" | "strip";
  /** Tile only: a step number in place of the terminal icon. */
  step?: number;
}) {
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable - the text is still selectable */
    }
  };

  const head =
    highlight && command.endsWith(highlight)
      ? command.slice(0, -highlight.length)
      : command;
  const tile = variant === "tile";
  const strip = variant === "strip";

  return (
    <div
      className={cn(
        "inline-flex min-w-0 items-center gap-3 font-mono font-normal tracking-normal",
        strip
          ? "h-14 pl-6 text-[13px]"
          : tile
            ? "h-11 rounded-xl border border-border bg-linear-to-b from-background-200 to-background-100 px-1.5 text-[13px] shadow-subtle"
            : "rounded-full border border-border bg-background-100 pr-1.5",
        !tile && !strip && (size === "compact" ? "h-10 pl-3.5 text-[12.5px]" : "h-11 pl-4 text-[13px]"),
        className,
      )}
    >
      {tile ? (
        <span
          aria-hidden
          className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand/15 font-sans text-[12.5px] leading-none font-semibold text-brand"
        >
          {step ?? <IconTerminal className="size-4" />}
        </span>
      ) : (
        <span aria-hidden className="text-brand select-none">
          $
        </span>
      )}
      <code
        className={cn(
          "flex min-w-0 overflow-hidden whitespace-pre text-text-secondary",
          strip && "flex-1 pr-4 mask-r-from-85%",
        )}
      >
        <span className="shrink-0">{head}</span>
        {head !== command && (
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={highlight}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: "70%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: "-70%" }}
              transition={SPRING_SWAP}
              className="truncate text-foreground"
            >
              {highlight}
            </motion.span>
          </AnimatePresence>
        )}
      </code>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : `Copy: ${command}`}
        className={cn(
          "ml-auto shrink-0 text-text-secondary transition-colors duration-200 ease-out hover:bg-surface-hover hover:text-foreground",
          strip
            ? "flex items-center gap-2 self-stretch border-l border-border px-5 font-sans text-[13px] font-medium group-hover:text-foreground cursor-pointer"
            : "grid size-8 place-items-center",
          tile && "rounded-lg border border-border",
          !tile && !strip && "rounded-full",
          strip && copied && "text-success group-hover:text-success hover:text-success",
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={copied ? "done" : "copy"}
            initial={reduce ? false : { scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reduce ? undefined : { scale: 0.5, opacity: 0 }}
            transition={SPRING_SWAP}
            className="grid place-items-center"
          >
            {copied ? (
              <IconCheck className="size-4 text-success" />
            ) : (
              <IconCopy className="size-4" />
            )}
          </motion.span>
        </AnimatePresence>
        {/* Both labels share one grid cell, so the button keeps the wider width. */}
        {strip && (
          <span className="grid">
            <span className={cn("col-start-1 row-start-1", copied && "invisible")}>Copy</span>
            <span className={cn("col-start-1 row-start-1", !copied && "invisible")}>Copied</span>
          </span>
        )}
      </button>
    </div>
  );
}
