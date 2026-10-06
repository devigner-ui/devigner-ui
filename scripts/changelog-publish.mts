/** Posts a changelog entry to the Discord announcements channel.
 *
 *   pnpm changelog:publish changelog/<file>.md            preview only
 *   pnpm changelog:publish changelog/<file>.md --discord  post it, then
 *     crosspost so servers following the channel get it too
 *   pnpm changelog:test changelog/<file>.md               post it to the
 *     test channel (DISCORD_CHANGELOG_TEST_WEBHOOK_URL): no ping, no crosspost
 *   --base=<url>  where the demos are recorded from (default
 *     http://localhost:3000, so run the docs first)
 *
 * The entry is a markdown file an agent writes; see docs/changelog.md for the
 * format. The post uses Discord's component layout (Components V2): a header
 * container, one container per component a line names, each with its image
 * and a "Try it live" button, and an "Around the site" container for the
 * lines that name none. Run --discord after the release is deployed so every
 * link is already live. A rerun posts again; delete the extra in Discord. */

import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { demoGifs } from "./demo-gif.mts";

const root = resolve(import.meta.dirname, "..");
// Keep in step with SITE in scripts/request-publish.mts.
const SITE = "https://ui.devigner.cc";
const API = "https://discord.com/api/v10";
// Discord caches images by URL, so a fresh query per run skips any stale OG image
// it fetched before the page was deployed.
const RUN = Date.now().toString(36);
// Keep in step with DISCORD_URL in apps/docs/components/brand-logos.tsx.
const DISCORD = "https://discord.gg/PSv2aFYhuC";
// The logo travels with the post as an attachment, so it needs no hosting.
// Components point at it by file name; the avatar is set on the webhook.
const LOGO_FILE = resolve(root, "docs/changelog-logo.png");
const LOGO = "attachment://logo.png";
// --brand, the same blue as the site and its OG images (lib/og.tsx).
const BRAND = 0x5a94ff;
const LABELS = ["NEW", "UPDATED", "FIXED", "REMOVED"] as const;
type Label = (typeof LABELS)[number];
// Accent bar per container, matching its emoji (scripts/changelog-emojis.mts).
const COLOR: Record<Label | "SITE", number> = {
  NEW: 0x22c55e,
  UPDATED: 0x5a94ff,
  FIXED: 0xf59e0b,
  REMOVED: 0xef4444,
  SITE: 0xa78bfa,
};
/** Each component card's heading. */
const HEADING: Record<Label, string> = {
  NEW: "NEW COMPONENT",
  UPDATED: "UPDATED COMPONENT",
  FIXED: "FIXED COMPONENT",
  REMOVED: "REMOVED COMPONENT",
};
/** How the header counts each label's components. */
const COUNTED: Record<Label, [string, string]> = {
  NEW: ["new component", "new components"],
  UPDATED: ["updated component", "updated components"],
  FIXED: ["component fix", "component fixes"],
  REMOVED: ["removed component", "removed components"],
};
// Discord's Components V2 limits: 40 components in all, nested ones
// included, and 4000 characters across every text display.
const MAX_COMPONENTS = 40;
const MAX_TEXT = 4000;
// Feature lines per change; past this a card turns into a wall.
const MAX_FEATURES = 10;
const IS_COMPONENTS_V2 = 1 << 15;

const file = process.argv.slice(2).find((a) => !a.startsWith("--"));
// --test posts too, only to the test channel; `discord` means "post at all".
const test = process.argv.includes("--test");
const discord = test || process.argv.includes("--discord");
const base =
  process.argv.find((a) => a.startsWith("--base="))?.slice(7) ??
  "http://localhost:3000";
if (!file) {
  console.error(
    "Usage: pnpm changelog:publish changelog/<file>.md [--discord | --test]",
  );
  process.exit(1);
}
if (!existsSync(resolve(root, file))) {
  console.error(
    `No file at ${file}. Write the entry first (docs/changelog.md).`,
  );
  process.exit(1);
}

const descriptors = readFileSync(
  resolve(root, "scripts/registry/descriptors.mts"),
  "utf8",
);
const names = new Map(
  // request:publish puts requestId between slug and name.
  [
    ...descriptors.matchAll(
      /slug: "([^"]+)",\s*(?:requestId: "[^"]*",\s*)?name: "([^"]+)"/g,
    ),
  ].map((m) => [m[1], m[2]]),
);
const requestIds = new Map(
  [...descriptors.matchAll(/slug: "([^"]+)",\s*requestId: "([^"]+)"/g)].map(
    (m) => [m[1], m[2]],
  ),
);

