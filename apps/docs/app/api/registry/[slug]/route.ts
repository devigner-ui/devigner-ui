import { NextResponse } from "next/server";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

const REGISTRY_DIR = join(process.cwd(), "registry");
const COMPONENTS_DIR = join(
  process.cwd(),
  "../../packages/ui/src/components"
);

export const dynamic = "force-static";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const registryPath = join(REGISTRY_DIR, `${slug}.json`);

    if (!existsSync(registryPath)) {
      return NextResponse.json(
        { error: `Component "${slug}" not found` },
        { status: 404 }
      );
    }

    const registry = JSON.parse(readFileSync(registryPath, "utf-8"));

    // Read all component files
    const allFiles: Record<string, string> = {};
    for (const style of registry.styles) {
      for (const filePath of style.files) {
        if (!allFiles[filePath]) {
          const fullPath = join(COMPONENTS_DIR, filePath);
          if (existsSync(fullPath)) {
            allFiles[filePath] = readFileSync(fullPath, "utf-8");
          }
        }
      }
    }

    // Also include shared files
    const libDir = join(
      process.cwd(),
      "../../packages/ui/src"
    );
    if (existsSync(libDir)) {
      const walkLib = (dir: string, prefix: string) => {
        const entries = readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const rel = join(prefix, entry.name);
          const full = join(dir, entry.name);
          if (entry.isDirectory()) {
            walkLib(full, rel);
          } else if (
            entry.name.endsWith(".ts") ||
            entry.name.endsWith(".tsx")
          ) {
            const relPosix = rel.replace(/\\/g, "/");
            if (!allFiles[relPosix]) {
              allFiles[relPosix] = readFileSync(full, "utf-8");
            }
          }
        }
      };
      walkLib(libDir, "src");
    }

    return NextResponse.json(
      {
        ...registry,
        files: allFiles,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, max-age=3600",
        },
      }
    );
  } catch (error) {
    console.error(`Failed to fetch component "${slug}":`, error);
    return NextResponse.json(
      { error: "Failed to fetch component" },
      { status: 500 }
    );
  }
}
