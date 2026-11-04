"use client";

import { MenuNotch, type MenuNotchSection, type MenuNotchSocial } from "devignerui";
import { IconInstagram, IconYoutube } from "@devigner-ui/icons";
import { useTheme } from "../components/theme-provider";

// The icon set has no X or TikTok mark: filled marks from Simple Icons (CC0),
// framed in a 28 box so they sit at the icon set's size.
const IconX = () => (
  <svg viewBox="-2 -2 28 28" fill="currentColor" aria-hidden>
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);
const IconTiktok = () => (
  <svg viewBox="-2 -2 28 28" fill="currentColor" aria-hidden>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

export const MENU_NOTCH_SECTIONS: MenuNotchSection[] = [
  {
    label: "Menu",
    size: "lg",
    links: [
      { label: "About", href: "#about" },
      { label: "Pricing", href: "#pricing" },
      { label: "Resources", href: "#resources" },
      { label: "Our features", href: "#features" },
    ],
  },
  {
    label: "Legal",
    links: [
      { label: "Privacy Policy", href: "#privacy" },
      { label: "Terms & Conditions", href: "#terms" },
    ],
  },
];

export const MENU_NOTCH_SOCIALS: MenuNotchSocial[] = [
  { label: "Instagram", href: "#instagram", icon: <IconInstagram variant="Bold" /> },
  { label: "X", href: "#x", icon: <IconX /> },
  { label: "TikTok", href: "#tiktok", icon: <IconTiktok /> },
  { label: "YouTube", href: "#youtube", icon: <IconYoutube variant="Bold" /> },
];

/** What the docs Settings panel drives; the gallery demo uses the defaults. */
export const MENU_NOTCH_DEFAULTS = {
  open: true,
  themeButton: true,
};
export type MenuNotchConfig = typeof MENU_NOTCH_DEFAULTS;

export default function MenuNotchDemo(props: Partial<MenuNotchConfig>) {
  const { open, themeButton } = { ...MENU_NOTCH_DEFAULTS, ...props };
  const { theme, setTheme } = useTheme();
  return (
    // Tall enough for the open panel, so the stage fits all of it.
    <div className="h-[560px]">
      <MenuNotch
        key={String(open)}
        defaultOpen={open}
        sections={MENU_NOTCH_SECTIONS}
        socials={MENU_NOTCH_SOCIALS}
        theme={theme}
        onThemeChange={themeButton ? setTheme : undefined}
      />
    </div>
  );
}
