import { NextResponse } from "next/server";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

const REGISTRY_DIR = join(process.cwd(), "registry");

export const dynamic = "force-static";

export async function GET() {
  try {
    if (!existsSync(REGISTRY_DIR)) {
      return NextResponse.json(
        { version: "0.1.0", components: [] },
        { headers: { "Cache-Control": "public, s-maxage=3600, max-age=3600" } }
      );
    }

    const files = readdirSync(REGISTRY_DIR).filter(
      (f) => f.endsWith(".json") && f !== "index.json"
    );

    const components = files.map((file) => {
      const raw = readFileSync(join(REGISTRY_DIR, file), "utf-8");
      const data = JSON.parse(raw);
      return {
        name: data.name,
        description: data.description,
        category: data.category,
        styles: data.styles.map((s: any) => ({
          slug: s.slug,
          name: s.name,
          description: s.description,
          files: s.files,
          dependencies: s.dependencies,
        })),
        dependencies: data.dependencies || [],
      };
    });

    return NextResponse.json(
      {
        version: "0.1.0",
        components,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, max-age=3600",
        },
      }
    );
  } catch (error) {
    console.error("Failed to generate registry index:", error);
    return NextResponse.json(
      { error: "Failed to generate registry" },
      { status: 500 }
    );
  }
}
