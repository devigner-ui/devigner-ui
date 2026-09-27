/** The component request board, read from the Discord requests forum.
 *  Server only: it holds the bot token. Status lives in each post's forum
 *  tags, which moderators change by hand in Discord; this only reads them. */

import { components } from "@/lib/registry";

export const STATUSES = ["pending", "review", "queue", "published"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<Status, string> = {
  pending: "Pending",
  review: "In review",
  queue: "In queue",
  published: "Built",
};

export type RequestPost = {
  id: string;
  title: string;
  status: Status;
  createdAt: number;
  replies: number;
  /** Reactions with the forum's default emoji (the vote button on a post). */
  votes: number;
  url: string;
  details?: string;
  /** The handle the requester left for credit. Shown publicly. */
  requester?: string;
  links: string[];
  images: { url: string; width?: number; height?: number }[];
  /** Set when a shipped component names this post as its `requestId`. */
  component?: { slug: string; name: string };
};

export type Board =
  | { ok: true; posts: RequestPost[] }
  | { ok: false; reason: "not-configured" | "unavailable" };

/** How long fetched board data is reused, seconds. Tags change by hand, a few
 *  times a day at most; a new request busts it at once through BOARD_TAG. */
export const BOARD_TTL = 300;
export const BOARD_TAG = "requests";

/** Posts whose first message is read for votes and details. Each is one
 *  Discord call, so the board is capped rather than paged. */
// ponytail: newest 60 posts get full detail; page when the forum outgrows it.
const DETAILED = 60;

const API = "https://discord.com/api/v10";

/** Tag name to status. Loose on purpose, so renaming "Published" to
 *  "Built / Published" in Discord keeps working. */
function statusOf(tagNames: string[]): Status {
  const names = tagNames.map((n) => n.toLowerCase());
  const has = (...words: string[]) => names.some((n) => words.some((w) => n.includes(w)));
  if (has("publish", "built", "shipped")) return "published";
  if (has("queue")) return "queue";
  if (has("review")) return "review";
  return "pending";
}

/** Discord ids carry their creation time. */
const createdAt = (id: string) => Number(BigInt(id) >> BigInt(22)) + 1420070400000;

/** Shipped components by the request post they answered. */
const shipped = new Map(
  Object.values(components)
    .filter((c) => c.requestId)
    .map((c) => [c.requestId!, { slug: c.slug, name: c.name }]),
);

type Thread = {
  id: string;
  name: string;
  parent_id: string;
  applied_tags?: string[];
  message_count?: number;
};

type Message = {
  content?: string;
  embeds?: { description?: string; fields?: { name: string; value: string }[] }[];
  attachments?: { url: string; content_type?: string; width?: number; height?: number }[];
  reactions?: { count: number; emoji: { id: string | null; name: string | null } }[];
};

type Forum = {
  available_tags?: { id: string; name: string }[];
  default_reaction_emoji?: { emoji_id: string | null; emoji_name: string | null } | null;
};

/** The Contact field reads "<@id> (@username)": Discord renders the first
 *  part as a clickable mention, the site shows the second. Older posts hold
 *  just "@username". */
function requesterOf(value: string | undefined) {
  if (!value) return undefined;
  return value.match(/\((@[^)]+)\)/)?.[1] ?? (value.startsWith("@") ? value : undefined);
}

/** What the webhook writes when there were no details. */
const NO_DETAILS = "_No details given._";

