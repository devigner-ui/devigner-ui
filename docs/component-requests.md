# Component requests

How the request form, the Discord forum and the public board fit together, and how to run them.

- `/request` is the form. Each request opens a post in the Discord requests forum through a webhook.
- `/requests` is the public board. It reads the forum with a bot and shows each post's status, votes and details.
- Status is a forum tag, changed by hand in Discord. The site only reads it.

Code: `app/api/request/route.ts` (sends), `lib/requests.ts` (reads the board), `lib/request-guard.ts` (spam protection), `components/request/` (form, board, Turnstile widget).

## Environment variables

All live in `apps/docs/.env` locally and in Vercel under Project > Settings > Environment Variables. `.env.example` lists them.

| Variable | Needed for | Where it comes from |
| --- | --- | --- |
| `DISCORD_REQUESTS_WEBHOOK_URL` | Sending requests | Forum > Edit Channel > Integrations > Webhooks |
| `DISCORD_BOT_TOKEN` | The board | Discord Developer Portal > your app > Bot > Reset Token. On the same page, turn on **Message Content Intent**, or the board can't read request details, images or votes |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Bot check (widget) | Cloudflare dashboard > Turnstile |
| `TURNSTILE_SECRET_KEY` | Bot check (server) | Same widget, secret key |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Rate limit | Vercel Marketplace > Upstash (filled in automatically) |

Keep every one of these out of git. Only the Turnstile site key is public by design, which is why it alone has the `NEXT_PUBLIC_` prefix.

After changing `.env`, restart `pnpm dev`: Next reads it only at startup. On Vercel, redeploy after adding or changing a variable.

## Status workflow

Each new post gets two tags: the forum's request tag and **Pending** (ids in `app/api/request/route.ts`). A webhook can only tag a post when it creates it, so later statuses are set by a moderator:

1. Open the post in Discord.
2. Click the tags at the top of the post and swap **Pending** for **In review**, **In queue** or **Built**.

The board reads status from tag names, loosely: a name containing "review" shows as In review, "queue" as In queue, "publish" or "built" as Built, and anything else as Pending. Renaming a tag in Discord keeps working as long as it still contains that word.

The board refreshes from Discord at most every 5 minutes. A new request through the form refreshes it at once; a tag change in Discord shows up within 5 minutes.

Votes are reactions with the forum's default reaction emoji (Edit Channel > Default Reaction) on the post's first message.

## Crediting a requested component

When a component you ship answers a request:

1. **Get the post id.** In Discord, right-click the request post, choose **Copy Link**, and take the last number, for example `1553900000000000000` from `https://discord.com/channels/<server>/<post>`.
2. **Add it to the descriptor.** In `scripts/registry/descriptors.mts`, add `requestId` to that component's entry:

   ```ts
   {
     slug: "command-palette",
     name: "Command Palette",
     // ...
     requestId: "1553900000000000000",
   },
   ```

3. **Regenerate the registry:** `pnpm registry:generate` from the repo root. `pnpm registry:check` should then pass.
4. **Mark it Built in Discord** by swapping the post's tag, so the status matches.

What changes:

- The board's row for that request gets an **Open Command Palette** button.
- The component's Docs panel shows **Requested by @username**, linking to the post. Older posts made before the username was required, or posts made by hand in Discord, show "Built from a community request" instead.

The username comes from the post's Contact field. It is required on the form and must belong to a member of the server (checked against the member list, account usernames only, never nicknames), so every request has someone to discuss it with in Discord.

## Spam protection (Vercel)

Two layers, each off until its keys are set, so the form keeps working locally without them.

### 1. Cloudflare Turnstile (bot check)

A free, usually invisible check. The widget only shows a challenge when Cloudflare is unsure about the visitor. The site does not need to be hosted on Cloudflare.

1. Sign in at [dash.cloudflare.com](https://dash.cloudflare.com) (a free account is enough) and open **Turnstile**.
2. Click **Add widget**. Name it `devigner requests`, add your hostnames (your production domain and `localhost`), and choose **Managed** mode.
3. Copy the **Site Key** into `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and the **Secret Key** into `TURNSTILE_SECRET_KEY`.
4. Add both to Vercel as well, then redeploy.

To test locally without a real widget, use Cloudflare's test keys:

| Purpose | Site key | Secret key |
| --- | --- | --- |
| Always passes | `1x00000000000000000000AA` | `1x0000000000000000000000000000000AA` |
| Always fails | `2x00000000000000000000AB` | `2x0000000000000000000000000000000AA` |

A failed check returns "Couldn't confirm you're human" (HTTP 403). If Cloudflare itself is unreachable, the request is let through rather than lost, and the rate limit still applies.

### 2. Upstash rate limit

Limits each IP to 3 requests per 10 minutes, stored in Upstash Redis so it holds across restarts and across Vercel's instances. Without it, the limit falls back to server memory, which resets on every cold start.

1. In the Vercel dashboard, open **Storage** (or **Marketplace**) and add **Upstash** > **Redis**. The free plan is enough.
2. Connect it to this project. Vercel adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` for you.
3. For local work, copy the same two values into `apps/docs/.env` (or run `vercel env pull`).
4. Redeploy.

A database made directly on [upstash.com](https://upstash.com) works too: set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` instead. The limit and window are `MAX` and `WINDOW_S` in `lib/request-guard.ts`.

If Upstash is unreachable, the limit falls back to memory for that request and logs the error.

## Troubleshooting

The dev terminal (or Vercel's function logs) says why a request or the board failed.

| Symptom | Cause | Fix |
| --- | --- | --- |
| Form says "Couldn't send it just now", log shows Discord `400` | Payload rejected, for example a missing post title | Check the logged reason; forum webhooks need `thread_name` |
| Log shows Discord `404` for the webhook | Webhook deleted | Make a new one and update `DISCORD_REQUESTS_WEBHOOK_URL` |
| Board says "can't be loaded", log mentions `DISCORD_BOT_TOKEN` | Token not set | Add it and restart |
| Log shows Discord `401` | Wrong or reset bot token | Copy the current token again |
| Log shows Discord `403` "Missing Access" | Bot can't see the forum | Forum > Edit Channel > Permissions: allow the bot View Channel and Read Message History |
| Rows say "No details given" and show no images, log says "posts came back empty" | Bot lacks the Message Content intent, so Discord strips message text, embeds and files | Developer Portal > your app > Bot > Privileged Gateway Intents: turn on **Message Content Intent** |
| Only open posts show, log says "archived posts skipped" | Bot lacks Read Message History | Same permission fix |
| Votes all show 0 | Bot can't read the first message, or voters used another emoji | Check Read Message History and the forum's default reaction |
| Form says "Couldn't confirm you're human" for real people | Site key and secret from different widgets, or hostname not listed | Match the pair and add the hostname in Turnstile |