const lines = readFileSync(resolve(root, file), "utf8").trim().split(/\r?\n/);
const title = lines[0].match(/^#\s+(.+)/)?.[1];
if (!title) {
  console.error(`${file} must start with a "# Title" line.`);
  process.exit(1);
}

/** One change line. `slug` is set when it names a component; `features` are
 *  the indented `  - ` lines under it. */
type Entry = {
  label: Label;
  slug?: string;
  name?: string;
  text: string;
  features: string[];
};

const errors: string[] = [];
const intro: string[] = [];
const entries: Entry[] = [];
// Only the user picks a version (AGENTS.md), so it is an optional line.
let version: string | undefined;
let last: Entry | undefined;
for (const line of lines.slice(1)) {
  const v = line.match(/^Version:\s*(\S+)$/i)?.[1];
  if (v && !last) {
    version = v.replace(/^v/, "");
    continue;
  }
  const feature = line.match(/^\s+- (.+)$/)?.[1];
  if (feature) {
    if (last && last.features.length === MAX_FEATURES)
      errors.push(
        `"${last.text.slice(0, 40)}..." has more than ${MAX_FEATURES} features.`,
      );
    if (last) last.features.push(feature);
    else
      errors.push(
        `"${line.trim()}" is indented but has no change line above it.`,
      );
    continue;
  }
  const m = line.match(/^- ([A-Z]+)(?: ([a-z0-9-]+))?: (.+)$/);
  if (!m) {
    // Prose only counts before the first change; later blank lines are spacing.
    if (!last) intro.push(line);
    else if (line.trim())
      errors.push(
        `"${line}" isn't a change line. Put prose before the first change.`,
      );
    continue;
  }
  const [, label, slug, text] = m as [
    string,
    Label,
    string | undefined,
    string,
  ];
  if (!LABELS.includes(label)) {
    errors.push(`Unknown label ${label}. Use ${LABELS.join(", ")}.`);
    continue;
  }
  last = { label, slug, name: slug && names.get(slug), text, features: [] };
  if (slug && !last.name)
    errors.push(`No component "${slug}" in scripts/registry/descriptors.mts.`);
  entries.push(last);
}
// Components in label order, the rest after.
const parts = LABELS.flatMap((l) =>
  entries.filter((e) => e.slug && e.label === l),
);
const site = entries.filter((e) => !e.slug);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

for (const f of ["apps/docs/.env", "apps/docs/.env.local"])
  if (existsSync(resolve(root, f))) process.loadEnvFile(resolve(root, f));
const WEBHOOK_VAR = test
  ? "DISCORD_CHANGELOG_TEST_WEBHOOK_URL"
  : "DISCORD_UPDATES_WEBHOOK_URL";
const webhook = process.env[WEBHOOK_VAR];
const token = process.env.DISCORD_BOT_TOKEN;

/** The server's cl_* emojis (docs/changelog-emojis), a role named
 *  Changelog and a support channel, all found by name. Only looked up when
 *  posting; anything missing is left out of the post. */
async function fromServer() {
  const none = {
    emojis: new Map<string, { id: string; name: string }>(),
    role: undefined as string | undefined,
    support: undefined as string | undefined,
  };
  if (!webhook || !token) return none;
  const hook = (await (await fetch(webhook)).json()) as { guild_id: string };
  const get = (path: string) =>
    fetch(`${API}/guilds/${hook.guild_id}/${path}`, {
      headers: { Authorization: `Bot ${token}` },
    });
  const [emojiRes, roleRes, channelRes] = await Promise.all([
    get("emojis"),
    get("roles"),
    get("channels"),
  ]);
  if (!emojiRes.ok)
    console.warn(
      `Couldn't read the server's emojis (Discord ${emojiRes.status}); posting without icons.`,
    );
  if (!roleRes.ok)
    console.warn(
      `Couldn't read the server's roles (Discord ${roleRes.status}); posting without a ping.`,
    );
  const list = async <T,>(res: Response) =>
    res.ok ? ((await res.json()) as T[]) : [];
  const emojis = await list<{ id: string; name: string }>(emojiRes);
  const roles = await list<{ id: string; name: string }>(roleRes);
  const channels = await list<{ id: string; name: string }>(channelRes);
  return {
    emojis: new Map(emojis.map((e) => [e.name, e])),
    role: roles.find((r) => r.name.toLowerCase() === "changelog")?.id,
    // The first channel whose name says it takes reports.
    support: channels.find((c) => /support|bug|feedback|help/i.test(c.name))
      ?.id,
  };
}
const server = discord ? await fromServer() : undefined;

/** Who asked for each requested component, from the Contact field of the
 *  request post ("<@id> (@username)"), the same one request:publish reads.
 *  Left out when the post can't be read or has no Contact. */
const requesters = new Map<string, { id: string; username: string }>();
if (token)
  await Promise.all(
    parts.map(async (e) => {
      const post = requestIds.get(e.slug!);
      if (!post || e.label !== "NEW") return;
      const res = await fetch(`${API}/channels/${post}/messages/${post}`, {
        headers: { Authorization: `Bot ${token}` },
      });
      const starter = res.ok
        ? ((await res.json()) as {
            embeds?: { fields?: { name: string; value: string }[] }[];
          })
        : undefined;
      const m = starter?.embeds?.[0]?.fields
        ?.find((f) => f.name === "Contact")
        ?.value.match(/<@(\d+)>(?:\s*\(@([^)]+)\))?/);
      if (m) requesters.set(e.slug!, { id: m[1], username: m[2] ?? m[1] });
      else
        console.warn(
          `Couldn't read who requested ${e.slug}${res.ok ? "" : ` (Discord ${res.status})`}; posting without the credit.`,
        );
    }),
  );

