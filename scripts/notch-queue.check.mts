// Self-check for the notch queue. No framework: `npm test`, or
// `node scripts/notch-queue.check.mts` - Node strips the types itself.
import assert from "node:assert/strict";
import {
  addNotch,
  updateNotch,
  dismissNotch,
  remainingMs,
  type NotchRecord,
} from "../packages/ui/src/lib/notch-queue.ts";

const rec = (id: string, over: Partial<NotchRecord> = {}): NotchRecord => ({
  id,
  status: "default",
  duration: 4000,
  createdAt: 0,
  ...over,
});

// Newest first: a new notch is unshifted, so the rendered one (index 0) is
// always the most recent. Pushing would render the oldest and silently queue
// the thing that just happened.
const one = addNotch([], rec("a"));
const two = addNotch(one, rec("b"));
assert.deepEqual(
  two.map((n) => n.id),
  ["b", "a"],
);

// Immutable: the input list is never touched, so useSyncExternalStore sees a
// new reference and React actually re-renders.
assert.equal(one.length, 1);
assert.notEqual(one, two);

// Re-adding a live id updates in place and keeps its position. This is what
// makes toast.promise a morph rather than an exit plus an entrance.
const readd = addNotch(two, rec("a", { status: "success", title: "Done" }));
assert.deepEqual(
  readd.map((n) => n.id),
  ["b", "a"],
);
assert.equal(readd[1].status, "success");
assert.equal(readd[1].title, "Done");

// createdAt is reset on re-add, so the refreshed notch gets a full duration
// rather than inheriting a timer that is already half spent.
const reAddLate = addNotch(
  [rec("a", { createdAt: 0 })],
  rec("a", { createdAt: 5000 }),
);
assert.equal(reAddLate[0].createdAt, 5000);

// updateNotch patches without reordering - a loading notch that resolves must
// not jump to the front past notifications that arrived while it ran.
const patched = updateNotch(two, "a", { status: "error" });
assert.deepEqual(
  patched.map((n) => n.id),
  ["b", "a"],
);
assert.equal(patched[1].status, "error");
// An unknown id is a no-op, not a throw: a promise can resolve after its
// notch was dismissed by hand, and that is ordinary, not exceptional.
assert.deepEqual(updateNotch(two, "zzz", { status: "error" }), two);

// dismissNotch with an id removes one; without one, removes all.
assert.deepEqual(
  dismissNotch(two, "b").map((n) => n.id),
  ["a"],
);
assert.deepEqual(dismissNotch(two), []);
assert.deepEqual(dismissNotch(two, "zzz"), two);

// remainingMs counts down from duration, floors at zero, and never expires a
// pinned notch however long it has been up.
assert.equal(remainingMs(rec("a"), 0), 4000);
assert.equal(remainingMs(rec("a"), 1500), 2500);
assert.equal(remainingMs(rec("a"), 9999), 0);
assert.equal(remainingMs(rec("a", { duration: Infinity }), 9999), Infinity);

console.log("notch-queue: ok");
