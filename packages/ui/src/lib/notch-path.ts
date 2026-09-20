// The notch outline, kept apart from the component so it stays pure - and
// runnable. Same split as menu-path.ts: the geometry is checkable without a
// DOM, a browser or React.
//
// The shape is a rounded box welded to the top edge of the viewport, with its
// two TOP corners inverted so the surface flares outward into the edge instead
// of curving away from it. That flare is the whole point, and it is why this
// is a path rather than a div with a border-radius: CSS has no concave corner.
//
// An earlier version produced the flare as a side effect of an SVG metaball
// filter, by merging the notch with an off-screen shape. That works, but the
// fillet's size is an emergent property of a blur radius rather than a number
// anyone can set, it forces opaque fills, it costs a per-frame re-rasterize,
// and it cannot be stroked. A path gives an exact radius, a real 1px stroke
// for the border, and no filter at all.

export interface NotchPathSpec {
  /** The notch body's width, not counting the flare either side. */
  width: number;
  height: number;
  /** The two BOTTOM corners, which curve the ordinary way. */
  radius: number;
  /** The two TOP corners, which curve the other way. Doubles as how far the
   *  surface overhangs the body on each side, because a quarter circle's
   *  horizontal reach is its radius. */
  flare: number;
}

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

/** Both radii, reconciled against the box they have to fit inside.
 *
 *  Exported because the component needs the same clamped flare to lay the SVG
 *  out, and recomputing it there would be two sources of truth for one number.
 */
export function notchRadii(spec: NotchPathSpec) {
  const { width, height } = spec;
  // A corner cannot eat more than half of either side, or opposite corners
  // overlap and the path crosses itself.
  const radius = clamp(spec.radius, 0, Math.min(width, height) / 2);
  // The flare consumes vertical room above the bottom corner: the body's side
  // wall is what is left between them, and it cannot be negative.
  const flare = clamp(spec.flare, 0, height - radius);
  return { radius, flare };
}

/** Total width the surface occupies, body plus both flares. */
export function notchOuterWidth(spec: NotchPathSpec): number {
  return spec.width + notchRadii(spec).flare * 2;
}

/** The outline, as an SVG `d`, in a box (notchOuterWidth x height) whose
 *  origin is the top-left - so the caller positions the svg and nothing here
 *  needs to know where the viewport edge is.
 *
 *  Traversed clockwise from the top-left, which is why every arc is sweep 1:
 *  along the edge, in at the right flare, down and around the bottom, back up
 *  and out at the left flare. The top boundary is a straight line because it
 *  IS the viewport edge - the shape is welded to it, not floating below it. */
export function notchPath(spec: NotchPathSpec): string {
  return `M 0 0 L ${notchOuterWidth(spec)} 0 ${sides(spec)} Z`;
}

/** The same outline with the top edge left out, and left open.
 *
 *  The fill needs the top edge to close the shape; the stroke must not have
 *  it, or the border draws a hairline straight across the viewport edge - the
 *  one boundary of this shape that is not an edge of anything, because the
 *  notch is welded to it. Stroking `notchPath` directly is the mistake this
 *  exists to prevent. */
export function notchOutline(spec: NotchPathSpec): string {
  return `M ${notchOuterWidth(spec)} 0 ${sides(spec)}`;
}

/** Everything but the top edge: in at the right flare, down and around the
 *  bottom, back up and out at the left flare, ending on the origin. Shared so
 *  the fill and the stroke can never disagree about the shape.
 *
 *  Every arc is sweep 1 because the traversal is clockwise throughout. A 0
 *  anywhere turns that corner inside out. */
function sides(spec: NotchPathSpec): string {
  const { height } = spec;
  const { radius: r, flare: f } = notchRadii(spec);
  const w = notchOuterWidth(spec);
  // Body walls, in outer-box coordinates.
  const left = f;
  const right = w - f;

  return [
    // Top-right, inverted: bows outward against its chord, so the surface is
    // wider at the edge than it is at the body.
    `A ${f} ${f} 0 0 1 ${right} ${f}`,
    `L ${right} ${height - r}`,
    `A ${r} ${r} 0 0 1 ${right - r} ${height}`,
    `L ${left + r} ${height}`,
    `A ${r} ${r} 0 0 1 ${left} ${height - r}`,
    `L ${left} ${f}`,
    // Top-left, inverted, mirroring the right.
    `A ${f} ${f} 0 0 1 0 0`,
  ].join(" ");
}
