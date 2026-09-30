"use client";

import { GlassMenu } from "devignerui";
import {
  IconChatRoundDots,
  IconHomeSmileAngle,
  IconSetting2,
  IconStarCircle,
} from "@devigner-ui/icons";

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
    icon: <IconSetting2 className="size-5" variant="Bulk" />,
  },
];

export default function LiquidGlassDemo() {
  return <GlassMenu items={items} />;
}
