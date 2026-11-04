"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { MenuDock, type MenuDockItem } from "devignerui";
import { componentNames } from "@/lib/registry-names";
import {
  IconArchive,
  IconArrowUpDown,
  IconBookPages,
  IconBrush,
  IconDiamondDivided,
  IconHeart,
  IconHistory,
  IconHomeAngleDoor,
  IconInbox,
  IconLamp,
  IconLibrary,
  IconLogout,
  IconMagnifierGap,
  IconUser,
} from "@devigner-ui/icons";

/** The catalog card shows the same dock as the details page. */
export default function MenuDockDemo() {
  return <MenuDockPreview />;
}

/** The MenuDock's search panel, passed to its Search item as `content`. It is
 *  ordinary markup with its own state - the dock morphs into whatever this
 *  renders and never learns that it is a search box.
 *
 *  It searches the real component names (lib/registry-names.ts, generated
 *  with the registry but without its sources, so it can ship inline). Capped,
 *  because the surface animates to fit its content: an uncapped list would
 *  have the panel lurching a row taller on every keystroke. */
const SEARCH_LIMIT = 4;

function MenuDockSearch() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const hits = (
    q
      ? componentNames.filter((c) => c.name.toLowerCase().includes(q))
      : componentNames
  ).slice(0, SEARCH_LIMIT);

  return (
    <div className="flex w-72 flex-col gap-1">
      <div className="flex h-10 items-center gap-3 rounded-2xl bg-surface2 px-3">
        <IconMagnifierGap className="size-5 shrink-0 text-text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search components"
          aria-label="Search components"
          className="w-full bg-transparent text-[15px] text-foreground outline-none! placeholder:text-text-muted"
        />
      </div>
      <motion.div layout="position" className="flex flex-col gap-1">
        {hits.length === 0 ? (
          <p className="px-3 py-2 text-[15px] text-text-muted">
            Nothing matches “{query.trim()}”.
          </p>
        ) : (
          // Capped once, by SEARCH_LIMIT above. A second slice here just means
          // two numbers to keep in agreement.
          hits.map((c) => (
            <Link
              key={c.slug}
              href={`/components/${c.slug}`}
              className="flex h-10 items-center gap-3 rounded-2xl px-3 text-[15px] text-foreground transition-colors hover:bg-surface-hover"
            >
              <IconDiamondDivided className="size-5 shrink-0 text-text-muted" />
              <span className="flex-1 truncate">{c.name}</span>
            </Link>
          ))
        )}
      </motion.div>
    </div>
  );
}

/** Sample dock for the MenuDock preview - same items as its Usage snippet.
 *  Account nests two deep, which is what shows the stack is not capped. */
const MENU_DOCK_ITEMS: MenuDockItem[] = [
  {
    id: "home",
    label: "Home",
    icon: <IconHomeAngleDoor strokeWidth={2} />,
    activeIcon: <IconHomeAngleDoor variant="Bold" />,
  },
  {
    id: "search",
    label: "Search",
    icon: <IconMagnifierGap strokeWidth={2} />,
    activeIcon: <IconMagnifierGap variant="Bold" />,
    content: <MenuDockSearch />,
  },
  {
    id: "saved",
    label: "Saved",
    icon: <IconHeart strokeWidth={2} />,
    activeIcon: <IconHeart variant="Bold" />,
  },
  {
    id: "library",
    label: "Library",
    icon: <IconLibrary strokeWidth={2} />,
    activeIcon: <IconLibrary variant="Bold" />,
    items: [
      { label: "Recently viewed", icon: <IconHistory /> },
      { label: "Bookmarked", icon: <IconBookPages /> },
      { label: "Downloads", icon: <IconArchive /> },
    ],
  },
  {
    id: "account",
    label: "Account",
    icon: <IconArrowUpDown className="size-3.75!" strokeWidth={2} />,
    items: [
      {
        label: "Profile",
        icon: <IconUser />,
        items: [
          { label: "Personal", icon: <IconUser /> },
          { label: "Work", icon: <IconArchive /> },
          { label: "Ideas", icon: <IconLamp /> },
        ],
      },
      { label: "Appearance", icon: <IconBrush /> },
      { label: "Invite a friend", icon: <IconInbox /> },
      { label: "Sign out", icon: <IconLogout />, destructive: true },
    ],
  },
];

/** The details page's dock, with `active` wired to the last leaf picked - without state the
 *  outline/solid swap has nothing to swap on. */
export function MenuDockPreview({ className }: { className?: string }) {
  const [active, setActive] = useState("home");

  return (
    <MenuDock
      active={active}
      items={MENU_DOCK_ITEMS.map((item) =>
        item.items ? item : { ...item, onSelect: () => setActive(item.id!) },
      )}
      className={className}
    />
  );
}
