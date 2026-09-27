"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IconAdd } from "@devigner-ui/icons";
import type { RequestPost } from "@/lib/requests";
import { SOUND_KEY, cue, setEnabled } from "@/lib/sound";
import { RequestBoard } from "./request-board";
import { RequestDialog } from "./request-dialog";
import { RequestForm } from "./request-form";
import { RequestSuccess } from "./request-success";

/** The requests page: heading, board and the new-request dialog. `?new`
 *  opens the dialog on arrival (and `?name=` prefills it), which is how the
 *  catalog, the dock panel and the old /request URL all link in. */
export function RequestsView({ posts, ok }: { posts: RequestPost[]; ok: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  // Remounts the form, so a reopened dialog starts clean.
  const [session, setSession] = useState(0);
  // Set once a request lands: the dialog swaps the form for the note.
  const [sent, setSent] = useState<string | null>(null);

  // Sound follows the choice made with the details page's dock toggle, on
  // unless turned off there, and only while this page is open.
  useEffect(() => {
    let on = true;
    try {
      on = localStorage.getItem(SOUND_KEY) !== "off";
    } catch {}
    setEnabled(on);
    return () => setEnabled(false);
  }, []);

  const request = useCallback((prefill?: string) => {
    setName(prefill ?? "");
    setSent(null);
    setSession((n) => n + 1);
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!params.has("new")) return;
    request(params.get("name")?.slice(0, 80) ?? undefined);
    // Drop the query so a refresh or Back does not reopen it.
    router.replace(pathname, { scroll: false });
  }, [params, pathname, router, request]);

  const close = useCallback(() => {
    cue("droplet");
    setOpen(false);
  }, []);

  const known = useMemo(
    () =>
      posts.map((p) => ({
        title: p.title,
        url: p.url,
        votes: p.votes,
        built: p.status === "published",
      })),
    [posts],
  );
  const built = posts.filter((p) => p.status === "published").length;

  return (
    <>
      <div className="flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[clamp(2.25rem,4.5vw,3.25rem)] leading-[1.04] font-semibold tracking-[-0.055em] text-balance text-foreground">
            Component <span className="accent-word">requests</span>
          </h1>
          <p className="mt-5 max-w-lg text-[17px]/7 text-pretty text-text-secondary">
            Ask for what you&apos;re missing and vote on what others asked for.
            The most wanted get built first.
          </p>
          {ok && posts.length > 0 && (
            <p className="mt-4 text-[13.5px] text-text-muted">
              <span className="font-medium text-foreground tabular-nums">{posts.length}</span>{" "}
              {posts.length === 1 ? "request" : "requests"},{" "}
              <span className="font-medium text-foreground tabular-nums">{built}</span> built so far
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => request()}
          className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 self-start rounded-full bg-foreground pr-5 pl-4 text-[14.5px] font-medium text-background transition-transform duration-150 ease-out active:scale-[0.97] sm:self-auto"
        >
          <IconAdd aria-hidden className="size-4.5" />
          Request a component
        </button>
      </div>

      {ok ? (
        <RequestBoard posts={posts} onRequest={request} />
      ) : (
        <p className="mt-12 rounded-2xl border border-dashed border-border px-6 py-12 text-center text-[15px] text-text-secondary">
          The board can&apos;t be loaded right now. Requests still go through.
        </p>
      )}

      <RequestDialog
        open={open}
        onClose={close}
        title={sent ? "Request sent" : "Request a component"}
        view={sent ? "sent" : "form"}
        bare={!!sent}
        size={sent ? "sm" : "md"}
      >
        {sent ? (
          <RequestSuccess name={sent} onClose={close} />
        ) : (
          <RequestForm
            key={session}
            initialName={name}
            known={known}
            onSent={(title) => {
              setSent(title);
              // The route already busted the board's cache; this re-renders it.
              router.refresh();
            }}
          />
        )}
      </RequestDialog>
    </>
  );
}
