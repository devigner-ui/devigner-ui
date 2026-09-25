"use client";

import { Timeline } from "devignerui";

const STEPS = [
  { title: "Kickoff", description: "Agree on scope and the first milestone." },
  { title: "Prototype", description: "Wire the flow with real data." },
  { title: "Polish", description: "Tune motion, states and edge cases." },
  { title: "Ship", description: "Release, measure, iterate." },
];

export default function TimelineDemo() {
  return <Timeline steps={STEPS} className="w-sm max-w-full" />;
}
