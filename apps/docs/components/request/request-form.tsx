"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  IconAdd,
  IconArrowRight,
  IconCheck,
  IconClose,
  IconGallery,
  IconLike,
  IconLink,
  IconHourglass,
  IconSpinner,
  IconTrash,
} from "@devigner-ui/icons";
import { EASE_OUT, SPRING_SWAP } from "devignerui/motion";
import { cn } from "cn";
import {
  IMAGES,
  MAX_LINKS,
  SLOWMODE_S,
  discordUsername,
} from "@/lib/request-limits";
import { componentNames } from "@/lib/registry-names";
import { cue, play } from "@/lib/sound";
import { DISCORD_URL, LogoDiscord } from "../brand-logos";
import { Turnstile } from "./turnstile";

const FIELD =
  "w-full rounded-xl border border-border bg-background-100 px-3.5 text-[14.5px] text-foreground outline-none transition-colors duration-200 ease-out placeholder:text-text-muted hover:border-border-hover focus-visible:border-brand aria-invalid:border-destructive aria-invalid:focus-visible:border-destructive";
const LABEL = "text-[13.5px] font-medium text-foreground";
const HINT = "font-normal text-text-muted";
const NOTE = "text-[12.5px] text-text-muted";
const NAME_MIN = 2;
const DETAILS_MIN = 10;
const DETAILS_MAX = 1000;

/** When Send opens again, kept across reopening the dialog and reloads. */
const COOLDOWN_KEY = "devigner:request-cooldown";
const readCooldown = () => {
  try {
    return Number(localStorage.getItem(COOLDOWN_KEY)) || 0;
  } catch {
    return 0;
  }
};

/** Seconds left on the cooldown, ticking down to 0. */
function useCooldown() {
  const [until, setUntil] = useState(readCooldown);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (until <= now) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [until, now]);
  const start = (seconds: number) => {
    const at = Date.now() + seconds * 1000;
    try {
      localStorage.setItem(COOLDOWN_KEY, String(at));
    } catch {}
    setNow(Date.now());
    setUntil(at);
  };
  return [Math.max(0, Math.ceil((until - now) / 1000)), start] as const;
}

type State =
  | { kind: "idle" | "sending" | "sent" }
  | { kind: "error"; message: string };

/** Where the Discord username check stands. `unknown` means the lookup
 *  itself failed: the name can't be confirmed, so it can't be sent. */
type Handle =
  | { kind: "idle" | "checking" | "invalid" | "missing" | "unknown" }
  | {
      kind: "member";
      username: string;
      displayName: string;
      avatar: string | null;
    };

type Field = "name" | "details" | "link" | "handle";

/** Requests already on the board, for spotting a duplicate while typing. */
export type KnownRequest = {
  title: string;
  url: string;
  votes: number;
  built: boolean;
};

/** Words that say nothing about which component is meant. */
const FILLER = new Set([
  "a",
  "an",
  "the",
  "ui",
  "component",
  "animated",
  "button",
  "card",
  "with",
]);
const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w.length > 1 && !FILLER.has(w));

/** Loose on purpose: showing a near miss costs a glance, missing a real
 *  duplicate costs a second post. */
// ponytail: word overlap, no fuzzy matching; typos slip through.
function similar(query: string, title: string) {
  const q = words(query);
  const t = words(title);
  if (!q.length || !t.length) return false;
  // A typed word may be unfinished ("comm" for "command"), never the reverse:
  // "timeline" must not match "Time".
  const hits = q.filter((w) => t.some((x) => x.startsWith(w))).length;
  return hits / q.length >= 0.5;
}

/** A typed link, made whole: "dribbble.com/x" becomes "https://dribbble.com/x".
 *  null when it is not a web address at all. */
function asLink(raw: string) {
  const v = raw.trim();
  if (!v || v.length > 300 || /\s/.test(v)) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    // A real host: a dot, a top-level part of two letters or more.
    return /\.[a-z]{2,}$/i.test(url.hostname) ? url.href : null;
  } catch {
    return null;
  }
}

