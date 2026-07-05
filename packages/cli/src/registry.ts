// Thin client for the Devigner registry (served by the docs app at /api/registry).
// Override the host with DEVIGNER_REGISTRY_URL for local/staging registries.
export const REGISTRY_URL = (
  process.env.DEVIGNER_REGISTRY_URL || "https://devignerui.com/api/registry"
).replace(/\/$/, "");

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

export async function fetchIndex(): Promise<IndexComponent[]> {
  const res = await fetch(REGISTRY_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch registry index (${res.status})`);
  }
  const data = (await res.json()) as { components: IndexComponent[] };
  return data.components;
}

export async function fetchComponent(slug: string): Promise<FullComponent> {
  const res = await fetch(`${REGISTRY_URL}/${slug}`);
  if (!res.ok) {
    throw new Error(`Component "${slug}" not found in registry`);
  }
  return res.json() as Promise<FullComponent>;
}
