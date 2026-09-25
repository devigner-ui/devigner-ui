import { readFileSync } from "node:fs";

export interface IndexComponent {
  slug: string;
  name: string;
  description: string;
  category: string;
  variantCount: number;
  dependencies: string[];
}

export interface FullComponent {
  slug: string;
  name: string;
  description: string;
  category: string;
  variants: string[];
  file: string;
  dependencies: string[];
  files: Record<string, string>;
}

interface RegistrySnapshot {
  index: IndexComponent[];
  components: Record<string, FullComponent>;
}

function loadRegistry(): RegistrySnapshot {
  return JSON.parse(readFileSync(new URL("./registry.json", import.meta.url), "utf8")) as RegistrySnapshot;
}

export async function fetchIndex(): Promise<IndexComponent[]> {
  return loadRegistry().index;
}

export async function fetchComponent(slug: string): Promise<FullComponent> {
  const component = loadRegistry().components[slug];
  if (!component) throw new Error(`Component "${slug}" not found in registry`);
  return component;
}
