/** Links a shipped component to the Discord request it answers.
 *
 *   pnpm request:publish <slug> <post link or id>            descriptor + registry
 *   pnpm request:publish <slug> <post link or id> --discord  also tags the post
 *     Published and replies in it with the component's link
 *   pnpm request:publish <slug> <post link or id> --test     sends that reply to
 *     the changelog test channel instead, with no ping and no tag change
 *
 * Run it once to set `requestId`, commit and deploy, then run it again with
 * --discord so the link in Discord is already live. Safe to rerun: the id is
 * replaced, not duplicated. See docs/component-requests.md. */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const descriptorsFile = resolve(root, "scripts/registry/descriptors.mts");
// Production, not NEXT_PUBLIC_BASE_URL: .env points that at localhost.
// Keep in step with SITE_URL in apps/docs/lib/catalog.ts.
const SITE = "https://ui.devigner.cc";
const API = "https://discord.com/api/v10";

const [slug, post] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const test = process.argv.includes("--test");
const discord = test || process.argv.includes("--discord");
// A post link ends in the post id; a bare id is its own last number.
const postId = post?.match(/(\d{17,20})\/?$/)?.[1];
if (!slug || !postId) {
  console.error("Usage: pnpm request:publish <slug> <post link or id> [--discord | --test]");
  process.exit(1);
}

// 1. Set requestId on the component's descriptor.
const source = readFileSync(descriptorsFile, "utf8");
const eol = source.includes("\r\n") ? "\r\n" : "\n";
const lines = source.split(/\r?\n/);
const start = lines.findIndex((l) => l.trim() === `slug: ${JSON.stringify(slug)},`);
if (start < 0) {
  console.error(`No component "${slug}" in scripts/registry/descriptors.mts.`);
  process.exit(1);
}
const indent = lines[start].match(/^\s*/)![0];
// The entry ends where the indentation drops back below its keys.
let end = start + 1;
while (end < lines.length && (lines[end].startsWith(indent) || !lines[end].trim())) end++;
const line = `${indent}requestId: ${JSON.stringify(postId)},`;
const existing = lines.slice(start, end).findIndex((l) => l.startsWith(`${indent}requestId:`));
if (existing >= 0) lines[start + existing] = line;
else lines.splice(start + 1, 0, line);
writeFileSync(descriptorsFile, lines.join(eol));
console.log(`Set requestId ${postId} on ${slug}.`);

// 2. Regenerate apps/docs/lib/registry.ts.
const gen = spawnSync(process.execPath, ["scripts/registry/generate.mts"], { cwd: root, stdio: "inherit" });
if (gen.status !== 0) process.exit(gen.status ?? 1);

if (!discord) {
  console.log("Commit and deploy, then rerun with --discord to tag the post and reply with the link.");
  process.exit(0);
}

// 3. Tag the post Published and reply with the link.
for (const f of ["apps/docs/.env", "apps/docs/.env.local"])
  if (existsSync(resolve(root, f))) process.loadEnvFile(resolve(root, f));
const token = process.env.DISCORD_BOT_TOKEN;
const WEBHOOK_VAR = test ? "DISCORD_CHANGELOG_TEST_WEBHOOK_URL" : "DISCORD_REQUESTS_WEBHOOK_URL";
const webhook = process.env[WEBHOOK_VAR];
if (!token || !webhook) {
  console.error(`Set DISCORD_BOT_TOKEN and ${WEBHOOK_VAR} in apps/docs/.env.`);
  process.exit(1);
}

async function call<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Discord ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (res.status === 204 ? null : res.json()) as T;
}

// A test only previews the reply, so the post itself is left alone.
if (!test) {
  const hook = (await (await fetch(webhook)).json()) as { channel_id: string };
  const forum = await call<{ available_tags: { id: string; name: string }[] }>(`${API}/channels/${hook.channel_id}`);
  const thread = await call<{ parent_id: string; applied_tags?: string[]; thread_metadata?: { archived: boolean } }>(
    `${API}/channels/${postId}`,
  );
  if (thread.parent_id !== hook.channel_id) {
    console.error(`Post ${postId} isn't in the requests forum.`);
    process.exit(1);
  }

  // Same loose names the board reads (lib/requests.ts): swap whichever status
  // tag is on the post for Published, keep COMPONENT and anything else.
  const status = /pending|progress|publish|built|shipped|reject/i;
  const published = forum.available_tags.find((t) => /publish/i.test(t.name));
  if (!published) throw new Error("The forum has no Published tag.");
  const nameOf = (id: string) => forum.available_tags.find((t) => t.id === id)?.name ?? "";
  const tags = [...(thread.applied_tags ?? []).filter((id) => !status.test(nameOf(id))), published.id];

  // An archived post has to be reopened to change it; it is left open.
  await call(`${API}/channels/${postId}`, {
    method: "PATCH",
    body: JSON.stringify({ applied_tags: tags, ...(thread.thread_metadata?.archived ? { archived: false } : {}) }),
  });
  console.log("Tagged the post Published.");
}

