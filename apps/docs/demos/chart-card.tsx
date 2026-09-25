"use client";

import { ChartCard } from "devignerui";

const SALES = [
  { label: "Feb", value: 6420 },
  { label: "Mar", value: 9180 },
  { label: "Apr", value: 12340 },
  { label: "May", value: 8760 },
  { label: "Jun", value: 16520 },
  { label: "Jul", value: 13070 },
  { label: "Aug", value: 15960 },
];

export default function ChartCardDemo() {
  // The card is w-full: stages shrink to their content, so give it its
  // intended width here (FitToStage scales it down where that's too wide).
  return <ChartCard total={90744} data={SALES} defaultActive={4} className="w-lg max-w-full" />;
}