export async function getBoard(): Promise<Board> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const webhook = process.env.DISCORD_REQUESTS_WEBHOOK_URL;
  if (!token || !webhook) {
    // Visitors see the same "can't load" note either way; the log says which.
    console.warn("Request board: set DISCORD_BOT_TOKEN and DISCORD_REQUESTS_WEBHOOK_URL.");
    return { ok: false, reason: "not-configured" };
  }

  const get = async <T,>(url: string, auth = true): Promise<T> => {
    const res = await fetch(url, {
      headers: auth ? { Authorization: `Bot ${token}` } : {},
      next: { revalidate: BOARD_TTL, tags: [BOARD_TAG] },
    });
    if (!res.ok)
      throw new Error(`Discord ${res.status} for ${url.replace(/webhooks\/.*/, "webhooks/...")}`);
    return res.json() as Promise<T>;
  };

  try {
    // The webhook already knows which forum and server it posts to, so
    // neither needs its own env var.
    const hook = await get<{ channel_id: string; guild_id: string }>(webhook, false);
    const [forum, active, archived] = await Promise.all([
      get<Forum>(`${API}/channels/${hook.channel_id}`),
      get<{ threads: Thread[] }>(`${API}/guilds/${hook.guild_id}/threads/active`),
      // Needs Read Message History on the forum. Without it the board still
      // shows open posts rather than failing outright.
      get<{ threads: Thread[] }>(
        `${API}/channels/${hook.channel_id}/threads/archived/public?limit=100`,
      ).catch((err) => {
        console.warn("Request board: archived posts skipped.", err);
        return { threads: [] as Thread[] };
      }),
    ]);

    const tagName = new Map((forum.available_tags ?? []).map((t) => [t.id, t.name]));
    const vote = forum.default_reaction_emoji;
    const isVote = (e: { id: string | null; name: string | null }) =>
      vote ? (vote.emoji_id ? e.id === vote.emoji_id : e.name === vote.emoji_name) : true;

    const seen = new Set<string>();
    const threads = [...active.threads, ...archived.threads]
      .filter((t) => t.parent_id === hook.channel_id && !seen.has(t.id) && seen.add(t.id))
      .sort((a, b) => createdAt(b.id) - createdAt(a.id));

    // A forum post's first message shares the post's id.
    const starters = await Promise.all(
      threads.map((t, i) =>
        i < DETAILED
          ? get<Message>(`${API}/channels/${t.id}/messages/${t.id}`).catch(() => null)
          : null,
      ),
    );

    // A message read back with no text, embed or files at all means Discord
    // withheld it: the bot lacks the Message Content intent.
    if (starters.some((m) => m && !m.content && !m.embeds?.length && !m.attachments?.length))
      console.warn(
        "Request board: posts came back empty. Turn on Message Content Intent (Developer Portal > Bot > Privileged Gateway Intents).",
      );

    const posts = threads.map((t, i): RequestPost => {
      const m = starters[i];
      const embed = m?.embeds?.[0];
      const field = (name: string) => embed?.fields?.find((f) => f.name === name)?.value;
      const details = embed?.description ?? m?.content;
      return {
        id: t.id,
        title: t.name,
        status: statusOf((t.applied_tags ?? []).map((id) => tagName.get(id) ?? "")),
        createdAt: createdAt(t.id),
        // The opening message counts; replies are the rest.
        replies: Math.max(0, (t.message_count ?? 1) - 1),
        votes: (m?.reactions ?? []).filter((r) => isVote(r.emoji)).reduce((n, r) => n + r.count, 0),
        url: `https://discord.com/channels/${hook.guild_id}/${t.id}`,
        details: details && details !== NO_DETAILS ? details : undefined,
        requester: requesterOf(field("Contact")),
        links: (field("References") ?? "").split("\n").filter((l) => /^https?:\/\//.test(l)),
        images: (m?.attachments ?? [])
          .filter((a) => a.content_type?.startsWith("image/"))
          .map((a) => ({ url: a.url, width: a.width, height: a.height })),
        component: shipped.get(t.id),
      };
    });

    return { ok: true, posts };
  } catch (err) {
    console.error("Request board:", err);
    return { ok: false, reason: "unavailable" };
  }
}

/** The post a shipped component came from, for crediting it on its page. */
export async function getRequestFor(requestId: string | undefined) {
  if (!requestId) return null;
  const board = await getBoard();
  return (board.ok && board.posts.find((p) => p.id === requestId)) || null;
}

export type Member = { id: string; username: string; displayName: string; avatar: string | null };

/** Looks a username up among the server's members: a Discord account can
 *  only be confirmed that way, and it doubles as a nudge to join. null means
 *  the lookup itself failed; callers refuse the name rather than trust it. */
export async function findMember(
  username: string,
): Promise<{ found: true; member: Member } | { found: false } | null> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const webhook = process.env.DISCORD_REQUESTS_WEBHOOK_URL;
  if (!token || !webhook) return null;
  try {
    // Checked: an error body has no guild_id, and searching guilds/undefined
    // is what Discord answers with a bare 400.
    const hookRes = await fetch(webhook, { next: { revalidate: BOARD_TTL } });
    const hook = (await hookRes.json().catch(() => ({}))) as { guild_id?: string };
    if (!hookRes.ok || !hook.guild_id)
      throw new Error(`Discord ${hookRes.status} for webhook: ${JSON.stringify(hook).slice(0, 200)}`);
    // The search matches server nicknames as well as usernames, by prefix,
    // so ask for plenty and keep only an exact account username below: a
    // crowd of nickname matches must not push the real username out.
    const url = `${API}/guilds/${hook.guild_id}/members/search?query=${encodeURIComponent(username)}&limit=100`;
    // Short cache: someone told to join and back a minute later should pass.
    const init = { headers: { Authorization: `Bot ${token}` }, next: { revalidate: 30 } };
    let res = await fetch(url, init);
    // Discord allows about 10 searches per 10 seconds per server. One short
    // wait and retry covers a burst of people typing at once.
    if (res.status === 429) {
      const wait = Number(res.headers.get("retry-after") ?? 1);
      if (wait <= 3) {
        await new Promise((r) => setTimeout(r, wait * 1000));
        res = await fetch(url, init);
      }
    }
    if (!res.ok)
      throw new Error(`Discord ${res.status} for member search: ${(await res.text()).slice(0, 200)}`);
    const list = (await res.json()) as {
      nick?: string | null;
      user: { id: string; username: string; global_name?: string | null; avatar?: string | null };
    }[];
    // Only the account username counts: never a server nickname or display name.
    const m = list.find((x) => x.user.username.toLowerCase() === username);
    if (!m) return { found: false };
    return {
      found: true,
      member: {
        id: m.user.id,
        username: m.user.username,
        displayName: m.nick || m.user.global_name || m.user.username,
        avatar: m.user.avatar
          ? `https://cdn.discordapp.com/avatars/${m.user.id}/${m.user.avatar}.png?size=64`
          : null,
      },
    };
  } catch (err) {
    console.error("Member lookup:", err);
    return null;
  }
}
