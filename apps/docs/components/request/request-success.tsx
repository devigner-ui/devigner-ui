"use client";

import { motion, useReducedMotion } from "motion/react";
import { IconCheck } from "@devigner-ui/icons";
import { SPRING_SWAP } from "devignerui/motion";
import { LogoDiscord, REQUESTS_URL } from "../brand-logos";

/** The confirmation the form hands over to: one mark, one line, one way on.
 *  The mark arrives after the panel has started to land, so the eye goes
 *  panel, then tick, then words. */
export function RequestSuccess({ name, onClose }: { name: string; onClose: () => void }) {
  const reduce = useReducedMotion();
  const pop = (delay: number) =>
    reduce
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.15 } }
      : {
          initial: { opacity: 0, scale: 0.6 },
          animate: { opacity: 1, scale: 1 },
          transition: { ...SPRING_SWAP, delay },
        };

  return (
    <div className="flex flex-col items-center px-6 pt-9 pb-6 text-center sm:px-7">
      <motion.span
        {...pop(0.06)}
        className="grid size-20 place-items-center rounded-full bg-success/12 ring-1 ring-success/20"
      >
        <motion.span {...pop(0.14)} className="grid place-items-center">
          <IconCheck aria-hidden className="size-9 text-success" strokeWidth={2.5} />
        </motion.span>
      </motion.span>

      <h2 className="mt-6 text-[20px] font-semibold tracking-tight text-foreground">
        Request sent
      </h2>
      <p className="mt-2 max-w-xs text-[14.5px]/relaxed text-pretty text-text-secondary">
        <span className="font-medium text-foreground">&ldquo;{name}&rdquo;</span> is on the
        board as Pending. We&apos;ll reply in its Discord post if we have questions.
      </p>

      <div className="mt-7 flex w-full flex-col gap-2">
        <a
          href={REQUESTS_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-autofocus
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-foreground text-[14.5px] font-medium text-background transition-transform duration-150 ease-out active:scale-[0.98]"
        >
          <LogoDiscord className="size-4" />
          Follow it in Discord
        </a>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-full border border-border text-[14.5px] font-medium text-text-secondary transition-[color,border-color,scale] duration-150 ease-out hover:border-border-hover hover:text-foreground active:scale-[0.98]"
        >
          Close
        </button>
      </div>
    </div>
  );
}
