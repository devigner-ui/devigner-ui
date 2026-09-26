"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { MenuDock, type MenuDockItem } from "devignerui";
import {
  IconArchive,
  IconArrowUpDown,
  IconBook2,
  IconBrush,
  IconComponent,
  IconHeart,
  IconHistory,
  IconHomeAngle2,
  IconInbox,
  IconLamp,
  IconLibrary,
  IconLogout,
  IconSearchNormal,
  IconSettings,
  IconUser,
} from "@devigner-ui/icons";

export default function MenuDockDemo() {
  const [active, setActive] = useState("home");
  const pick = (id: string) => () => setActive(id);
  return (
    <MenuDock
      active={active}
      items={[
        {
          id: "home",
          label: "Home",
          icon: <IconHomeAngle2 strokeWidth={2} />,
          activeIcon: <IconHomeAngle2 variant="Bold" />,
          onSelect: pick("home"),
        },
        {
          id: "search",
          label: "Search",
          icon: <IconSearchNormal strokeWidth={2} />,
          activeIcon: <IconSearchNormal variant="Bold" />,
          onSelect: pick("search"),
        },
        {
          id: "saved",
          label: "Saved",
          icon: <IconHeart strokeWidth={2} />,
          activeIcon: <IconHeart variant="Bold" />,
          onSelect: pick("saved"),
        },
        {
          id: "account",
          label: "Account",
          icon: <IconSettings strokeWidth={2} />,
          items: [
            { label: "Profile", icon: <IconUser /> },
            { label: "Appearance", icon: <IconBrush /> },
            { label: "Sign out", icon: <IconLogout />, destructive: true },
          ],
        },
      ]}
    />
  );
}

/** The MenuDock's search panel, passed to its Search item as `content`. It is
 *  ordinary markup with its own state - the dock morphs into whatever this
 *  renders and never learns that it is a search box.
 *
 *  It searches the real registry, so the results are real components. The
 *  registry holds every component's source, so it loads when this panel
 *  first opens instead of riding in every page that shows the dock. Capped,
 *  because the surface animates to fit its content: an uncapped list would
 *  have the panel lurching a row taller on every keystroke. */
const SEARCH_LIMIT = 4;

function MenuDockSearch() {
  const [query, setQuery] = useState("");
  const [all, setAll] = useState<{ slug: string; name: string }[] | null>(null);
  useEffect(() => {
    let alive = true;
    import("@/lib/registry").then(
      ({ components }) => alive && setAll(Object.values(components)),
    );
    return () => {
      alive = false;
    };
  }, []);
  const q = query.trim().toLowerCase();
  const hits = (
    q
      ? (all ?? []).filter((c) => c.name.toLowerCase().includes(q))
      : (all ?? [])
  ).slice(0, SEARCH_LIMIT);

  return (
    <div className="flex w-72 flex-col gap-1">
      <div className="flex h-10 items-center gap-3 rounded-2xl bg-surface2 px-3">
        <IconSearchNormal className="size-5 shrink-0 text-text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search components"
          aria-label="Search components"
          className="w-full bg-transparent text-[15px] text-foreground outline-none! placeholder:text-text-muted"
        />
      </div>
      <motion.div layout="position" className="flex flex-col gap-1">
        {all === null ? null : hits.length === 0 ? (
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
              <IconComponent className="size-5 shrink-0 text-text-muted" />
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
    icon: <IconHomeAngle2 strokeWidth={2} />,
    activeIcon: <IconHomeAngle2 variant="Bold" />,
  },
  {
    id: "search",
    label: "Search",
    icon: <IconSearchNormal strokeWidth={2} />,
    activeIcon: <IconSearchNormal variant="Bold" />,
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
      { label: "Bookmarked", icon: <IconBook2 /> },
      { label: "Downloads", icon: <IconArchive /> },
    ],
  },
  {
    id: "account",
    label: "Account",
    icon: <IconArrowUpDown className="size-3.5!" strokeWidth={2} />,
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
