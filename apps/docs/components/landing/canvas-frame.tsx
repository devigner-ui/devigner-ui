"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "cn";
import type { CatalogEntry } from "@/lib/catalog-query";

/** Mounts its children once the frame comes within a screen of the viewport,
 *  and unmounts them again once it's three screens away. */
export function LazyMount({
  children,
  fallback,
  root,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Scroll container to observe against, e.g. the hero canvas. */
  root?: React.RefObject<HTMLElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const options = (margin: string) => ({ root: root?.current ?? null, rootMargin: margin });
    const near = new IntersectionObserver(([e]) => e.isIntersecting && setMounted(true), options("100%"));
    const far = new IntersectionObserver(([e]) => !e.isIntersecting && setMounted(false), options("300%"));
    near.observe(el);
    far.observe(el);
    return () => {
      near.disconnect();
      far.disconnect();
    };
  }, [root]);

  return (
    <div ref={ref} className="absolute inset-0">
      {mounted ? children : fallback}
    </div>
  );
}

/** Scales the demo down (never up) until its natural size fits the frame.
 *  offsetWidth ignores transforms, so the measurement stays the natural one.
 *  `viewOnlyBelow`: past that much shrinking the demo's controls fall under a
 *  usable touch target (24px), so it turns into a picture (inert) instead. */
export function FitToStage({
  align,
  className,
  viewOnlyBelow,
  children,
}: {
  align: CatalogEntry["stageAlign"];
  className?: string;
  viewOnlyBelow?: number;
  children: React.ReactNode;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  // Hidden until the first fit, so the demo never paints at full size and
  // then shrinks (a layout shift on every card).
  const [fitted, setFitted] = useState(false);

  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const fit = () => {
      if (!i.offsetWidth || !i.offsetHeight) return;
      // The lazy demo's placeholder is not the real size: wait for the demo.
      if (i.querySelector("[data-demo-loading]")) return;
      setScale(Math.min(1, o.clientWidth / i.offsetWidth, o.clientHeight / i.offsetHeight));
      setFitted(true);
    };
    const observer = new ResizeObserver(fit);
    observer.observe(o);
    observer.observe(i);
    fit();
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={outer}
      className={cn(
        "absolute inset-5 flex justify-center",
        align === "end" ? "items-end" : "items-center",
        className,
      )}
    >
      <div
        ref={inner}
        inert={viewOnlyBelow !== undefined && scale < viewOnlyBelow}
        className="w-max shrink-0"
        style={{
          transform: scale < 1 ? `scale(${scale})` : undefined,
          visibility: fitted ? undefined : "hidden",
          transformOrigin: align === "end" ? "50% 100%" : "50% 50%",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** The design-tool selection: an inset cobalt outline, four square handles
 *  and the frame's measured size. Decorative, so hidden from assistive tech. */
export function SelectionMarks({
  className,
  label = "outside",
}: {
  className?: string;
  /** Where the size label sits: under the frame, or inside its top edge. */
  label?: "outside" | "inside";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<[number, number] | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([e]) =>
      setSize([Math.round(e.contentRect.width), Math.round(e.contentRect.height)]),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handle = "absolute size-2 border-[1.5px] border-brand bg-foreground";
  return (
    <div
      ref={ref}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 z-10 ring-[1.5px] ring-brand ring-inset", className)}
    >
      <span className={cn(handle, "-top-1 -left-1")} />
      <span className={cn(handle, "-top-1 -right-1")} />
      <span className={cn(handle, "-bottom-1 -left-1")} />
      <span className={cn(handle, "-right-1 -bottom-1")} />
      {size && (
        <span
          className={cn(
            "absolute left-1/2 -translate-x-1/2 rounded-md bg-brand px-2 py-0.5 font-mono text-[10.5px] whitespace-nowrap text-brand-foreground",
            label === "outside" ? "-bottom-7" : "top-3",
          )}
        >
          {size[0]} × {size[1]}
        </span>
      )}
    </div>
  );
}
