"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { CommandPalette, type CommandPaletteItem } from "devignerui";
import { EASE_OUT, SPRING_PANEL, SPRING_RETRACT, SPRING_SWAP } from "devignerui/motion";
import {
  IconAddCircle,
  IconClock,
  IconMagnifierGap,
  IconDiamondDivided,
  IconCopy,
  IconGlobal,
  IconMoon,
  IconMonitor,
  IconPalette,
  IconSunLongRays,
} from "@devigner-ui/icons";

/** What the docs Settings panel drives; the gallery demo uses the defaults. */
export const PALETTE_DEFAULTS = {
  hints: true,
  shortcuts: true,
  resetOnSelect: true,
};
export type PaletteConfig = typeof PALETTE_DEFAULTS;

const RECENT: CommandPaletteItem[] = [
  {
    label: "Dynamic Island",
    description: "Overlays",
    group: "Recent",
    icon: <IconClock strokeWidth={2} />,
    action: "Open",
  },
  {
    label: "Date Range Picker",
    description: "Inputs",
    group: "Recent",
    icon: <IconClock strokeWidth={2} />,
    action: "Open",
  },
];

const commands = (shortcuts: boolean, recent: boolean): CommandPaletteItem[] => [
  ...(recent ? RECENT : []),
  {
    label: "Browse components",
    description: "Every component, by category",
    group: "Suggestions",
    icon: <IconDiamondDivided strokeWidth={2} />,
    shortcut: shortcuts ? ["G", "C"] : undefined,
  },
  {
    label: "Request a component",
    description: "Tell us what to build next",
    group: "Suggestions",
    icon: <IconAddCircle strokeWidth={2} />,
    keywords: ["idea", "new"],
    action: "Request",
  },
  {
    label: "Copy install command",
    group: "Suggestions",
    icon: <IconCopy strokeWidth={2} />,
    shortcut: shortcuts ? ["Ctrl", "I"] : undefined,
    action: "Copy",
  },
  {
    label: "Change theme",
    group: "Settings",
    icon: <IconSunLongRays strokeWidth={2} />,
    keywords: ["dark mode", "appearance"],
    items: [
      { label: "Light", icon: <IconSunLongRays strokeWidth={2} /> },
      { label: "Dark", icon: <IconMoon strokeWidth={2} />, keywords: ["night"] },
      { label: "System", icon: <IconMonitor strokeWidth={2} /> },
    ],
  },
  {
    label: "Change accent",
    group: "Settings",
    icon: <IconPalette strokeWidth={2} />,
    items: [{ label: "Cobalt" }, { label: "Mint" }, { label: "Ember" }],
  },
  {
    label: "Language",
    group: "Settings",
    icon: <IconGlobal strokeWidth={2} />,
    items: [{ label: "English" }, { label: "Deutsch" }, { label: "Français" }, { label: "日本語" }],
  },
];

const Key = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-grid h-5 min-w-5 place-items-center rounded-md border border-border bg-background/40 px-1.5 font-mono text-[11px] leading-none text-foreground shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_5%,transparent)]">
    {children}
  </kbd>
);

/** `trigger` puts the palette behind a button and Ctrl/Cmd+K, the way a site
 *  ships it; without it the palette sits open, for the gallery card. */
export default function CommandPaletteDemo({
  trigger = false,
  ...props
}: Partial<PaletteConfig> & { trigger?: boolean }) {
  const { hints, shortcuts, resetOnSelect } = { ...PALETTE_DEFAULTS, ...props };
  const [ran, setRan] = useState<{ label: string; n: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState(true);
  const button = useRef<HTMLButtonElement>(null);
  // The portal needs document.body, which the server render doesn't have.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!trigger) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [trigger]);

  const close = () => {
    setOpen(false);
    button.current?.focus({ preventScroll: true });
  };

  const palette = (
    <CommandPalette
      items={commands(shortcuts, recent)}
      hints={hints}
      resetOnSelect={resetOnSelect}
      autoFocus={trigger}
      onEscape={trigger ? close : undefined}
      groupActions={{ Recent: { label: "Clear", onSelect: () => setRecent(false) } }}
      onSelect={(item) => {
        setRan((r) => ({ label: item.label, n: (r?.n ?? 0) + 1 }));
        if (trigger) close();
      }}
    />
  );

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3">
      {trigger ? (
        <>
          <button
            ref={button}
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            className="flex h-10 w-64 cursor-pointer items-center gap-2 rounded-full border border-border bg-background pr-2 pl-3.5 text-[14px] text-text-muted transition-colors duration-150 ease-out hover:text-foreground hover:bg-foreground/4"
          >
            <IconMagnifierGap strokeWidth={2} className="size-4" />
            <span className="flex-1 text-left">Search or jump to...</span>
            <span className="flex gap-1">
              <Key>Ctrl</Key>
              <Key>K</Key>
            </span>
          </button>
          {mounted && createPortal(
            <AnimatePresence>
              {open && (
                <div
                  className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[15vh]"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Command palette"
                >
                  <motion.div
                    aria-hidden
                    className="absolute inset-0 bg-black/30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: EASE_OUT }}
                    onClick={close}
                  />
                  <motion.div
                    className="relative w-full max-w-md"
                    initial={{ opacity: 0, scale: 0.96, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0, transition: SPRING_PANEL }}
                    exit={{ opacity: 0, scale: 0.98, y: -4, transition: SPRING_RETRACT }}
                  >
                    {palette}
                  </motion.div>
                </div>
              )}
            </AnimatePresence>,
            document.body,
          )}
        </>
      ) : (
        // A fixed size, as big as the full list: when a search or a page
        // shortens or narrows it, the stage would refit the demo to its new size and
        // the palette would jump in scale and position.
        <div className="h-121 w-md max-w-full">{palette}</div>
      )}
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
