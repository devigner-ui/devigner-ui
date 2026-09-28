# Changelog

Release notes go to the Discord **#changelog** announcement channel. An agent writes each entry as a markdown file in `changelog/`, and `pnpm changelog:publish` posts it through a webhook. Code: `scripts/changelog-publish.mts`.

## Writing an entry

One file per release, `changelog/YYYY-MM-DD.md` (add `-2` for a second one on the same day):

```md
# File Upload is here
Version: 1.3.0

A short intro, optional.

- NEW file-upload: Drag-and-drop uploads with per-file progress.
  - **Pause and resume:** set `resumable` and each card gets a pause button
  - **Paste to upload:** Ctrl/Cmd + V drops a copied screenshot straight in
- UPDATED dock: Magnification follows the cursor with less lag.
- FIXED command-palette: Arrow keys no longer skip the first result.
- FIXED: The docs search closes on Escape again.
- REMOVED old-slider: Replaced by Range Slider.
```

- The first line is the post's title. Keep it short and about the headline change ("File Upload is here"); the header counts the rest.
- `Version: x.y.z` is optional and shows as a badge next to the date. Only the user picks a version (see Versioning in `AGENTS.md`), so leave it out unless they gave one. The date comes from the file name.
- A change line is `- LABEL slug: text`. Labels: **NEW**, **UPDATED**, **FIXED**, **REMOVED**. The slug is the component's slug in `scripts/registry/descriptors.mts` and becomes a link to its page (a REMOVED one is named, not linked). Leave the slug out for changes that aren't about one component.
- Indented `  - ` lines under a change are its features. Every NEW component gets up to 10: the ones that make someone want to try it, one short line each, led by a bold name (`**Pause and resume:** ...`), taken from the component's props and guide, not invented. Order matters: the first 5 show as the card's highlights, and the rest fold into a small "Also:" line by their bold names, so put the most striking first and give every feature a bold name. An UPDATED one gets them when there's more than one sentence to say.
- Lines before the first change are the post's intro, posted as written, so plain paragraphs and Discord markdown work. Prose after it is an error.

The post uses Discord's component layout (Components V2) rather than embeds, which is what lets each component card carry its own button. Top to bottom:

- **Ping.** If the server has a role named **Changelog**, the post mentions it, so people who opted in get notified. Nobody else is pinged. The role needs "Allow anyone to @mention this role" turned on, or the webhook's mention stays silent.
- **Header** (brand blue): one small line, "DEVIGNER UI CHANGELOG · SEPTEMBER 29, 2026" plus the version badge if given, then the title linking to the catalog, the intro and the logo beside them, then under a divider the release at a glance, each count with its card's icon: "**1** new component · **1** updated component · **3** site improvements".
- **One card per component**, in label order, its accent bar in the label's color (NEW green, UPDATED blue, FIXED amber, REMOVED red). Each opens with its icon and **NEW COMPONENT**, **UPDATED COMPONENT** and so on, then the name linking to its page, the summary in a quote bar (under a small "WHAT CHANGED" on UPDATED cards), up to 5 features under **Highlights**, the rest as an **Also** row of small code-style chips, and the install command in a code block to close the text. Below it, every card but REMOVED has a **Try it live** button to the component's page, where the demo and docs live, and NEW and UPDATED cards end with the component's OG image.
- **Closing card**: when there are site changes it is **Around the site** (violet), every change that names no component led by its label's emoji, then a divider. Either way it ends with a small footer line ("Found a bug or have an idea? Tell us in #support", with the post time) and the link buttons with icons: Components, Request, Discord, X (`LINKS` in the script). The support link goes to the first channel whose name has support, bug, feedback or help in it, or the Discord invite when none does. With no site changes the card holds just the footer and buttons, in brand blue.
- **The logo** is `docs/changelog-logo.png`. It goes up with each post as an attachment for the header, and the script sets it as the webhook's avatar before posting, so none of it depends on the site being deployed. Replace that file to change it.

Discord allows 40 components per post, nested ones included, and each component card takes 5, so a release can name about 4 components (the preview prints the count, for example `28/40 parts`). Text is capped at 4000 characters across the post. The script says when an entry is over either.

## Posting

1. Preview it. Nothing is sent, and a typo in a slug or label is caught here:

   ```sh
   pnpm changelog:publish changelog/2026-09-29.md
   ```

2. Try it in the test channel. Same post, sent to `DISCORD_CHANGELOG_TEST_WEBHOOK_URL`, with no role ping and no crosspost:

   ```sh
   pnpm changelog:test changelog/2026-09-29.md
   ```

3. Deploy the release, so every link and image is live.
4. Post it:

   ```sh
   pnpm changelog:publish changelog/2026-09-29.md --discord
   ```

   The script then publishes the message, which sends it on to servers that follow the channel. If that step fails it says so, and the **Publish** button on the message in Discord does the same.

Rerunning with `--discord` posts again, so delete the extra in Discord.

## Setup

1. Make **#changelog** an announcement channel (Edit Channel > Overview > Announcement Channel).
2. Edit Channel > Integrations > Webhooks > New Webhook, copy its URL into `DISCORD_UPDATES_WEBHOOK_URL` in `apps/docs/.env`. Only the script uses it, so it isn't needed on Vercel.
3. Upload the icons as server emojis: Server Settings > Emoji > Upload Emoji, one per file in `docs/changelog-emojis/`, each named as its file. Section icons: `cl_new`, `cl_updated`, `cl_fixed`, `cl_removed`, `cl_site`. Button icons: `cl_components`, `cl_request`, `cl_discord`, `cl_x`. The script finds them by name through the bot, so no ids go in `.env`. A missing one is left out, and the script says which. To change an icon or color, edit `scripts/changelog-emojis.mts`, run `node scripts/changelog-emojis.mts`, and upload the new file over the old emoji.
4. Optional: create a role named **Changelog** that members can pick up (Onboarding or a roles channel), and turn on "Allow anyone to @mention this role". The script finds it by name.
5. For testing, make a private channel in the same server (so the emojis resolve), add a webhook to it, and put its URL in `DISCORD_CHANGELOG_TEST_WEBHOOK_URL`.
6. For the automatic publish, give the bot (the same `DISCORD_BOT_TOKEN` as the request board) **Send Messages** and **Manage Messages** in #changelog. Without it, posting still works and you click Publish by hand.
