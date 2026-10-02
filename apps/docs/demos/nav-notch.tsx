"use client";

import { NavNotch } from "devignerui";

export const NAV_NOTCH_ITEMS = Array.from({ length: 10 }, (_, i) => ({
  label: `Link ${i + 1}`,
}));

export default function NavNotchDemo() {
  return <NavNotch items={NAV_NOTCH_ITEMS} defaultValue="Link 5" />;
}
