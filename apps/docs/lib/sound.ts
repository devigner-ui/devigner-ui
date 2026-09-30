import { definePatch, type AudioPatch } from "@web-kits/audio";
import { JITTER, PATCH, type SoundName } from "@/components/ui/sound";

/** Sound belongs to the details page only: it switches this on while mounted
 *  (unless the visitor turned it off) and back off when leaving, so shared
 *  pieces like the copy button stay silent everywhere else. */
let enabled = false;
export const setEnabled = (on: boolean) => {
  enabled = on;
};

export const SOUND_KEY = "devigner:sound";

/** Built on first play: the audio engine needs a window. */
let patch: AudioPatch | null = null;

/** Plays `name` from the Kobra patch, varied a little in pitch and strength
 *  on every play the way Kobra's own listener does, so repeats never sound
 *  identical. */
export const play = (name: SoundName, options?: { volume?: number }) => {
  if (!enabled || typeof window === "undefined") return;
  patch ??= definePatch(PATCH);
  patch.play(name, {
    volume: options?.volume,
    detune: (Math.random() * 2 - 1) * JITTER[name],
    velocity: 0.9 + Math.random() * 0.1,
  });
};

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
