import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar } from "../../components/landing/navbar";
import { SiteFooter } from "../../components/landing/closing";
import { RequestsView } from "../../components/request/requests-view";
import { getBoard } from "@/lib/requests";

export const metadata: Metadata = {
  title: "Component Requests",
  description:
    "Ask Devigner UI for the animated React component you're missing, and vote on what others asked for: pending, in review, in queue or built.",
  alternates: { canonical: "/requests" },
};

// BOARD_TTL in lib/requests.ts. Next reads this statically, so it has to be
// a literal; a new request refreshes the board at once anyway.
export const revalidate = 300;

export default async function RequestsPage() {
  const board = await getBoard();

  return (
    <div className="min-h-dvh bg-background">
      <Navbar autoHide />
      <main className="relative overflow-hidden pt-32 pb-24 sm:pt-40">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-120 bg-[radial-gradient(50%_60%_at_20%_0%,var(--glow),transparent_70%)]"
        />
        <div className="relative mx-auto max-w-4xl px-5">
          {/* The view reads ?new from the URL; Suspense keeps the page static. */}
          <Suspense>
            <RequestsView posts={board.ok ? board.posts : []} ok={board.ok} />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