// NEW and UPDATED cards show their demo as a looping GIF, recorded now and
// sent with the post: Discord keeps its own copy, so the files are deleted
// when the script ends. A demo that fails to record keeps its OG image.
const MAX_UPLOAD = 9e6;
const demoed = parts.filter((e) => e.label === "NEW" || e.label === "UPDATED");
const gifDir = mkdtempSync(join(tmpdir(), "devigner-changelog-"));
process.on("exit", () => rmSync(gifDir, { recursive: true, force: true }));
const gifs =
  discord && webhook && demoed.length
    ? await demoGifs(
        demoed.map((e) => e.slug!),
        base,
        gifDir,
        (MAX_UPLOAD - readFileSync(LOGO_FILE).length) / demoed.length,
      )
    : new Set<string>();
// Preview shows the name each icon will have, so a missing one is easy to spot.
const icon = (name: string) => {
  const e = server?.emojis.get(name);
  return e ? `<:${e.name}:${e.id}>` : server ? "" : `:${name}:`;
};
const emojiOf = (name: string) => {
  const e = server?.emojis.get(name);
  return e ? { emoji: { id: e.id, name: e.name } } : {};
};
const heading = (name: string, text: string) =>
  `### ${[icon(name), text].filter(Boolean).join(" ")}`;
const count = (n: number, [one, many]: [string, string]) =>
  `**${n}** ${n === 1 ? one : many}`;

// The file name carries the release date; anything else falls back to today.
const day =
  basename(file).match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ??
  new Date().toISOString().slice(0, 10);
const date = new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

// Component builders, by Discord's component type numbers.
type Component = { type: number; [key: string]: unknown };
const text = (content: string): Component => ({ type: 10, content });
const separator = (divider = true): Component => ({
  type: 14,
  divider,
  spacing: 1,
});
const container = (color: number, components: Component[]): Component => ({
  type: 17,
  accent_color: color,
  components,
});
const link = (label: string, url: string, emoji?: string): Component => ({
  type: 2,
  style: 5,
  label,
  url,
  ...(emoji ? emojiOf(emoji) : {}),
});
const row = (buttons: Component[]): Component => ({
  type: 1,
  components: buttons,
});

// Each count wears its card's icon, so the header echoes the cards below.
const tagged = (emoji: string, s: string) =>
  [icon(emoji), s].filter(Boolean).join(" ");
const stats = [
  ...LABELS.map((l) => {
    const n = parts.filter((e) => e.label === l).length;
    return n && tagged(`cl_${l.toLowerCase()}`, count(n, COUNTED[l]));
  }),
  site.length &&
    tagged(
      "cl_site",
      count(site.length, ["site improvement", "site improvements"]),
    ),
].filter(Boolean);

// Features shown as a list; the rest fold into one quieter "Also" line.
const HIGHLIGHTS = 5;
/** A feature's bold name ("**Pause and resume:** ..." gives "Pause and resume"). */
const featureName = (f: string) => f.match(/^\*\*(.+?):?\*\*/)?.[1] ?? f;

// Link buttons at the foot of the post. Short labels keep them on one row.
const LINKS = [
  ["Components", `${SITE}/components`, "cl_components"],
  ["Request", `${SITE}/request`, "cl_request"],
  ["Discord", DISCORD, "cl_discord"],
  ["​", "https://x.com/devignerui", "cl_x"],
];
// Where people report back; without a matching channel, the invite.
const support = server?.support;
const tellUs = support
  ? `Tell us in <#${support}>`
  : discord
    ? `[Tell us on Discord](${DISCORD})`
    : "Tell us in #support";

