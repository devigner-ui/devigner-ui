// Self-check for the notch outline geometry. No framework: `npm test`, or
// `node scripts/notch-path.check.mts` - Node strips the types itself.
import assert from "node:assert/strict";
import {
  notchPath,
  notchOutline,
  notchRadii,
  notchOuterWidth,
  type NotchPathSpec,
} from "../packages/ui/src/lib/notch-path.ts";

const spec = (over: Partial<NotchPathSpec> = {}): NotchPathSpec => ({
  width: 200,
  height: 48,
  radius: 16,
  flare: 18,
  ...over,
});

// The flare is an overhang on each side, so the surface is always wider than
// the body it wraps. Get this wrong and the corners curve inward.
assert.equal(notchOuterWidth(spec()), 200 + 18 * 2);

/* ─── Clamping ─── */

// A corner cannot eat more than half of either side. A 40px radius on a 48px
// tall notch would make the two bottom corners overlap and the path cross
// itself, so it comes back as 24.
assert.equal(notchRadii(spec({ radius: 40 })).radius, 24);
// Width binds when it is the smaller of the two.
assert.equal(notchRadii(spec({ width: 30, radius: 40 })).radius, 15);

// The flare and the bottom radius share the side wall between them. Asking for
// more flare than the wall can give leaves no straight segment, so it is
// capped at whatever the bottom corner did not take.
assert.equal(notchRadii(spec({ height: 48, radius: 16, flare: 99 })).flare, 32);
// And the cap tracks the clamped radius, not the requested one: radius 40 on a
// 48-tall notch clamps to 24, leaving 24 for the flare rather than 8.
assert.equal(notchRadii(spec({ height: 48, radius: 40, flare: 99 })).flare, 24);

// Negatives are meaningless here and would invert the arcs rather than
// disable them, so both floor at zero.
assert.equal(notchRadii(spec({ radius: -5 })).radius, 0);
assert.equal(notchRadii(spec({ flare: -5 })).flare, 0);

/* ─── The path ─── */

const d = notchPath(spec());

// Starts at the origin and runs straight across the viewport edge before any
// curve. That straight top is what welds the notch to the edge; a shape that
// curved away from it would read as floating below it.
assert.ok(d.startsWith("M 0 0 L 236 0 "), d.slice(0, 40));
assert.ok(d.endsWith("Z"));

// Four arcs, one per corner, and every one sweep 1 - the traversal is
// clockwise throughout, so a 0 anywhere would kink that corner inside out.
const arcs = d.match(/A [^A]*/g) ?? [];
assert.equal(arcs.length, 4);
for (const a of arcs) assert.match(a, /^A [\d.]+ [\d.]+ 0 0 1 /);

// The two top arcs carry the flare radius, the two bottom ones the corner
// radius. Mixing them up is the failure that looks almost right.
assert.match(arcs[0], /^A 18 18 /);
assert.match(arcs[1], /^A 16 16 /);
assert.match(arcs[2], /^A 16 16 /);
assert.match(arcs[3], /^A 18 18 /);

// Both body walls sit exactly one flare in from the outer edges, so the shape
// is symmetric and the body lands where the caller's content does.
assert.ok(d.includes("L 218 32"), d);
assert.ok(d.includes("L 18 18"), d);

// The bottom edge runs between the two bottom corners at full height.
assert.ok(d.includes("L 34 48"), d);

/* ─── The stroke outline ─── */

const o = notchOutline(spec());

// Starts where the top edge would have ended and never draws it. Stroking the
// closed path instead would lay a hairline across the viewport edge, which is
// the one boundary of this shape that is not an edge of anything.
assert.ok(o.startsWith("M 236 0 A"), o.slice(0, 40));
assert.ok(!o.includes("Z"), o);
// Three straight runs, not four: two side walls and the bottom. The fourth in
// the closed path is the top edge, which is exactly what this one drops.
assert.equal((o.match(/L /g) ?? []).length, 3);
assert.equal((notchPath(spec()).match(/L /g) ?? []).length, 4);

// Fill and stroke describe the same corners, so they cannot drift apart.
assert.equal((o.match(/A [^A]*/g) ?? []).length, 4);
assert.ok(d.includes(o.slice(o.indexOf("A"), o.length - 0)), "sides shared");

// Ends on the origin, so the two flares meet the edge at the same height.
assert.ok(o.endsWith("A 18 18 0 0 1 0 0"), o.slice(-24));

/* ─── Degenerate boxes still produce a closed path ─── */

for (const s of [
  spec({ width: 0 }),
  spec({ height: 0 }),
  spec({ width: 0, height: 0 }),
  spec({ radius: 0, flare: 0 }),
]) {
  const out = notchPath(s);
  assert.ok(out.startsWith("M 0 0"), out);
  assert.ok(out.endsWith("Z"), out);
  // No NaN reaches the DOM: a single NaN in a `d` drops the whole path
  // silently, so the notch would vanish with nothing logged anywhere.
  assert.ok(!/NaN|Infinity|undefined/.test(out), out);
}

console.log("notch-path: ok");
