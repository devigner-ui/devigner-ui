"use client";

import { useId, useLayoutEffect, useRef } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type MotionValue,
} from "motion/react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type Modifier,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  EASE_OUT,
  INERTIA_THROW,
  SPRING_PANEL,
  SPRING_PRESS,
} from "devignerui/motion";
import { IconArrowUpDown, IconRestart } from "@devigner-ui/icons";
import { cn } from "cn";

/** Where the panel was dropped, kept across component pages so it stays put
 *  while browsing. An offset from its home in the stage's top-right corner,
 *  which sits below the breadcrumb so a wide panel never starts under it. */
let lastOffset = { x: 0, y: 0 };

/** How far back the release speed is read, ms. Older moves are the throw's
 *  wind-up, not its speed; a hand that stopped this long before letting go
 *  drops the panel instead of throwing it. */
const THROW_WINDOW = 90;

/** The least the panel keeps between itself and the canvas edges, px. */
const EDGE_GAP = 8;

/** dnd-kit's restrictToParentElement, held EDGE_GAP inside the canvas. */
const restrictToCanvas: Modifier = ({
  containerNodeRect: box,
  draggingNodeRect: rect,
  transform,
}) => {
  if (!box || !rect) return transform;
  const clamp = (v: number, lo: number, hi: number) =>
    Math.min(Math.max(v, lo), hi);
  return {
    ...transform,
    x: clamp(
      transform.x,
      box.left + EDGE_GAP - rect.left,
      box.right - EDGE_GAP - rect.right,
    ),
    y: clamp(
      transform.y,
      box.top + EDGE_GAP - rect.top,
      box.bottom - EDGE_GAP - rect.bottom,
    ),
  };
};

/** Six dots in two columns: the handle's grip, kept faint. */
function Grip() {
  return (
    <span aria-hidden className="grid grid-cols-2 gap-[2.5px] opacity-50">
      {Array.from({ length: 6 }, (_, i) => (
        <span key={i} className="size-0.5 rounded-full bg-current" />
      ))}
    </span>
  );
}

const ICON_BUTTON =
  "grid size-7 cursor-pointer place-items-center rounded-[9px] text-text-muted outline-none transition-colors duration-200 ease-out hover:bg-foreground/6 hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand/60";

