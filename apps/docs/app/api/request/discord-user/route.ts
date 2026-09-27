import { NextRequest, NextResponse } from "next/server";
import { LOOKUP, rateLimited } from "@/lib/request-guard";
import { discordUsername } from "@/lib/request-limits";
import { findMember } from "@/lib/requests";

/** Checks a Discord username against the server's members, for the request
 *  form's handle field. The send route checks again: this is for feedback. */
export async function GET(req: NextRequest) {
  const username = discordUsername(req.nextUrl.searchParams.get("u") ?? "");
  if (!username) return NextResponse.json({ status: "invalid" });
  // Keeps one visitor from spending the site's share of Discord's search, or
  // walking the member list. The form reads "unknown" as "couldn't check".
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (await rateLimited(ip, LOOKUP))
    return NextResponse.json({ status: "unknown" }, { status: 429 });
  const result = await findMember(username);
  const body = !result
    ? { status: "unknown" }
    : result.found
      ? { status: "member", member: result.member }
      : { status: "missing" };
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
}
