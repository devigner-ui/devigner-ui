"use client";

import { useState } from "react";
import {
  DynamicIsland,
  IslandAirdrop,
  IslandAirdropMini,
  IslandCall,
  IslandFindMy,
  IslandLowBattery,
  IslandMusic,
  IslandRecord,
  IslandRing,
  IslandScreenRecord,
  IslandTimer,
  type DynamicIslandView,
} from "devignerui";
import { SPRING_ISLAND_POP } from "devignerui/motion";
import { cn } from "@/lib/utils";
import avatar from "../assets/dynamic-island/avatar.jpg";
import cover from "../assets/dynamic-island/cover.jpg";
import preview from "../assets/dynamic-island/preview.jpg";

export const ISLAND_VIEWS = [
  "idle",
  "ring",
  "timer",
  "record",
  "music",
  "airdrop",
  "airdropMini",
  "lowBattery",
  "call",
  "findMy",
  "screenRecord",
] as const;
export type IslandView = (typeof ISLAND_VIEWS)[number];

export const ISLAND_LABELS: Record<IslandView, string> = {
  idle: "Idle",
  ring: "Ring",
  timer: "Timer",
  record: "Record",
  music: "Music",
  airdrop: "AirDrop",
  airdropMini: "AirDrop mini",
  lowBattery: "Low battery",
  call: "Call",
  findMy: "Find My",
  screenRecord: "Screen record",
};

/** Pass `view` and `onViewChange` to drive it from outside (the docs
 *  Settings panel); the buttons under the island then go away. */
export default function DynamicIslandDemo({
  view: viewProp,
  onViewChange,
}: {
  view?: IslandView;
  onViewChange?: (view: IslandView) => void;
}) {
  const [own, setOwn] = useState<IslandView>("music");
  const view = viewProp ?? own;
  const setView = onViewChange ?? setOwn;
  const controlled = viewProp !== undefined;
  const idle = () => setView("idle");

  const views: DynamicIslandView[] = [
    { id: "ring", label: "Silent mode on", content: <IslandRing />, transition: SPRING_ISLAND_POP },
    { id: "timer", label: "Timer, 1 minute", content: <IslandTimer onClose={idle} />, transition: SPRING_ISLAND_POP },
    { id: "record", label: "Recording a voice memo", content: <IslandRecord /> },
    { id: "music", label: "Now playing Thousand Faces by Talha Anjum", content: <IslandMusic title="Thousand Faces" artist="Talha Anjum" art={cover.src} /> },
    {
      id: "airdrop",
      label: "Remi would like to share 3 files over AirDrop",
      content: <IslandAirdrop from="Remi" avatar={avatar.src} preview={preview.src} onDecline={idle} onAccept={() => setView("airdropMini")} />,
    },
    { id: "airdropMini", label: "Receiving 3 files over AirDrop", content: <IslandAirdropMini from="Remi" avatar={avatar.src} onStop={idle} onDone={idle} /> },
    { id: "lowBattery", label: "Low battery, 20 percent left", content: <IslandLowBattery /> },
    { id: "call", label: "Call in progress", content: <IslandCall /> },
    { id: "findMy", label: "Find My is locating Remi's iPhone", content: <IslandFindMy /> },
    { id: "screenRecord", label: "Screen recording", content: <IslandScreenRecord onStop={idle} /> },
  ];

  return (
    <div className={cn("flex w-full max-w-lg flex-col items-center py-2", controlled ? "h-56 justify-center" : "h-80 justify-between")}>
      <div className="grid h-48 place-items-center">
        <DynamicIsland views={views} view={view === "idle" ? null : view} />
      </div>
      {!controlled && (
      <div className="flex flex-wrap justify-center gap-1.5" role="group" aria-label="Island view">
        {ISLAND_VIEWS.map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() => setView(v)}
            className={cn(
              "h-8 cursor-pointer rounded-full px-3.5 text-[13px] font-medium ring-1 ring-border transition-colors duration-150 ease-out",
              view === v ? "bg-foreground text-background ring-transparent" : "bg-surface text-text-secondary hover:bg-surface-hover hover:text-foreground",
            )}
          >
            {ISLAND_LABELS[v]}
          </button>
        ))}
      </div>
      )}
    </div>
  );
}
