"use client";

import { useRef } from "react";
import { GlassMenu, type GlassMenuProps } from "devignerui";
import {
  IconChatRoundDots,
  IconHomeSmileAngle,
  IconSettingGear,
  IconStarCircle,
} from "@devigner-ui/icons";
import backdrop from "../assets/liquid-glass/backdrop.jpg";

const items = [
  {
    id: "feed",
    label: "Feed",
    icon: <IconHomeSmileAngle className="size-5" variant="Bulk" />,
  },
  {
    id: "star",
    label: "Star",
    icon: <IconStarCircle className="size-5" variant="Bulk" />,
  },
  {
    id: "messages",
    label: "Messages",
    icon: <IconChatRoundDots className="size-5" variant="Bulk" />,
  },
  {
    id: "settings",
    label: "Settings",
    icon: <IconSettingGear className="size-5" variant="Bulk" />,
  },
];

export default function LiquidGlassDemo() {
  return <GlassMenu items={items} />;
}

/** The menu drawn by the shader, over the photo it bends. */
export function LiquidGlassShader(props: Omit<GlassMenuProps, "backdrop">) {
  const area = useRef<HTMLImageElement>(null);
  return (
    // Dark in both themes: the photo is a night scene, so the glass and
    // its labels take the dark tokens.
    <div className="dark relative grid h-120 w-full max-w-3xl place-items-center overflow-hidden rounded-2xl">
      <img
        ref={area}
        src={backdrop.src}
        alt=""
        className="absolute inset-0 size-full object-cover"
        draggable={false}
      />
      <GlassMenu
        {...props}
        backdrop={{ src: backdrop.src, area }}
      />
    </div>
  );
}
