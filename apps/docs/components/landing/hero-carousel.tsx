"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { COMPONENT_PREVIEWS } from "./component-previews";

const N = COMPONENT_PREVIEWS.length;

// Waypoints for a 3D coverflow: each card spawns far above (small, distant,
// invisible), sweeps down through the focal center (biggest, closest,
// fully opaque, slightly left-and-above true center), then sweeps out to
// the right and dissolves. translate3d() percentages are relative to the
// CARD'S OWN box (not the container), so - unlike a container-relative
// layout - no container width/height ever needs to be measured; `left-1/2
// top-1/2` anchors every card to the same point and these offsets do the
// rest. Values are authored off a real reverse-engineered reference
// (tasteskill.dev's hero carousel), not a symmetric formula: the vertical
// approach travels much further than the horizontal exit, matching how
// that reference actually moves.
type Waypoint = {
  x: number; // translateX, % of card's own width
  y: number; // translateY, % of card's own height
  z: number; // translateZ, px
  rx: number; // rotateX, deg
  ry: number; // rotateY, deg
  scale: number;
  opacity: number;
};

const SPAWN: Waypoint = {
  x: -60,
  y: -380,
  z: -700,
  rx: 4,
  ry: -3,
  scale: 0.4,
  opacity: 0,
};
const FOCUS: Waypoint = {
  x: -53,
  y: -35,
  z: 180,
  rx: 2,
  ry: 0,
  scale: 1.15,
  opacity: 1,
};
const EXIT: Waypoint = {
  x: 190,
  y: 20,
  z: -400,
  rx: 4,
  ry: 3,
  scale: 0.4,
  opacity: 0,
};

// Uniform Catmull-Rom: passes through p1 (s=0) and p2 (s=1) with matched,
// nonzero tangents = (p2-p0)/2 and (p3-p1)/2. Unlike smoothstep/lerp, it
// never stalls velocity at a waypoint.
const cr = (p0: number, p1: number, p2: number, p3: number, s: number) => {
  const s2 = s * s;
  const s3 = s2 * s;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * s +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * s2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * s3)
  );
};

const crWaypoint = (
  p0: Waypoint,
  p1: Waypoint,
  p2: Waypoint,
  p3: Waypoint,
  s: number,
): Waypoint => ({
  x: cr(p0.x, p1.x, p2.x, p3.x, s),
  y: cr(p0.y, p1.y, p2.y, p3.y, s),
  z: cr(p0.z, p1.z, p2.z, p3.z, s),
  rx: cr(p0.rx, p1.rx, p2.rx, p3.rx, s),
  ry: cr(p0.ry, p1.ry, p2.ry, p3.ry, s),
  scale: cr(p0.scale, p1.scale, p2.scale, p3.scale, s),
  opacity: cr(p0.opacity, p1.opacity, p2.opacity, p3.opacity, s),
});

// Cyclic Catmull-Rom over [SPAWN, FOCUS, EXIT]. Tangent at FOCUS is identical
// from both sides ((EXIT-SPAWN)/2), so a card sweeps THROUGH focus at speed
// instead of stopping. The EXIT↔SPAWN seam is invisible (opacity 0 both ends).
const pathPoint = (t: number): Waypoint =>
  t < 0.5
    ? crWaypoint(EXIT, SPAWN, FOCUS, EXIT, t / 0.5)
    : crWaypoint(SPAWN, FOCUS, EXIT, SPAWN, (t - 0.5) / 0.5);

const AUTOPLAY_SPEED = 0.05; // laps/s - one full pass every ~20s
const DRAG_LAPS_PER_PX = 0.0016;

export function HeroCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let globalT = 0;
    let velocity = reduce ? 0 : AUTOPLAY_SPEED;
    let dragging = false;
    let pointerId: number | null = null;
    let dragStartY = 0;
    let dragStartT = 0;
    let lastDragY = 0;
    let lastDragAt = 0;
    let dragVelocity = 0;
    let releaseTween: gsap.core.Tween | null = null;

    const wrap1 = (v: number) => ((v % 1) + 1) % 1;

    const render = () => {
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const t = wrap1(globalT + i / N);
        const w = pathPoint(t);
        el.style.transform = `translate3d(${w.x}%, ${w.y}%, ${w.z}px) rotateX(${w.rx}deg) rotateY(${w.ry}deg) scale(${w.scale})`;
        el.style.opacity = String(Math.max(0, w.opacity));
        // Triangle wave peaking at t=0.5 - stacking order follows presence,
        // independent of the exact opacity/scale curve shape above.
        const front = 1 - Math.abs(t - 0.5) * 2;
        el.style.zIndex = String(Math.round(front * 100));
      });
    };

    let raf = 0;
    let lastFrameAt = performance.now();
    const tick = (now: number) => {
      const dt = (now - lastFrameAt) / 1000;
      lastFrameAt = now;
      if (!dragging) globalT = wrap1(globalT + velocity * dt);
      render();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onPointerDown = (e: PointerEvent) => {
      if (pointerId !== null) return; // ignore a second touch mid-drag
      pointerId = e.pointerId;
      container.setPointerCapture(pointerId);
      dragging = true;
      releaseTween?.kill();
      dragStartY = e.clientY;
      dragStartT = globalT;
      lastDragY = e.clientY;
      lastDragAt = performance.now();
      dragVelocity = 0;
      container.style.cursor = "grabbing";
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging || e.pointerId !== pointerId) return;
      const dy = e.clientY - dragStartY;
      globalT = wrap1(dragStartT + dy * DRAG_LAPS_PER_PX);
      const now = performance.now();
      const dt = now - lastDragAt;
      if (dt > 0) {
        dragVelocity =
          (((e.clientY - lastDragY) * DRAG_LAPS_PER_PX) / dt) * 1000;
      }
      lastDragY = e.clientY;
      lastDragAt = now;
    };

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      pointerId = null;
      container.style.cursor = "grab";
      if (reduce) {
        velocity = 0;
        return;
      }
      // Momentum from the flick, easing back into the ambient drift.
      const obj = { v: dragVelocity };
      releaseTween = gsap.to(obj, {
        v: AUTOPLAY_SPEED,
        duration: 0.9,
        // ease: "power2.out",
        onUpdate: () => {
          velocity = obj.v;
        },
      });
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      endDrag();
    };

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointercancel", onPointerUp);

    return () => {
      cancelAnimationFrame(raf);
      releaseTween?.kill();
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Component preview carousel"
      className="relative h-105 cursor-grab touch-none perspective-[3200px] select-none sm:h-120 lg:h-[70vh] lg:max-h-220"
    >
      <div className="size-full transform-3d transform-[rotateX(3deg)_rotateY(-4deg)]">
        {COMPONENT_PREVIEWS.map((item, i) => (
          <div
            key={item.slug}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            className="double-bezel pointer-events-none absolute top-1/2 left-1/2 w-[62%]"
          >
            <div className="double-bezel-inner flex aspect-3/2 flex-col overflow-hidden">
              <div className="flex-1 overflow-hidden items-center justify-between border-b border-border px-5 py-3">
                <span className="text-sm font-semibold text-foreground">
                  {item.name}
                </span>
              </div>
              <div className="p-5">{item.preview}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