async function lookup(username: string, signal?: AbortSignal): Promise<Handle> {
  try {
    const res = await fetch(
      `/api/request/discord-user?u=${encodeURIComponent(username)}`,
      { signal },
    );
    const data = await res.json();
    if (data.status === "member")
      return {
        kind: "member",
        username: data.member.username,
        displayName: data.member.displayName,
        avatar: data.member.avatar,
      };
    if (data.status === "missing" || data.status === "invalid")
      return { kind: data.status };
    return { kind: "unknown" };
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    return { kind: "unknown" };
  }
}

/** Height reveals in the form. Tweens, not springs: a spring's long settle
 *  on height reads as the content dragging to a stop. Closing is quicker
 *  than opening; nobody waits to watch something leave. */
const OPEN = { duration: 0.24, ease: EASE_OUT } as const;
const CLOSE = { duration: 0.18, ease: EASE_OUT } as const;
const FADE = { duration: 0.15, ease: EASE_OUT } as const;
const reveal = (reduce: boolean | null) =>
  reduce
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0 },
      }
    : {
        initial: { height: 0, opacity: 0 },
        animate: { height: "auto", opacity: 1, transition: OPEN },
        exit: { height: 0, opacity: 0, transition: CLOSE },
      };

const imagesOf = (files: Iterable<File>) =>
  Array.from(files).filter((f) => f.type.startsWith("image/"));

/** Re-encodes an image at full resolution: WebP, or JPEG on a white ground
 *  where the browser has no WebP encoder (Safari). Null when it can't. */
async function reencode(file: File, quality: number): Promise<File | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const encode = (type: string) =>
      new Promise<Blob | null>((r) => canvas.toBlob(r, type, quality));
    let blob = await encode("image/webp");
    if (blob?.type !== "image/webp") {
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      blob = await encode("image/jpeg");
    }
    if (!blob) return null;
    const ext = blob.type === "image/webp" ? ".webp" : ".jpg";
    return new File([blob], file.name.replace(/\.\w+$/, "") + ext, {
      type: blob.type,
    });
  } catch {
    return null;
  }
}

/** Keeps the screenshots under Vercel's body limit. Originals go up as they
 *  are when they fit; otherwise the biggest are re-encoded, from the original
 *  each time and at the highest quality that fits, dimensions untouched.
 *  GIFs are left alone, re-encoding would drop their animation. */
async function fitImages(files: File[]): Promise<File[]> {
  const out = [...files];
  const total = () => out.reduce((n, f) => n + f.size, 0);
  const biggest = out
    .map((_, i) => i)
    .filter((i) => files[i].type !== "image/gif")
    .sort((a, b) => files[b].size - files[a].size);
  for (const quality of [0.92, 0.85, 0.75]) {
    for (const i of biggest) {
      if (total() <= IMAGES.total) return out;
      const smaller = await reencode(files[i], quality);
      if (smaller && smaller.size < out[i].size) out[i] = smaller;
    }
  }
  return out;
}

/** One line under a field. An error replaces the hint in the same spot, so
 *  the form does not shift when one appears; keep both to a single line. */
