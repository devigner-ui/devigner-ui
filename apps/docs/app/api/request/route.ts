import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { IMAGES, MAX_LINKS } from "@/lib/request-limits";
import { rateLimited, verifyHuman } from "@/lib/request-guard";
import { SLOWMODE_S, discordUsername } from "@/lib/request-limits";
import { BOARD_TAG, findMember } from "@/lib/requests";

/** Opens a post in the Discord requests forum through a webhook, one post
 *  per request, titled with the component's name. The webhook URL stays on
 *  the server: anyone holding it can post to the forum. */

const LIMITS = { name: 80, details: 1000, contact: 120, link: 300 } as const;

/** Forum tags every new post gets: COMPONENT (the forum also takes ICON
 *  requests, which the board skips), plus the Pending status. Later statuses
 *  (In Progress, Published, Rejected) are set by hand in Discord - a webhook
 *  can only tag a post when it creates it. The board at /requests reads them
 *  back by tag name (lib/requests.ts). */
const COMPONENT_TAG = "1553757865645187173";
const PENDING_TAG = "1553763217388601354";

const clean = (v: FormDataEntryValue | null, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  const webhook = process.env.DISCORD_REQUESTS_WEBHOOK_URL;
  if (!webhook) return bad("Requests are not set up yet.", 503);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad("Invalid request.");
  }

  // Honeypot: a field people never see. Bots fill it; pretend it worked.
  if (clean(form.get("website"), 200)) return NextResponse.json({ ok: true });

  const name = clean(form.get("name"), LIMITS.name);
  const details = clean(form.get("details"), LIMITS.details);
  const handle = clean(form.get("contact"), LIMITS.contact);
  // Required: requests are discussed with the requester in Discord.
  if (!handle) return bad("Add your Discord username. Join our server first if you're not in it.");
  const username = discordUsername(handle);
  if (!username) return bad("That isn't a valid Discord username.");
  if (name.length < 2) return bad("Give the component a name.");
  if (details.length < 10) return bad("Tell us a bit about what it should do.");

  // One per line; anything that is not a plain web link is dropped.
  const links = clean(form.get("links"), MAX_LINKS * (LIMITS.link + 1))
    .split(/\s+/)
    .filter((l) => /^https?:\/\/\S+$/i.test(l) && l.length <= LIMITS.link)
    .slice(0, MAX_LINKS);

  const images = form.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (images.length > IMAGES.max) return bad(`Up to ${IMAGES.max} images.`);
  for (const f of images) {
    if (!(IMAGES.types as readonly string[]).includes(f.type)) return bad("Images must be PNG, JPG, WebP or GIF.");
    if (f.size > IMAGES.bytes) return bad("Each image must be under 3 MB.");
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  // Human check before the rate limit, so a bot's attempts never count
  // against the person sharing its IP.
  if (!(await verifyHuman(clean(form.get("cf-turnstile-response"), 2048), ip)))
    return bad("Couldn't confirm you're human. Refresh the page and try again.", 403);
  if (await rateLimited(ip)) return bad("That's a few already. Try again in a little while.", 429);

  // The form checks this as they type; checked again here since the form can
  // be skipped. Only a confirmed account username is credited: when Discord
  // can't be asked, the name is refused (it is optional, so they can clear it).
  const found = await findMember(username);
  if (!found) return bad("Couldn't check that Discord username just now. Try again in a moment.", 503);
  if (!found.found)
    return bad(`@${username} isn't a member of our Discord. Use your username, not a nickname.`);
  // A mention renders as the blue, clickable name that opens their profile.
  // allowed_mentions (below) keeps it from pinging them. The username in
  // brackets is what the board reads back (lib/requests.ts).
  const contact = `<@${found.member.id}> (@${found.member.username})`;

  const fields = [
    ...(contact ? [{ name: "Contact", value: contact }] : []),
    // The board reads these back by name (lib/requests.ts).
    ...(links.length ? [{ name: "References", value: links.join("\n") }] : []),
  ];

  const payload = new FormData();
  payload.set(
    "payload_json",
    JSON.stringify({
      username: "Component Requests",
      // The channel is a forum: a webhook there must open a new post, and
      // Discord rejects the message without a title for it (max 100 chars).
      thread_name: name,
      // Text is from strangers: never let it ping @everyone or a role.
      allowed_mentions: { parse: [] },
      applied_tags: [COMPONENT_TAG, PENDING_TAG],
      embeds: [
        {
          description: details || "_No details given._",
          fields,
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  );
  // Renamed, so a stranger's filename never reaches the channel.
  images.forEach((f, i) =>
    payload.set(`files[${i}]`, f, `reference-${i + 1}.${f.type.split("/")[1].replace("jpeg", "jpg")}`),
  );

  const res = await fetch(webhook, { method: "POST", body: payload }).catch((err) => {
    console.error("Discord request webhook unreachable:", err);
    return null;
  });

  // Slowmode or a webhook rate limit: say how long, so the form can count
  // it down instead of failing again.
  if (res?.status === 429) {
    const { retry_after } = (await res.json().catch(() => ({}))) as { retry_after?: number };
    const retryAfter = Math.ceil(retry_after ?? SLOWMODE_S);
    return NextResponse.json(
      { error: "Discord needs a moment between posts.", retryAfter },
      { status: 429 },
    );
  }
  if (!res?.ok) {
    // Discord says why in the body (bad field, rate limit). Server log only:
    // it can echo parts of the payload back.
    if (res) console.error("Discord request webhook", res.status, await res.text());
    return bad("Couldn't send it just now. Try again in a minute.", 502);
  }

  // The board shows the new post on the next load instead of in 5 minutes.
  revalidateTag(BOARD_TAG, { expire: 0 });
  return NextResponse.json({ ok: true });
}
