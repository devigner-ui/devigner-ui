"use client";

import { createContext, useContext, useState } from "react";
import type { ComponentSlug } from "@/lib/registry";

const SelectionContext = createContext<{
  slug: ComponentSlug;
  setSlug: (slug: ComponentSlug) => void;
} | null>(null);

/** The home page's current component: the hero window sets it, the code
 *  cell and the install terminal follow it. */
export function SelectionProvider({
  initial,
  children,
}: {
  initial: ComponentSlug;
  children: React.ReactNode;
}) {
  const [slug, setSlug] = useState(initial);
  return (
    <SelectionContext.Provider value={{ slug, setSlug }}>{children}</SelectionContext.Provider>
  );
}

export function useSelection() {
  const value = useContext(SelectionContext);
  if (!value) throw new Error("useSelection needs a SelectionProvider");
  return value;
}
