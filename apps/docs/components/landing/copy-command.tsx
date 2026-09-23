"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { IconCheck, IconCopy } from "@devigner-ui/icons";
import { cn } from "cn";
import { SPRING_SWAP } from "@devignerui/ui/motion";

/** A shell command you can copy. The command stays selectable text, so a
 *  blocked clipboard still leaves the user a way to take it. */
export function CopyCommand({
  command,
  className,
  highlight,
}: {
  command: string;
  className?: string;
  /** Trailing token to tint, e.g. the slug in `add <slug>`. */
  highlight?: string;
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

  return (
    <div
      className={cn(
        "flex h-11 min-w-0 items-center gap-3 rounded-full border border-border bg-background-100 pr-1.5 pl-4 font-mono text-[13px]",
        className,
      )}
    >
      <span aria-hidden className="text-brand select-none">
        $
      </span>
      <code className="min-w-0 truncate text-text-secondary">
        {head}
        {head !== command && <span className="text-foreground">{highlight}</span>}
      </code>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : `Copy: ${command}`}
        className="ml-auto grid size-8 shrink-0 place-items-center rounded-full text-text-secondary transition-colors duration-200 hover:bg-surface-hover hover:text-foreground"
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
      </button>
    </div>
  );
}
