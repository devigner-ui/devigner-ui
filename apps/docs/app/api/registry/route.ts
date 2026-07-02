import { NextResponse } from "next/server";
import { getRegistryIndex } from "@/lib/registry";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(getRegistryIndex(), {
    headers: { "Cache-Control": "public, s-maxage=3600, max-age=3600" },
  });
}
