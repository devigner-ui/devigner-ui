"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ContextMenu, type ContextMenuEntry } from "devignerui";
import { SPRING_SWAP } from "devignerui/motion";
import {
  IconArchive,
  IconCopyOverlap,
  IconEditUnderline,
  IconArrowOutUpRightSquare,
  IconFolder,
  IconInbox,
  IconLinkDiagonal,
  IconStar,
  IconTrashBinHandleLines,
} from "@devigner-ui/icons";

/** What the docs Settings panel drives; the gallery demo uses the defaults. */
export const CONTEXT_DEFAULTS = {
  icons: true,
  shortcuts: true,
  disabled: false,
};
export type ContextConfig = typeof CONTEXT_DEFAULTS;

const entries = (icons: boolean, shortcuts: boolean): ContextMenuEntry[] => {
  const i = (node: React.ReactNode) => (icons ? node : undefined);
  const k = (keys: string[]) => (shortcuts ? keys : undefined);
  return [
    { label: "Open", icon: i(<IconArrowOutUpRightSquare variant="Bold" />), shortcut: k(["Enter"]) },
    { label: "Rename", icon: i(<IconEditUnderline variant="Bold" />), shortcut: k(["F2"]) },
    { label: "Duplicate", icon: i(<IconCopyOverlap variant="Bold" />), shortcut: k(["Ctrl", "D"]) },
    { label: "Copy link", icon: i(<IconLinkDiagonal variant="Bold" />) },
    {
      label: "Move to",
      icon: i(<IconFolder variant="Bold" />),
      items: [
        { label: "Inbox", icon: i(<IconInbox variant="Bold" />) },
        { label: "Archive", icon: i(<IconArchive variant="Bold" />) },
        { label: "Favorites", icon: i(<IconStar variant="Bold" />) },
      ],
    },
    "separator",
    { label: "Delete", icon: i(<IconTrashBinHandleLines variant="Bold" />), destructive: true, shortcut: k(["Del"]) },
  ];
};

export default function ContextMenuDemo(props: Partial<ContextConfig>) {
  const { icons, shortcuts, disabled } = { ...CONTEXT_DEFAULTS, ...props };
  const [ran, setRan] = useState<{ label: string; n: number } | null>(null);
  return (
    <div className="flex flex-col items-center gap-3">
      <ContextMenu
        items={entries(icons, shortcuts)}
        disabled={disabled}
        label="File actions"
        onSelect={(item) => setRan((r) => ({ label: item.label, n: (r?.n ?? 0) + 1 }))}
      >
        <div
          tabIndex={0}
          aria-label="hero-final.fig. Right-click or press Shift F10 for actions."
          className="hud-panel flex w-64 cursor-context-menu flex-col gap-3 rounded-3xl p-2 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="grid h-28 place-items-center rounded-2xl border border-border bg-background/70 shadow-[inset_0_1px_2px_oklch(0%_0_0/0.08)]">
            <span aria-hidden className="font-mono text-[11.5px] text-foreground">
              Right Click Here
            </span>
          </div>
          <div className="flex flex-col gap-0.5 px-2 pb-1.5">
            <span className="text-[13px] font-medium tracking-[-0.01em]">hero-final.fig</span>
            <span className="font-mono text-[11.5px] text-text-muted">right-click, or hold on touch</span>
          </div>
        </div>
      </ContextMenu>
      <p className="relative h-5 text-[13px] text-text-muted" aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          {ran && (
            <motion.span
              key={ran.n}
              initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
              transition={SPRING_SWAP}
              className="block"
            >
              Ran <span className="font-medium text-foreground">{ran.label}</span>
            </motion.span>
          )}
        </AnimatePresence>
      </p>
    </div>
  );
}
