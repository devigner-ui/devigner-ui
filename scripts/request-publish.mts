/** Links a shipped component to the Discord request it answers.
 *
 *   pnpm request:publish <slug> <post link or id>            descriptor + registry
 *   pnpm request:publish <slug> <post link or id> --discord  also tags the post
 *     Published and replies in it with the component's link
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
const discord = process.argv.includes("--discord");
// A post link ends in the post id; a bare id is its own last number.
const postId = post?.match(/(\d{17,20})\/?$/)?.[1];
if (!slug || !postId) {
  console.error("Usage: pnpm request:publish <slug> <post link or id> [--discord]");
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
const webhook = process.env.DISCORD_REQUESTS_WEBHOOK_URL;
if (!token || !webhook) {
  console.error("Set DISCORD_BOT_TOKEN and DISCORD_REQUESTS_WEBHOOK_URL in apps/docs/.env.");
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

// Credit the requester by mention, the one the form stored in Contact.
const starter = await call<{ embeds?: { fields?: { name: string; value: string }[] }[] }>(
  `${API}/channels/${postId}/messages/${postId}`,
);
const requester = starter.embeds?.[0]?.fields?.find((f) => f.name === "Contact")?.value.match(/<@(\d+)>/)?.[1];
const name = source.match(new RegExp(`slug: ${JSON.stringify(slug)},\\s*name: "([^"]+)"`))?.[1] ?? slug;
// ponytail: a rerun with --discord replies again; delete the extra by hand.
await fetch(`${webhook}?thread_id=${postId}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: "Component Requests",
    content: `${requester ? `<@${requester}> ` : ""}${name} is live: ${SITE}/components/${slug}`,
    allowed_mentions: { users: requester ? [requester] : [] },
  }),
}).then(async (r) => {
  if (!r.ok) throw new Error(`Discord ${r.status}: ${(await r.text()).slice(0, 300)}`);
});
console.log("Replied in the post with the link.");