// A test post never pings: the role is for real releases only.
const role = test ? undefined : server?.role;
const components: Component[] = [
  // A mention in a text display pings like message content would.
  // The preview holds its place, so it counts against the limits too.
  ...(role
    ? [text(`<@&${role}>`)]
    : discord
      ? []
      : [text("@Changelog (if the role exists)")]),
  container(BRAND, [
    {
      type: 9,
      components: [
        text(
          `-# ${["DEVIGNER UI CHANGELOG", date.toUpperCase(), version && `\`v${version}\``].filter(Boolean).join("  ·  ")}`,
        ),
        text(`## [${title}](${SITE}/components)`),
        ...(intro.join("\n").trim() ? [text(intro.join("\n").trim())] : []),
      ],
      accessory: { type: 11, media: { url: LOGO } },
    },
    separator(),
    text(stats.join("  ·  ")),
  ]),
  ...parts.map((e) => {
    const live = e.label !== "REMOVED";
    const page = `${SITE}/components/${e.slug}`;
    const shown = e.features.slice(0, HIGHLIGHTS);
    const rest = e.features.slice(HIGHLIGHTS);
    // What it is, what it does, then how to get it: the install command
    // closes the text, with the button and image after it.
    // Blank lines ("") part the blocks so each one breathes.
    const body = [
      heading(`cl_${e.label.toLowerCase()}`, HEADING[e.label]),
      live ? `## [${e.name}](${page})` : `## ${e.name}`,
      e.label === "UPDATED" && "-# WHAT CHANGED",
      // The summary in a quote bar, so it reads as the card's lede.
      `> ${e.text}`,
      // A mention renders as the member's name; the preview shows the username.
      requesters.has(e.slug!) &&
        `-# Requested by ${discord ? `<@${requesters.get(e.slug!)!.id}>` : `@${requesters.get(e.slug!)!.username}`}`,
      shown.length > 0 && "",
      shown.length > 0 && "**Highlights**",
      ...shown.map((f) => `- ${f}`),
      // The rest as chips: short, scannable, no second list.
      rest.length > 0 && "",
      rest.length > 0 &&
        `**Also** ${rest.map((f) => `\`${featureName(f)}\``).join(" ")}`,
      live && "",
      live && ["```bash", `npx devignerui add ${e.slug}`, "```"].join("\n"),
    ].filter((r): r is string => typeof r === "string");
    return container(COLOR[e.label], [
      text(body.join("\n")),
      ...(live
        ? [row([link("Try it live", page, `cl_${e.label.toLowerCase()}`)])]
        : []),
      ...(e.label === "NEW" || e.label === "UPDATED"
        ? [
            {
              type: 12,
              items: [
                {
                  media: {
                    url: gifs.has(e.slug!)
                      ? `attachment://${e.slug}.gif`
                      : `${page}/opengraph-image?v=${RUN}`,
                  },
                  description: `${e.name} preview`,
                },
              ],
            },
          ]
        : []),
    ]);
  }),
  // The closing card: site changes when there are any, then the footer line
  // and link buttons. Without site changes it holds just the footer.
  container(site.length ? COLOR.SITE : BRAND, [
    ...(site.length
      ? [
          text(
            [
              heading("cl_site", "AROUND THE SITE"),
              // The label's own emoji is each line's bullet; without it, a bold word.
              ...site.flatMap((e) => [
                `${icon(`cl_${e.label.toLowerCase()}`) || `**${e.label[0] + e.label.slice(1).toLowerCase()}:**`} ${e.text}`,
                ...e.features.map((f) => `- ${f}`),
              ]),
            ].join("\n"),
          ),
          separator(),
        ]
      : []),
    text(
      `-# Found a bug or have an idea? ${tellUs}  ·  <t:${Math.floor(Date.now() / 1000)}:f>`,
    ),
    row(LINKS.map(([label, url, emoji]) => link(label, url, emoji))),
  ]),
];

// Discord counts every component, nested ones and accessories included.
const all = (list: Component[]): Component[] =>
  list.flatMap((c) => [
    c,
    ...all((c.components as Component[] | undefined) ?? []),
    ...(c.accessory ? [c.accessory as Component] : []),
  ]);
const flat = all(components);
const chars = flat
  .filter((c) => c.type === 10)
  .reduce((n, c) => n + (c.content as string).length, 0);
if (flat.length > MAX_COMPONENTS)
  errors.push(
    `The post has ${flat.length} parts; Discord allows ${MAX_COMPONENTS}. Each component card takes 5, so name fewer components or split the release.`,
  );