function Panel({
  children,
  wide,
  fit,
  collapsed,
  onCollapse,
  onReset,
  resetSpins,
  offset,
  nodeRef,
  onHint,
  onUnhint,
}: {
  children: React.ReactNode;
  wide?: boolean;
  fit?: boolean;
  collapsed: boolean;
  onCollapse: () => void;
  onReset: () => void;
  resetSpins: number;
  offset: { x: MotionValue<number>; y: MotionValue<number> };
  nodeRef: React.RefObject<HTMLElement | null>;
  onHint: (id: string, el: HTMLElement) => void;
  onUnhint: (now?: boolean) => void;
}) {
  // The dock's own tooltip, opened from here: same delay, look and keycap.
  const hintProps = (id: string) => ({
    onPointerEnter: (e: React.PointerEvent<HTMLElement>) =>
      e.pointerType === "mouse" && onHint(id, e.currentTarget),
    onPointerLeave: () => onUnhint(),
    onPointerDown: () => onUnhint(true),
  });
  const reduce = useReducedMotion();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: "settings-panel" });

  // The resting offset goes on `translate`, the live drag on `transform`.
  // dnd-kit measures the node with its transform removed (it takes the
  // transform to be its own), so an offset kept there read as the panel
  // still sitting in its corner, and the canvas restriction clamped every
  // drag against that corner. Written straight to the node, so a throw
  // glides without re-rendering.
  useLayoutEffect(() => {
    const apply = () => {
      if (nodeRef.current)
        nodeRef.current.style.translate = `${offset.x.get()}px ${offset.y.get()}px`;
    };
    apply();
    const offX = offset.x.on("change", apply);
    const offY = offset.y.on("change", apply);
    return () => {
      offX();
      offY();
    };
  }, [offset, nodeRef]);

  return (
    <section
      ref={(el) => {
        setNodeRef(el);
        nodeRef.current = el;
      }}
      aria-label="Settings"
      data-dragging={isDragging || undefined}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "hud-panel absolute top-19 right-4 z-10 flex flex-col",
        // Rounder once open, where it is a tall card rather than a bar.
        collapsed ? "rounded-[18px]" : "rounded-3xl",
        fit ? "w-max" : wide ? "w-120" : "w-80",
        "max-w-[calc(100%-2rem)]",
      )}
    >
      {/* The lift while dragging lives on an inner layer, so dnd-kit's own
          transform on the section stays untouched. */}
      <motion.div
        initial={false}
        animate={{ scale: isDragging && !reduce ? 1.015 : 1 }}
        transition={SPRING_PRESS}
      >
        <header className="flex h-11 shrink-0 items-center gap-1 pr-2 pl-1.5 select-none">
          <button
            ref={setActivatorNodeRef}
            type="button"
            aria-label="Move settings panel"
            {...listeners}
            {...attributes}
            className={cn(
              "flex h-8 min-w-0 flex-1 touch-none items-center gap-2.5 rounded-[10px] pr-2 pl-2.5 text-text-muted outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
              isDragging ? "cursor-grabbing" : "cursor-grab",
            )}
          >
            <Grip />
            <span className="text-[12.5px] font-medium tracking-[-0.01em] text-foreground">
              Settings
            </span>
          </button>
          <button
            type="button"
            onClick={onReset}
            aria-label="Reset settings"
            {...hintProps("panel-reset")}
            className={ICON_BUTTON}
          >
            <motion.span
              key={resetSpins}
              className="inline-flex"
              initial={{ rotate: 0 }}
              animate={{ rotate: reduce ? 0 : 360 }}
              transition={{ duration: 1, ease: EASE_OUT }}
            >
              <IconRestart strokeWidth={2} className="size-4" />
            </motion.span>
          </button>
          <button
            type="button"
            onClick={onCollapse}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Show settings" : "Hide settings"}
            {...hintProps("panel-fold")}
            className={cn(ICON_BUTTON, "group")}
          >
            {/* As faint as the grip at rest; full strength on hover. */}
            <IconArrowUpDown
              strokeWidth={2}
              className="size-3 opacity-50 transition-opacity duration-200 ease-out group-hover:opacity-100 group-focus-visible:opacity-100"
            />
          </button>
        </header>

        <motion.div
          initial={false}
          animate={{
            height: collapsed ? 0 : "auto",
            opacity: collapsed ? 0 : 1,
          }}
          transition={reduce ? { duration: 0 } : SPRING_PANEL}
          inert={collapsed}
          data-panel-body=""
          className="overflow-hidden"
        >
          <div className="h-px shrink-0 bg-foreground/6" />
          {/* Capped by the viewport (the canvas less the panel's top offset,
              its header and the dock below) instead of by the panel, so the
              fold above only ever clips the list: squeezed by the animating
              height, the list itself overflowed and flashed a scrollbar.
              A container, so rows go two across only on a wide panel. The
              standard scrollbar props are reset so Chrome falls back to
              code-scroll's thin thumb. */}
          {/* A fitted panel skips the container: it would size the list to
              zero and the panel would only fit its header. */}
          <div
            className={cn(
              "code-scroll max-h-[calc(100dvh-15rem)] overflow-y-auto overscroll-contain [scrollbar-color:auto]! scrollbar-auto!",
              !fit && "@container",
            )}
          >
            {children}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

/** The playground's knobs, floating over the preview canvas. Drag it by its
 *  header (or focus the header and use the arrow keys); let go mid-swing and
 *  it is thrown, gliding on until it slows to a stop or meets an edge. It stays
 *  inside the canvas and remembers where it was left. */
