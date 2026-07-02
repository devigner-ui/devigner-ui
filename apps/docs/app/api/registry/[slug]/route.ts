import { NextResponse } from "next/server";
import { components, getRegistryComponent } from "@/lib/registry";

export const dynamic = "force-static";

export function generateStaticParams() {
  return Object.keys(components).map((slug) => ({ slug }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const component = getRegistryComponent(slug);

  if (!component) {
    return NextResponse.json(
      { error: `Component "${slug}" not found` },
      { status: 404 }
    );
  }

  return NextResponse.json(component, {
    headers: { "Cache-Control": "public, s-maxage=3600, max-age=3600" },
  });
}
