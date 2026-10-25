"use client";

import { ExpandTabs } from "devignerui";
import {
  IconBriefcase,
  IconKeyboard,
  IconProfile,
  IconTerminalAlt,
} from "@devigner-ui/icons";

export const EXPAND_TABS_ITEMS = [
  { label: "Commands", icon: <IconTerminalAlt variant="Bulk" />, badge: "New" },
  { label: "About", icon: <IconProfile variant="Bulk" /> },
  { label: "Portfolio", icon: <IconBriefcase variant="Bulk" /> },
  { label: "Shortcuts", icon: <IconKeyboard variant="Bulk" /> },
];

export default function ExpandTabsDemo() {
  // The stage's dot field shows through; the component itself ships solid.
  return <ExpandTabs items={EXPAND_TABS_ITEMS} classNames={{ tab: "bg-foreground/8" }} />;
}
