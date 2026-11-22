import { NextResponse } from "next/server";
import { BOARD_TTL, getBoard } from "@/lib/requests";

export const revalidate = 300;

/** The component request board as JSON, for the Devigner Console: the same posts /requests shows, trimmed to what a
 *  queue needs (no details, links or requester handles). Public, like the page; cached as long as the board is. */
export async function GET() {
  const board = await getBoard();
  if (!board.ok) return NextResponse.json({ ok: false, error: board.reason }, { status: 503 });
  const posts = board.posts.map(({ id, title, status, createdAt, replies, votes, url }) => ({
    id,
    title,
    status,
    createdAt,
    replies,
    votes,
    url,
  }));
  return NextResponse.json({ ok: true, posts }, { headers: { "Cache-Control": `public, max-age=${BOARD_TTL}` } });
}
