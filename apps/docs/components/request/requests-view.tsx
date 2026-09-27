"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { IconAdd, IconClose } from "@devigner-ui/icons";
import { EASE_OUT, SPRING_LAYOUT, SPRING_RETRACT } from "devignerui/motion";
import { cn } from "cn";
import type { RequestPost } from "@/lib/requests";
import { SOUND_KEY, cue, setEnabled } from "@/lib/sound";
import { RequestBoard } from "./request-board";
import { RequestForm } from "./request-form";
import { RequestSuccess } from "./request-success";
import { useModal } from "./use-modal";

/** Content arrives out of a blur once the shell has started to grow, and
 *  leaves fast so the shell can fold back without dragging it along. */
const BLUR_IN = {
  initial: { opacity: 0, filter: "blur(8px)" },
  animate: {
    opacity: 1,
    filter: "blur(0px)",
    transition: { delay: 0.08, duration: 0.28, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    filter: "blur(8px)",
    transition: { duration: 0.1, ease: EASE_OUT },
  },
};

/** The requests page: heading, board and the new-request panel. The header's
 *  "Request a component" button morphs into the panel: the shell grows into
 *  the card and the label slides up into its title; closing folds it back.
 *  `?new` opens it on arrival (and `?name=` prefills it), which is how the
 *  corner pill, the catalog, the dock panel and the old /request URL link in. */
export function RequestsView({ posts, ok }: { posts: RequestPost[]; ok: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  // Remounts the form, so a reopened panel starts clean.
  const [session, setSession] = useState(0);
  // Set once a request lands: the panel swaps the form for the note.
  const [sent, setSent] = useState<string | null>(null);
  // Whether this opening grows out of the header button. Not when it is
  // scrolled away (the board's own request button): a panel flying in from
  // off-screen reads as a glitch, so that one rises in place instead.
  const [morph, setMorph] = useState(false);
  const trigger = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // Sound follows the choice made with the details page's dock toggle, on
  // unless turned off there, and only while this page is open.
  useEffect(() => {
    let on = true;
    try {
      on = localStorage.getItem(SOUND_KEY) !== "off";
    } catch {}
    setEnabled(on);
    return () => setEnabled(false);
  }, []);

  const request = useCallback((prefill?: string) => {
    setName(prefill ?? "");
    setSent(null);
    setSession((n) => n + 1);
    const r = trigger.current?.getBoundingClientRect();
    setMorph(!!r && r.bottom > 0 && r.top < window.innerHeight);
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!params.has("new")) return;
    request(params.get("name")?.slice(0, 80) ?? undefined);
    // Drop the query so a refresh or Back does not reopen it.
    router.replace(pathname, { scroll: false });
  }, [params, pathname, router, request]);

  const close = useCallback(() => {
    cue("droplet");
    setOpen(false);
  }, []);
  useModal(open, close, panel);

  // Focus the first field, or the success note's marked button, as each view
  // lands. Not the close button: the form is what was asked for.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() =>
      panel.current
        ?.querySelector<HTMLElement>("[data-autofocus], input, textarea")
        ?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(id);
  }, [open, sent]);

  // A morph remounts the header button, so the focus useModal hands back
  // lands on a detached node; give it to the new button instead.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open) wasOpen.current = true;
    else if (wasOpen.current && morph && !reduce)
      trigger.current?.querySelector("button")?.focus({ preventScroll: true });
  }, [open, morph, reduce]);

  // Shared ids only for a morph; otherwise button and panel stay strangers.
  const shell = morph && !reduce ? "request-shell" : undefined;
  const label = morph && !reduce ? "request-label" : undefined;
  // Without a morph the panel rises a little and fades; reduced motion only fades.
  const plain = shell
    ? {}
    : {
        initial: { opacity: 0, y: reduce ? 0 : 12 },
        animate: {
          opacity: 1,
          y: 0,
          transition: reduce ? { duration: 0.15 } : SPRING_LAYOUT,
        },
        exit: {
          opacity: 0,
          y: reduce ? 0 : 8,
          transition: { duration: 0.12, ease: EASE_OUT },
        },
      };

  const known = useMemo(
    () =>
      posts.map((p) => ({
        title: p.title,
        url: p.url,
        votes: p.votes,
        built: p.status === "published",
      })),
    [posts],
  );
  const built = posts.filter((p) => p.status === "published").length;

  return (
    <>
      <div className="flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[clamp(2.25rem,4.5vw,3.25rem)] leading-[1.04] font-semibold tracking-[-0.055em] text-balance text-foreground">
            Component <span className="accent-word">requests</span>
          </h1>
          <p className="mt-5 max-w-lg text-[17px]/7 text-pretty text-text-secondary">
            Ask for what you&apos;re missing and vote on what others asked for.
            The most wanted get built first.
          </p>
          {ok && posts.length > 0 && (
            <p className="mt-4 text-[13.5px] text-text-muted">
              <span className="font-medium text-foreground tabular-nums">{posts.length}</span>{" "}
              {posts.length === 1 ? "request" : "requests"},{" "}
              <span className="font-medium text-foreground tabular-nums">{built}</span> built so far
            </p>
          )}
        </div>
        {/* The slot keeps the button's size while the button itself is off
            being the panel, so the heading does not reflow under it. */}
        <span ref={trigger} className="relative inline-flex shrink-0 self-start sm:self-auto">
          <span
            aria-hidden
            className="invisible inline-flex h-11 items-center gap-2 pr-5 pl-4 text-[14.5px] font-medium whitespace-nowrap"
          >
            <IconAdd className="size-4.5" />
            Request a component
          </span>
          <AnimatePresence initial={false}>
            {!(open && shell) && (
              <motion.button
                key="pill"
                type="button"
                onClick={() => request()}
                aria-haspopup="dialog"
                layoutId={shell}
                transition={SPRING_RETRACT}
                // Half its height, not 999: the radius tweens with the morph,
                // and 999 on a panel-sized box reads as an ellipse.
                style={{ borderRadius: 22 }}
                className="absolute inset-0 inline-flex cursor-pointer items-center gap-2 bg-foreground pr-5 pl-4 text-[14.5px] font-medium whitespace-nowrap text-background transition-[scale] duration-150 ease-out active:scale-[0.97]"
              >
                {/* layout: counter-scaled while the shell morphs, so it keeps its shape. */}
                <motion.span layout={!!shell} className="grid place-items-center">
                  <IconAdd aria-hidden className="size-4.5" />
                </motion.span>
                <motion.span layoutId={label} transition={SPRING_RETRACT}>
                  Request a component
                </motion.span>
              </motion.button>
            )}
          </AnimatePresence>
        </span>
      </div>

      {ok ? (
        <RequestBoard posts={posts} onRequest={request} />
      ) : (
        <p className="mt-12 rounded-2xl border border-dashed border-border px-6 py-12 text-center text-[15px] text-text-secondary">
          The board can&apos;t be loaded right now. Requests still go through.
        </p>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            aria-hidden
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2, ease: EASE_OUT } }}
            exit={{ opacity: 0, transition: { duration: 0.15, ease: EASE_OUT } }}
            className="fixed inset-0 z-90 bg-black/45 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      {/* A card over the bottom edge on phones, centred from sm up. */}
      <div className="pointer-events-none fixed inset-0 z-91 flex items-end justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-6">
        <AnimatePresence>
          {open && (
            <motion.div
              key="panel"
              ref={panel}
              layoutId={shell}
              transition={SPRING_LAYOUT}
              {...plain}
              role="dialog"
              aria-modal="true"
              aria-label={sent ? "Request sent" : "Request a component"}
              style={{ borderRadius: 28 }}
              className={cn(
                "pointer-events-auto flex max-h-[min(88dvh,760px)] w-full flex-col overflow-hidden border border-border bg-background shadow-elevated",
                sent ? "sm:max-w-sm" : "sm:max-w-xl",
              )}
            >
              {!sent && (
                <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border py-3 pr-3 pl-6 sm:pl-7">
                  <motion.h2
                    layoutId={label}
                    transition={SPRING_LAYOUT}
                    className="text-[17px] font-semibold tracking-tight whitespace-nowrap text-foreground"
                  >
                    Request a component
                  </motion.h2>
                  <motion.button
                    type="button"
                    onClick={close}
                    aria-label="Close"
                    {...(shell ? BLUR_IN : {})}
                    className="grid size-9 cursor-pointer place-items-center rounded-full text-text-muted transition-[color,background-color,scale] duration-150 ease-out hover:bg-surface hover:text-foreground active:scale-[0.94]"
                  >
                    <IconClose aria-hidden className="size-4.5" />
                  </motion.button>
                </div>
              )}
              <motion.div
                key={sent ? "sent" : "form"}
                {...(reduce ? {} : BLUR_IN)}
                className="flex min-h-0 flex-1 flex-col"
              >
                {sent ? (
                  <RequestSuccess name={sent} onClose={close} />
                ) : (
                  <RequestForm
                    key={session}
                    initialName={name}
                    known={known}
                    onSent={(title) => {
                      setSent(title);
                      // The route already busted the board's cache; this re-renders it.
                      router.refresh();
                    }}
                  />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
