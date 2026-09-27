import { play, setEnabled, type SoundName } from "cuelume";

/** Sound belongs to the details page only: it switches this on while mounted
 *  (unless the visitor turned it off) and back off when leaving, so shared
 *  pieces like the copy button stay silent everywhere else. */
setEnabled(false);

export const SOUND_KEY = "devigner:sound";

/** Whether the last input was a pointer. Keyboard-driven actions stay silent
 *  for the same reason they are not animated: they repeat too often for
 *  feedback to be anything but noise. */
let viaPointer = false;
if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", () => (viaPointer = true), true);
  window.addEventListener("keydown", () => (viaPointer = false), true);
}

/** Plays `name` if the action came from a pointer. */
export const cue = (name: SoundName, options?: { volume?: number }) => {
  if (viaPointer) play(name, options);
};

export { play, setEnabled };
