"use client";

import { KpiChart } from "devignerui";

export const KPI_REVENUE = [
  { label: "Jul", value: 5000 },
  { label: "Aug", value: 6200 },
  { label: "Sept", value: 8400 },
  { label: "Oct", value: 13100 },
  { label: "Nov", value: 21000 },
];

/** Peaks under the card, then ends below where it started. */
export const KPI_FALLING = [
  { label: "Jul", value: 12000 },
  { label: "Aug", value: 17500 },
  { label: "Sept", value: 21000 },
  { label: "Oct", value: 14200 },
  { label: "Nov", value: 9000 },
];

export default function KpiChartDemo() {
  // The card is w-full: stages shrink to their content, so give it its
  // intended width here (FitToStage scales it down where that's too wide).
  return (
    <KpiChart
      data={KPI_REVENUE}
      label="Monthly revenue"
      className="w-lg max-w-full"
    />
  );
}