export function FloatingSettings(props: {
  children: React.ReactNode;
  wide?: boolean;
  /** Sizes the panel to its content instead of a fixed width. */
  fit?: boolean;
  collapsed: boolean;
  onCollapse: () => void;
  onReset: () => void;
  resetSpins: number;
  onHint: (id: string, el: HTMLElement) => void;
  onUnhint: (now?: boolean) => void;
}) {
  // A stable id, so dnd-kit's screen-reader ids match between server and client.
  const dndId = useId();
  const reduce = useReducedMotion();
  const x = useMotionValue(lastOffset.x);
  const y = useMotionValue(lastOffset.y);
  const offset = useRef({ x, y }).current;
  const node = useRef<HTMLElement | null>(null);
  // Recent drag positions, for the speed at release.
  const trail = useRef<{ t: number; x: number; y: number }[]>([]);

  // Opened near the bottom, it would unfold past the canvas: slide it up as
  // it opens, on the same spring, just far enough to keep the edge gap (and
  // never past the gap at the top).
  const { collapsed } = props;
  const wasCollapsed = useRef(collapsed);
  useLayoutEffect(() => {
    const opened = wasCollapsed.current && !collapsed;
    wasCollapsed.current = collapsed;
    const el = node.current;
    const box = el?.parentElement?.getBoundingClientRect();
    const body = el?.querySelector<HTMLElement>("[data-panel-body]");
    if (!opened || !el || !box || !body) return;
    const rect = el.getBoundingClientRect();
    // Its height once open: the panel now, less the folded body, plus all
    // of the body's content (the body has not started to grow yet).
    const content = Array.from(body.children).reduce(
      (h, c) => h + (c as HTMLElement).offsetHeight,
      0,
    );
    const over =
      rect.bottom - body.offsetHeight + content - (box.bottom - EDGE_GAP);
    const lift = Math.min(over, rect.top - (box.top + EDGE_GAP));
    if (lift <= 0) return;
    y.stop();
    animate(y, y.get() - lift, {
      ...(reduce ? { duration: 0 } : SPRING_PANEL),
      onComplete: () => (lastOffset = { x: x.get(), y: y.get() }),
    });
  }, [collapsed, reduce, x, y]);

  const sensors = useSensors(
    // A few pixels of travel before a drag starts, so a click on the handle
    // stays a click.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );
  const onDragStart = () => {
    // Catching it mid-glide holds it where it is.
    x.stop();
    y.stop();
    trail.current = [];
  };
  const onDragMove = ({ delta }: DragMoveEvent) => {
    const now = performance.now();
    trail.current.push({ t: now, x: delta.x, y: delta.y });
    while (trail.current.length > 2 && now - trail.current[0].t > THROW_WINDOW)
      trail.current.shift();
  };
  const onDragEnd = ({ delta, activatorEvent }: DragEndEvent) => {
    const from = { x: x.get() + delta.x, y: y.get() + delta.y };
    // Still under dnd-kit's transform here, so this is where it was let go.
    const rect = node.current?.getBoundingClientRect();
    const box = node.current?.parentElement?.getBoundingClientRect();
    x.set(from.x);
    y.set(from.y);
    lastOffset = from;

    const now = performance.now();
    const moves = trail.current.filter((m) => now - m.t <= THROW_WINDOW);
    if (
      reduce ||
      activatorEvent instanceof KeyboardEvent ||
      moves.length < 2 ||
      !rect ||
      !box
    )
      return;
    const a = moves[0];
    const b = moves[moves.length - 1];
    const dt = Math.max(b.t - a.t, 1) / 1000;
    // The canvas edges as offsets: how far it may go before its rect meets
    // the canvas's.
    const edges = {
      x: {
        min: box.left + EDGE_GAP - rect.left + from.x,
        max: box.right - EDGE_GAP - rect.right + from.x,
      },
      y: {
        min: box.top + EDGE_GAP - rect.top + from.y,
        max: box.bottom - EDGE_GAP - rect.bottom + from.y,
      },
    };
    const glide = (
      axis: "x" | "y",
      value: MotionValue<number>,
      velocity: number,
    ) =>
      // Inertia reads only the first keyframe and finds its own end, but
      // Motion drops an animation whose keyframes match (unless it is a
      // spring), so the second one is just the direction of travel.
      animate(value, [from[axis], from[axis] + velocity], {
        ...INERTIA_THROW,
        velocity,
        // Stop at the canvas edge: the glide eases into it instead of
        // springing back off it, which on a hard throw carried the panel
        // tens of pixels under the canvas's clipped edge.
        modifyTarget: (to: number) =>
          Math.min(Math.max(to, edges[axis].min), edges[axis].max),
        onComplete: () => (lastOffset = { x: x.get(), y: y.get() }),
      });
    glide("x", x, (b.x - a.x) / dt);
    glide("y", y, (b.y - a.y) / dt);
  };

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      modifiers={[restrictToCanvas]}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            "To move the settings panel, press space or enter, use the arrow keys, then press space or enter again to drop it. Escape cancels.",
        },
        announcements: {
          onDragStart: () => "Picked up the settings panel.",
          onDragMove: () => undefined,
          onDragOver: () => undefined,
          onDragEnd: () => "Dropped the settings panel.",
          onDragCancel: () =>
            "Moving cancelled. The settings panel is back where it was.",
        },
      }}
    >
      <Panel {...props} offset={offset} nodeRef={node} />
    </DndContext>
  );
}