function Note({
  id,
  error,
  children,
}: {
  id: string;
  error?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  if (!error && !children) return null;
  return (
    <p
      id={id}
      className={cn(
        NOTE,
        "transition-colors duration-150 ease-out",
        error && "text-destructive",
      )}
      aria-live="polite"
    >
      <motion.span
        key={error ? "error" : "hint"}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={FADE}
        className="block"
      >
        {error || children}
      </motion.span>
    </p>
  );
}

export function RequestForm({
  initialName = "",
  known,
  onSent,
}: {
  initialName?: string;
  known: KnownRequest[];
  /** Fired once Discord has the post, with the name it went up under. */
  onSent: (name: string) => void;
}) {
  const reduce = useReducedMotion();
  const [state, setState] = useState<State>({ kind: "idle" });
  const [name, setName] = useState(initialName);
  const [details, setDetails] = useState("");
  const [images, setImages] = useState<{ file: File; url: string }[]>([]);
  const [dragging, setDragging] = useState(false);
  const [links, setLinks] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [handleText, setHandleText] = useState("");
  const [handle, setHandle] = useState<Handle>({ kind: "idle" });
  // A field shows its error once it has been left, or once Send was tried;
  // after that it re-checks live while being fixed.
  const [touched, setTouched] = useState<Set<Field>>(new Set());
  const [tried, setTried] = useState(false);
  // Bumped after each send: a Turnstile token works once.
  const [attempt, setAttempt] = useState(0);
  // Discord's Slowmode on the forum: one post per SLOWMODE_S.
  const [wait, cooldown] = useCooldown();
  const picker = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const touch = (f: Field) =>
    setTouched((t) => (t.has(f) ? t : new Set(t).add(f)));
  const shows = (f: Field) => tried || touched.has(f);

  // Previews hold object URLs; free them when the form goes.
  const live = useRef(images);
  live.current = images;
  useEffect(
    () => () => live.current.forEach((i) => URL.revokeObjectURL(i.url)),
    [],
  );

  const username = discordUsername(handleText);
  const draftLink = asLink(draft);

  const errors: Record<Field, React.ReactNode | null> = {
    name: name.trim().length < NAME_MIN ? "Give the component a name." : null,
    details:
      details.trim().length < DETAILS_MIN
        ? details.trim()
          ? `A little more, please: at least ${DETAILS_MIN} characters.`
          : "Tell us what it should do."
        : null,
    link:
      draft.trim() && !draftLink
        ? "That doesn't look like a web link, like dribbble.com/shots/..."
        : null,
    handle: !handleText.trim() ? (
      <>
        Add your Discord username. Not in our server yet?{" "}
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Join first
        </a>
        .
      </>
    ) : !username ? (
      "Discord usernames are 2 to 32 characters: lowercase letters, numbers, _ and ."
    ) : handle.kind === "unknown" ? (
      "Couldn't check that just now. Try again in a moment."
    ) : handle.kind === "missing" ? (
      <>
        No member has the username @{username}. Nicknames don&apos;t count;{" "}
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline underline-offset-4"
        >
          join
        </a>{" "}
        if you&apos;re not in yet.
      </>
    ) : null,
  };

  // Once the handle has been left, keep checking it as it is edited, a
  // beat after typing stops. Each new value cancels the check before it.
  const handleActive = touched.has("handle") || tried;
  useEffect(() => {
    if (!handleActive) return;
    if (!username) {
      setHandle({ kind: handleText.trim() ? "invalid" : "idle" });
      return;
    }
    const ctrl = new AbortController();
    setHandle({ kind: "checking" });
    const timer = setTimeout(() => {
      lookup(username, ctrl.signal).then(setHandle, () => {});
    }, 350);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [username, handleText, handleActive]);

  // The lookup answers after the field was left, so it gets its own sound:
  // "not a member" the same error a field gets when left with a problem, a
  // found member the lock-on that says it checked out.
  // A lookup made by Send itself stays quiet: the send sounds follow at once.
  const quietLookup = useRef(false);
  useEffect(() => {
    if (!handleActive || quietLookup.current) return;
    if (handle.kind === "member") play("notification");
    else if (handle.kind === "missing" || handle.kind === "unknown")
      play("error");
  }, [handle.kind, handleActive]);

  /** Leaving a field shows its error, if it has one; the error sound comes
   *  with it, but only when the error first appears, not on every exit. */
  const leave = (f: Field) => {
    if (!shows(f) && errors[f]) play("error");
    touch(f);
  };

  const matches = useMemo(() => {
    if (name.trim().length < 3) return null;
    const built = componentNames
      .filter((c) => similar(name, c.name))
      .slice(0, 2);
    const asked = known
      .filter((r) => !r.built && similar(name, r.title))
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 3);
    return built.length || asked.length ? { built, asked } : null;
  }, [name, known]);

  const addImages = (files: File[]) => {
    if (!files.length) return;
    const ok = files.filter(
      (f) =>
        (IMAGES.types as readonly string[]).includes(f.type) &&
        f.size <= IMAGES.bytes,
    );
    setState(
      ok.length < files.length
        ? {
            kind: "error",
            message: "Images must be PNG, JPG, WebP or GIF, under 3 MB each.",
          }
        : { kind: "idle" },
    );
    // Drops and pastes carry no pointerdown, so this plays directly.
    if (ok.length) play("tick");
    setImages((cur) => {
      const room = IMAGES.max - cur.length;
      return [
        ...cur,
        ...ok
          .slice(0, room)
          .map((file) => ({ file, url: URL.createObjectURL(file) })),
      ];
    });
  };
  const removeImage = (url: string) => {
    cue("close");
    URL.revokeObjectURL(url);
    setImages((cur) => cur.filter((i) => i.url !== url));
  };

  const addLink = () => {
    if (!draftLink) {
      touch("link");
      return;
    }
    cue("tick");
    setLinks((cur) =>
      cur.includes(draftLink) ? cur : [...cur, draftLink].slice(0, MAX_LINKS),
    );
    setDraft("");
    setTouched((t) => {
      const n = new Set(t);
      n.delete("link");
      return n;
    });
  };

  const focusField = (f: Field) =>
    formRef.current?.querySelector<HTMLElement>(`#request-${f}`)?.focus();

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (wait) return;
    setTried(true);
    const form = new FormData(e.currentTarget);

    const order: Field[] = ["name", "details", "link", "handle"];
    const first = order.find((f) => errors[f]);
    if (first) {
      cue("error");
      return focusField(first);
    }

    // A handle not yet looked up is looked up now, before anything is sent.
    let h = handle;
    if (username && (h.kind === "idle" || h.kind === "checking")) {
      quietLookup.current = true;
      setHandle({ kind: "checking" });
      h = await lookup(username).catch(() => ({ kind: "unknown" }) as Handle);
      setHandle(h);
      // After the render that shows the result, so its sound is skipped.
      requestAnimationFrame(() => (quietLookup.current = false));
    }
    if (username && h.kind !== "member") {
      cue("error");
      return focusField("handle");
    }

    // A valid link typed but never added still counts.
    if (draftLink && !links.includes(draftLink) && links.length < MAX_LINKS)
      form.set("links", [...links, draftLink].join("\n"));
    setState({ kind: "sending" });
    const tooBig =
      "Screenshots are too large together. Remove one and try again.";
    try {
      const files = await fitImages(images.map((i) => i.file));
      if (files.reduce((n, f) => n + f.size, 0) > IMAGES.total)
        throw new Error(tooBig);
      files.forEach((f) => form.append("images", f));
      const res = await fetch("/api/request", { method: "POST", body: form });
      // Vercel refuses an oversized body before the route runs, with no JSON.
      if (res.status === 413) throw new Error(tooBig);
      const data = await res.json().catch(() => ({}));
      if (res.status === 429 && data.retryAfter) cooldown(data.retryAfter);
      if (!res.ok) throw new Error(data.error);
      cooldown(SLOWMODE_S);
      // An outcome, not keyboard feedback: it plays however Send was pressed.
      play("success");
      setState({ kind: "sent" });
      onSent(name.trim());
    } catch (err) {
      play("error");
      setState({
        kind: "error",
        message:
          (err as Error).message ||
          "Couldn't send it just now. Try again in a minute.",
      });
    } finally {
      setAttempt((n) => n + 1);
    }
  };

  const bad = (f: Field) => shows(f) && !!errors[f];
  const checking = handle.kind === "checking";

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={submit}
      onPaste={(e) => addImages(imagesOf(e.clipboardData.files))}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-6 pt-3 pb-6 sm:px-7">
        <p className="text-[14px]/6 text-text-secondary">
          Describe what you&apos;re missing. It lands in our Discord as a post
          people can vote on.
        </p>

        <div className="flex flex-col gap-2">
          <label htmlFor="request-name" className={LABEL}>
            Component
          </label>
          <input
            id="request-name"
            name="name"
            aria-required
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => leave("name")}
            placeholder="e.g. Command palette"
            autoComplete="off"
            aria-invalid={bad("name")}
            aria-describedby="request-name-note request-matches"
            className={cn(FIELD, "h-11")}
          />
          <Note id="request-name-note" error={bad("name") && errors.name}>
            What you&apos;d call it. Suggestions below if it already exists.
          </Note>
          {/* A duplicate caught here is a vote instead of a second post. */}
          <div id="request-matches" aria-live="polite">
            <AnimatePresence initial={false}>
              {matches && (
                <motion.div {...reveal(reduce)} className="overflow-hidden">
                  <div className="mt-1 flex flex-col gap-0.5 rounded-xl border border-border bg-background-100 p-1.5 text-[13.5px]">
                    {matches.built.map((c) => (
                      <a
                        key={c.slug}
                        href={`/components/${c.slug}`}
                        className="flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-text-secondary transition-colors duration-150 ease-out hover:bg-surface hover:text-foreground"
                      >
                        <span
                          className="size-1.5 shrink-0 rounded-full bg-success"
                          aria-hidden
                        />
                        <span className="truncate">
                          Already built:{" "}
                          <span className="font-medium text-foreground">
                            {c.name}
                          </span>
                        </span>
                        <IconArrowRight
                          aria-hidden
                          className="ml-auto size-3.5 shrink-0 text-brand"
                        />
                      </a>
                    ))}
                    {matches.asked.map((r) => (
                      <a
                        key={r.url}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-text-secondary transition-colors duration-150 ease-out hover:bg-surface hover:text-foreground"
                      >
                        <IconLike aria-hidden className="size-3.5 shrink-0" />
                        <span className="truncate">
                          Already asked:{" "}
                          <span className="font-medium text-foreground">
                            {r.title}
                          </span>
                        </span>
                        <span className="ml-auto shrink-0 text-[12.5px] text-text-muted">
                          Vote instead
                        </span>
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="request-details" className={LABEL}>
              What should it do?
            </label>
            <span className="font-mono text-[11.5px] text-text-muted tabular-nums">
              {details.length}/{DETAILS_MAX}
            </span>
          </div>
          <textarea
            id="request-details"
            name="details"
            aria-required
            rows={4}
            maxLength={DETAILS_MAX}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            onBlur={() => leave("details")}
            placeholder="How it behaves, where you'd use it."
            aria-invalid={bad("details")}
            aria-describedby="request-details-note"
            className={cn(FIELD, "resize-none py-3")}
          />
          <Note
            id="request-details-note"
            error={bad("details") && errors.details}
          >
            How it behaves and where you&apos;d use it, in a sentence or two.
          </Note>
        </div>

        <div className="flex flex-col gap-2">
          <span className={LABEL}>
            Screenshots{" "}
            <span className={HINT}>Optional, up to {IMAGES.max}</span>
          </span>
          {/* One fixed-height strip for both states, so the form does not jump
              when the first image lands. All of it takes drops. */}
          <div
            className="flex h-24 gap-2"
            onDragOver={(e) => {
              e.preventDefault();
              if (images.length < IMAGES.max) setDragging(true);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node))
                setDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addImages(imagesOf(e.dataTransfer.files));
            }}
          >
            <AnimatePresence initial={false} mode="popLayout">
              {images.map((img) => (
                <motion.div
                  key={img.url}
                  layout={reduce ? false : "position"}
                  initial={
                    reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92 }
                  }
                  animate={{ opacity: 1, scale: 1, transition: OPEN }}
                  exit={{
                    opacity: 0,
                    scale: reduce ? 1 : 0.92,
                    transition: CLOSE,
                  }}
                  transition={OPEN}
                  className="relative aspect-square h-full shrink-0 overflow-hidden rounded-xl border border-border"
                >
                  <img
                    src={img.url}
                    alt=""
                    className="size-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(img.url)}
                    aria-label={`Remove ${img.file.name}`}
                    className="absolute top-1.5 right-1.5 grid size-6 cursor-pointer place-items-center rounded-full bg-background/85 text-foreground backdrop-blur-sm transition-transform duration-150 ease-out active:scale-[0.9]"
                  >
                    <IconClose aria-hidden className="size-3.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {images.length < IMAGES.max && (
              // The whole strip while empty; once images are in, one more
              // tile the same size as them.
              <button
                type="button"
                onClick={() => picker.current?.click()}
                className={cn(
                  "flex h-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed text-center transition-colors duration-150 ease-out bg-background-100",
                  images.length
                    ? "aspect-square shrink-0 px-2 text-[12px]"
                    : "flex-1 px-4 text-[13px]",
                  dragging
                    ? "border-brand bg-brand/5 text-foreground"
                    : "border-border text-text-muted hover:border-border-hover hover:text-text-secondary",
                )}
              >
                <IconGallery aria-hidden className="size-5 shrink-0" />
                {images.length === 0 ? (
                  <span>
                    Drop, paste or{" "}
                    <span className="text-foreground underline underline-offset-4">
                      browse
                    </span>
                    <span className="max-sm:hidden">
                      {" "}
                      · PNG, JPG, WebP or GIF, 3 MB each
                    </span>
                  </span>
                ) : (
                  <span>Add {IMAGES.max - images.length} more</span>
                )}
              </button>
            )}
          </div>
          <input
            ref={picker}
            type="file"
            accept={IMAGES.types.join(",")}
            multiple
            hidden
            onChange={(e) => {
              addImages(imagesOf(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="request-link" className={LABEL}>
            References{" "}
            <span className={HINT}>Optional, up to {MAX_LINKS} links</span>
          </label>
          {/* No gap here: each row carries its own space below it (pb-2), so
              the space shrinks with the row. A flex gap belongs to the parent,
              stays until the row unmounts, then snaps shut - the second jump
              after a delete. */}
          <div>
            <AnimatePresence initial={false}>
              {links.map((l) => (
                <motion.div
                  key={l}
                  {...reveal(reduce)}
                  className="-mx-1 overflow-hidden px-1"
                >
                  <div className="pb-2">
                    <div className="flex h-11 items-center gap-2.5 rounded-xl border border-border bg-background-100 pr-1.5 pl-3.5">
                      <IconLink
                        aria-hidden
                        className="size-4 shrink-0 text-text-muted"
                      />
                      <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-text-secondary">
                        {l.replace(/^https?:\/\//, "")}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          cue("close");
                          setLinks((cur) => cur.filter((x) => x !== l));
                        }}
                        aria-label={`Remove ${l}`}
                        className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-text-muted transition-[color,background-color,scale] duration-150 ease-out hover:bg-surface hover:text-destructive active:scale-[0.92]"
                      >
                        <IconTrash aria-hidden className="size-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
              {links.length < MAX_LINKS && (
                // The clip box reaches 4px past the field on every side, so the
                // focus ring is not cut off; the negative margin keeps layout.
                <motion.div
                  key="link-input"
                  {...reveal(reduce)}
                  className="-m-1 overflow-hidden p-1"
                >
                  <div className="flex gap-2">
                    <input
                      id="request-link"
                      type="url"
                      inputMode="url"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onBlur={() => draft.trim() && leave("link")}
                      onKeyDown={(e) => {
                        // Enter adds the link instead of sending the whole form.
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addLink();
                        }
                      }}
                      placeholder="https://example.com/inspiration"
                      aria-invalid={bad("link")}
                      aria-describedby="request-link-note"
                      className={cn(
                        FIELD,
                        "h-11 min-w-0 flex-1 font-mono text-[13px]",
                      )}
                    />
                    {/* Only a real link can be added. Hover and press feedback are
                        on `enabled:` so a disabled button never looks pressable. */}
                    <button
                      type="button"
                      onClick={addLink}
                      disabled={!draftLink}
                      className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-border pr-3.5 pl-2.5 text-[13.5px] font-medium text-text-secondary transition-[color,border-color,scale,opacity] duration-150 ease-out enabled:cursor-pointer enabled:hover:border-border-hover enabled:hover:text-foreground enabled:active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40"
                    >
                      <IconAdd aria-hidden className="size-4" />
                      Add
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Note id="request-link-note" error={bad("link") && errors.link}>
            {links.length < MAX_LINKS
              ? "Something similar you've seen. Paste it, then press Add or Enter."
              : `That's the most links, ${MAX_LINKS}. Remove one to add another.`}
          </Note>
          <input type="hidden" name="links" value={links.join("\n")} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="request-handle" className={LABEL}>
            Discord username{" "}
            <span className={HINT}>So we can talk it through with you</span>
          </label>
          <div className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[14.5px] text-text-muted"
            >
              @
            </span>
            <input
              id="request-handle"
              name="contact"
              aria-required
              maxLength={40}
              value={handleText}
              onChange={(e) => setHandleText(e.target.value)}
              onBlur={() => leave("handle")}
              placeholder="your username"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={bad("handle")}
              aria-describedby="request-handle-note"
              className={cn(FIELD, "h-11 pr-12 pl-8")}
            />
            <span className="pointer-events-none absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center">
              <AnimatePresence initial={false} mode="popLayout">
                {(checking || (handle.kind === "member" && username)) && (
                  <motion.span
                    key={checking ? "checking" : "member"}
                    initial={
                      reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }
                    }
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                    transition={reduce ? { duration: 0.1 } : SPRING_SWAP}
                    className="grid place-items-center"
                  >
                    {checking ? (
                      <IconSpinner
                        aria-hidden
                        className="size-4 animate-spin text-text-muted"
                      />
                    ) : handle.kind === "member" && handle.avatar ? (
                      <img
                        src={handle.avatar}
                        alt=""
                        className="size-7 rounded-full ring-1 ring-border"
                      />
                    ) : (
                      <IconCheck aria-hidden className="size-4 text-success" />
                    )}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </div>
          <Note id="request-handle-note" error={bad("handle") && errors.handle}>
            {checking ? (
              "Looking you up in our Discord..."
            ) : handle.kind === "member" && username ? (
              <span className="inline-flex items-center gap-1.5 text-success">
                <IconCheck aria-hidden className="size-3.5" />
                Found @{handle.username}
                {handle.displayName !== handle.username &&
                  ` (${handle.displayName})`}{" "}
                in our Discord.
              </span>
            ) : (
              <>
                Your account username, not a nickname. You need to be in{" "}
                <a
                  href={DISCORD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-secondary underline underline-offset-4 transition-colors duration-150 ease-out hover:text-foreground"
                >
                  our Discord
                </a>
                .
              </>
            )}
          </Note>
        </div>

        {/* Honeypot: hidden from people and screen readers, filled by bots. */}
        <input
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="absolute left-[-9999px] size-px opacity-0"
        />
        <Turnstile attempt={attempt} />
      </div>

      <div className="flex shrink-0 items-center justify-between gap-4 border-t border-border bg-background px-6 py-4 sm:px-7">
        <p aria-live="polite" className="min-w-0 text-[13px]">
          {state.kind === "error" ? (
            <span className="text-destructive">{state.message}</span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-text-muted">
              <LogoDiscord className="size-3.5 shrink-0" />
              Posts to #🇷🇪🇶🇺🇪🇸🇹-🇺🇮
            </span>
          )}
        </p>
        <button
          type="submit"
          disabled={state.kind === "sending" || wait > 0}
          className="group inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-foreground pr-4 pl-5 text-[14.5px] font-medium text-background transition-[scale,opacity] duration-150 ease-out enabled:cursor-pointer enabled:active:scale-[0.97] disabled:opacity-70"
        >
          {state.kind === "sending" ? (
            "Sending"
          ) : wait ? (
            <span className="tabular-nums">Send in {wait}s</span>
          ) : (
            "Send request"
          )}
          {state.kind === "sending" ? (
            <IconSpinner aria-hidden className="size-4 animate-spin" />
          ) : wait ? (
            <IconHourglass aria-hidden className="size-4" />
          ) : (
            <IconArrowRight
              aria-hidden
              className="size-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
            />
          )}
        </button>
      </div>
    </form>
  );
}
