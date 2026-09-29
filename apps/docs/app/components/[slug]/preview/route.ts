import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getCatalog } from "@/lib/catalog";

// The component's OG shot (scripts/og-shots.mjs) as a plain image, for the
// footer's previews. Built once per component; the PNGs live outside public/
// because the OG images read them from disk.
export const dynamicParams = false;

export function generateStaticParams() {
  return getCatalog().map((e) => ({ slug: e.slug }));
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const png = await readFile(join(process.cwd(), "assets", "og", `${slug}.png`));
    return new Response(new Uint8Array(png), {
      headers: { "content-type": "image/png", "cache-control": "public, max-age=86400" },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
