"use client";

import { useEffect, useState } from "react";
import { ImageGeneration, type ImageGenerationStatus } from "devignerui";
import art from "../assets/rooftop.jpg";

/** Served from the docs' own origin, so the dots can read its colors. */
export const IMAGE_GENERATION_SRC = art.src;
export const IMAGE_GENERATION_PROMPT =
  "Pixel art, someone on a rooftop ledge at night, lit by their phone";
/** The phone and the head, kept in view by every crop from 9:16 to 16:9. */
export const IMAGE_GENERATION_FOCUS = { x: 86, y: 37 };

/** One run, in order, with how long each state holds (ms). */
const RUN: [ImageGenerationStatus, number][] = [
  ["queued", 1600],
  ["generating", 3600],
  ["refining", 2800],
  ["complete", 3400],
];

/** Plays queued, generating, refining, complete, then starts over. */
export function useGenerationRun(playing = true) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(
      () => setStep((s) => (s + 1) % RUN.length),
      RUN[step]![1],
    );
    return () => clearTimeout(id);
  }, [step, playing]);
  return RUN[step]![0];
}

export default function ImageGenerationDemo() {
  const status = useGenerationRun();
  return (
    <ImageGeneration
      status={status}
      src={IMAGE_GENERATION_SRC}
      prompt={IMAGE_GENERATION_PROMPT}
      focus={IMAGE_GENERATION_FOCUS}
      className="w-64"
    />
  );
}