// Credit the requester by mention, the one the form stored in Contact.
const starter = await call<{ embeds?: { description?: string; fields?: { name: string; value: string }[] }[] }>(
  `${API}/channels/${postId}/messages/${postId}`,
);
const requester = starter.embeds?.[0]?.fields?.find((f) => f.name === "Contact")?.value.match(/<@(\d+)>/)?.[1];
const name = source.match(new RegExp(`slug: ${JSON.stringify(slug)},\\s*(?:requestId: "[^"]*",\\s*)?name: "([^"]+)"`))?.[1] ?? slug;
// The descriptor's own words and release, so the reply matches the docs.
const entry = source.slice(source.indexOf(`slug: ${JSON.stringify(slug)},`));
const field = (key: string) => entry.match(new RegExp(`${key}:\s*"([^"]+)"`))?.[1];
const page = `${SITE}/components/${slug}`;
const since = field("since");
// What they asked for: the request's first sentence, cut to a line.
const asked = starter.embeds?.[0]?.description?.split(/(?<=[.!?])\s/)[0]?.slice(0, 200);
// The changelog's server emojis (docs/changelog-emojis), found by name; a
// missing one is left out.
const guild = ((await (await fetch(webhook)).json()) as { guild_id: string }).guild_id;
const emojis = await call<{ id: string; name: string }[]>(`${API}/guilds/${guild}/emojis`).catch(() => []);
const emoji = (n: string) => {
  const e = emojis.find((x) => x.name === n);
  return e ? { emoji: { id: e.id, name: e.name } } : {};
};
const icon = (n: string) => {
  const e = emojis.find((x) => x.name === n);
  return e ? `<:${e.name}:${e.id}> ` : "";
};
const text = (content: string) => ({ type: 10, content });
const link = (label: string, url: string, e: string) => ({ type: 2, style: 5, label, url, ...emoji(e) });

/** The card, built fresh per send: a FormData body can only go out once. */
const card = () => {
const payload = new FormData();
payload.set(
  "payload_json",
  JSON.stringify({
    username: "Component Requests",
    flags: 1 << 15, // components v2: a card like the changelog's
    components: [
      {
        type: 17,
        accent_color: 0x22c55e,
        components: [
          {
            type: 9,
            components: [
              text(`-# ${["DEVIGNER UI", "REQUEST SHIPPED", since && `\`v${since}\``].filter(Boolean).join("  ·  ")}`),
              text(`### ${icon("cl_new")}[${name}](${page})`),
              text(`${requester ? `<@${requester}>, your` : "Your"} request is built and live. Thank you for it.`),
            ],
            accessory: { type: 11, media: { url: "attachment://logo.png" } },
          },
          { type: 14, divider: true, spacing: 2 },
          text(
            [
              asked && `**You asked for**\n> ${asked}`,
              field("description") && `**What shipped**\n> ${field("description")}`,
            ]
              .filter(Boolean)
              .join("\n\n"),
          ),
          text(["```bash", `npx devignerui@latest add ${slug}`, "```"].join("\n")),
          { type: 12, items: [{ media: { url: `${page}/opengraph-image?v=${Date.now().toString(36)}` }, description: `${name} preview` }] },
          {
            type: 1,
            components: [
              link("Try it live", page, "cl_new"),
              link("Request another", `${SITE}/request`, "cl_request"),
              link("All components", `${SITE}/components`, "cl_components"),
            ],
          },
          { type: 14, divider: false, spacing: 1 },
          text(`-# Thanks for helping shape Devigner UI  ·  <t:${Math.floor(Date.now() / 1000)}:f>`),
        ],
      },
    ],
    // A test shows the mention but never pings.
    allowed_mentions: { parse: [], users: requester && !test ? [requester] : [] },
    attachments: [{ id: 0, filename: "logo.png" }],
  }),
);
payload.set("files[0]", new Blob([readFileSync(resolve(root, "docs/changelog-logo.png"))], { type: "image/png" }), "logo.png");
return payload;
};
const ok = async (r: Response) => {
  if (!r.ok) throw new Error(`Discord ${r.status}: ${(await r.text()).slice(0, 300)}`);
};
// ponytail: a rerun with --discord replies again; delete the extra by hand.
await fetch(`${test ? webhook : `${webhook}?thread_id=${postId}`}${test ? "?" : "&"}with_components=true`, {
  method: "POST",
  body: card(),
}).then(ok);
console.log(test ? "Sent the reply to the test channel." : "Replied in the post with the link.");

// The same card in a DM, so it reaches them even if they don't follow the
// post. Discord refuses when they share no server with the bot or have DMs
// from server members off; the reply in the post still stands then.
if (requester && !test) {
  const dm = await call<{ id: string }>(`${API}/users/@me/channels`, {
    method: "POST",
    body: JSON.stringify({ recipient_id: requester }),
  });
  const res = await fetch(`${API}/channels/${dm.id}/messages`, {
    method: "POST",
    headers: { Authorization: `Bot ${token}` },
    body: card(),
  });
  console.log(res.ok ? "Sent the card to the requester by DM." : `Couldn't DM the requester (Discord ${res.status}); the reply in the post still stands.`);
}