if (chars > MAX_TEXT)
  errors.push(
    `The post has ${chars} characters of text; Discord allows ${MAX_TEXT}.`,
  );
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

if (!discord) {
  /** A plain-text sketch of the layout: containers boxed by rules. */
  const show = (c: Component, depth = 0): string[] => {
    const kids = ((c.components as Component[] | undefined) ?? []).flatMap(
      (k) => show(k, depth + 1),
    );
    switch (c.type) {
      case 17:
        return ["-".repeat(60), ...kids];
      case 9:
        return [
          ...kids,
          `[thumbnail: ${(c.accessory as { media: { url: string } }).media.url}]`,
        ];
      case 10:
        return [c.content as string];
      case 12:
        return (c.items as { media: { url: string } }[]).map(
          (i) => `[image: ${i.media.url}]`,
        );
      case 14:
        return [c.divider ? "- - -" : ""];
      case 1:
        return [
          (c.components as Component[])
            .map((b) => `[${b.label}] ${b.url}`)
            .join("   "),
        ];
      default:
        return kids;
    }
  };
  console.log(
    `${components.flatMap((c) => show(c)).join("\n")}\n\n${flat.length}/${MAX_COMPONENTS} parts, ${chars}/${MAX_TEXT} characters.\nLooks right? Try it with pnpm changelog:test, then post it with --discord.`,
  );
  process.exit(0);
}

if (!webhook) {
  console.error(`Set ${WEBHOOK_VAR} in apps/docs/.env.`);
  process.exit(1);
}
const wanted = [
  ...new Set([
    ...entries.map((e) => `cl_${e.label.toLowerCase()}`),
    ...(site.length ? ["cl_site"] : []),
    ...LINKS.map((l) => l[2]),
  ]),
];
const missing = wanted.filter((n) => !server!.emojis.has(n));
if (missing.length)
  console.warn(
    `No server emoji named ${missing.join(", ")}; posting without those icons.`,
  );
if (!role && !test)
  console.warn("No role named Changelog; posting without a ping.");

// A message's avatar_url must be a hosted image, so the logo is set as the
// webhook's own avatar instead. The webhook URL alone authorizes this.
const logo = readFileSync(LOGO_FILE);
const avatar = await fetch(webhook, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Devigner UI",
    avatar: `data:image/png;base64,${logo.toString("base64")}`,
  }),
});
if (!avatar.ok)
  console.warn(
    `Couldn't set the webhook's avatar (Discord ${avatar.status}); posting with the old one.`,
  );

// wait=true returns the message, which the crosspost below needs;
// with_components=true makes the webhook honor the components at all.
const payload = new FormData();
payload.set(
  "payload_json",
  JSON.stringify({
    flags: IS_COMPONENTS_V2,
    components,
    // Only the Changelog role and, on the real post, the requesters may be
    // pinged, never @everyone.
    allowed_mentions: {
      parse: [],
      roles: role ? [role] : [],
      users: test ? [] : [...requesters.values()].map((r) => r.id),
    },
    attachments: [
      { id: 0, filename: "logo.png" },
      ...[...gifs].map((slug, i) => ({ id: i + 1, filename: `${slug}.gif` })),
    ],
  }),
);
payload.set("files[0]", new Blob([logo], { type: "image/png" }), "logo.png");
[...gifs].forEach((slug, i) =>
  payload.set(
    `files[${i + 1}]`,
    new Blob([readFileSync(join(gifDir, `${slug}.gif`))], {
      type: "image/gif",
    }),
    `${slug}.gif`,
  ),
);
const res = await fetch(`${webhook}?wait=true&with_components=true`, {
  method: "POST",
  body: payload,
});
if (!res.ok) {
  console.error(`Discord ${res.status}: ${(await res.text()).slice(0, 500)}`);
  process.exit(1);
}
const message = (await res.json()) as { id: string; channel_id: string };
if (test) {
  console.log(
    "Posted the test to the test channel. Check it there, then run with --discord for the real one.",
  );
  process.exit(0);
}
console.log("Posted the changelog.");

// Publishing is what sends it on to servers that follow the channel. It takes
// the bot, with Send Messages and Manage Messages in the channel.
const cross = token
  ? await fetch(
      `${API}/channels/${message.channel_id}/messages/${message.id}/crosspost`,
      {
        method: "POST",
        headers: { Authorization: `Bot ${token}` },
      },
    )
  : null;
if (cross?.ok) console.log("Published it to following servers.");
else
  console.warn(
    `Not published to following servers${cross ? ` (Discord ${cross.status})` : " (no DISCORD_BOT_TOKEN)"}. Click Publish on the message in Discord.`,
  );
