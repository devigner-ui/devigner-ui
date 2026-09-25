# Publishing Devigner UI

Two things ship: the website (`apps/docs`, deployed to ui.devigner.cc) and the
npm package (`packages/ui`, published as `devignerui`, which also carries the
`npx devignerui` CLI). They are independent: the CLI bundles its own copy of the
registry, so it works without the site being up.

## 1. Pre-flight (every release)

Run from the repo root. All must pass.

```sh
pnpm install
pnpm registry:ci          # registry is in sync, valid, fixtures compile
pnpm test                 # menu-path + catalog checks
pnpm lint
pnpm build                # builds packages/ui, the CLI and the site
pnpm --dir packages/ui test:package   # installs a component from the packed CLI
git grep -n -P "\x{2014}" -- ':!apps/docs/AGENTS.md'   # must print nothing
```

If a component was added or its look changed, refresh the previews used by
the OG share images (needs `pnpm dev` running) and commit the PNGs in
`apps/docs/assets/og/`:

```sh
pnpm og:shots
```

Then commit and push the branch, open a PR into `main`, and merge it.

## 2. Deploy the website (Vercel)

1. Go to vercel.com, **Add New > Project**, import `itsremiofficial/devigner`.
2. Set **Root Directory** to `apps/docs`. Vercel detects Next.js and pnpm on
   its own; leave the build command as the default.
3. Add these **Environment Variables** (Production scope):

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_BASE_URL` | `https://ui.devigner.cc` (no trailing slash) |
   | `CREEM_API_KEY` | live key from the Creem dashboard |
   | `CREEM_WEBHOOK_SECRET` | from step 5 below |
   | `CREEM_PRODUCT_MONTHLY` | live product ID |
   | `CREEM_PRODUCT_LIFETIME` | live product ID |
   | `NEXT_PUBLIC_GA_ID` | `G-XXXXXXX`, from section 4 |
   | `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | from section 4 (optional) |

   `NEXT_PUBLIC_*` values are baked in at build time, so any change to them
   needs a redeploy. Never build for production with the local `.env`: it sets
   the base URL to `http://localhost:3000`, which would leak into canonicals,
   the sitemap and OG image URLs.
4. **Deploy**. Then **Settings > Domains**, add `ui.devigner.cc`. At the DNS
   provider for `devigner.cc`, add the record Vercel shows (a `CNAME` named
   `ui` pointing to `cname.vercel-dns.com`, or whatever value Vercel lists).
   Wait for the SSL badge.
5. **Creem webhook**: in the Creem dashboard add a webhook pointing to
   `https://ui.devigner.cc/api/webhook`, copy its signing secret into
   `CREEM_WEBHOOK_SECRET`, and redeploy.
6. Make one real (or test-mode) purchase and confirm you land on
   `/checkout/success` and the webhook shows as delivered in Creem.

### Smoke test the live site

- `https://ui.devigner.cc/robots.txt` lists the sitemap on the real domain.
- `https://ui.devigner.cc/sitemap.xml` lists `/`, `/components` and every
  component page, all on `https://ui.devigner.cc`.
- `https://ui.devigner.cc/opengraph-image` shows the share card.
- Paste the homepage URL into https://www.opengraph.xyz and
  https://cards-dev.twitter.com/validator (or just a draft post) to see the
  preview.
- Run https://pagespeed.web.dev on the homepage and one component page.

## 3. Publish the npm package

The name `devignerui` was unpublished on 2026-09-24. npm blocks a republish
for 24 hours (over by 2026-09-25) and never lets you reuse a version number
that existed before, so the next release must bump past `1.0.0`.

```sh
npm login                          # once per machine
cd packages/ui
npm version patch --no-git-tag-version   # 1.0.0 -> 1.0.1
pnpm build
npm pack --dry-run                 # check: only dist/, includes cli.js and registry.json
npm publish                        # publishConfig already sets access: public
```

Verify from an empty folder:

```sh
npx devignerui@latest add magnetic-button
```

Commit the version bump, then tag it: `git tag v1.0.1 && git push --tags`.

Every time a component is added or changed, rerun section 1, bump the version
(`patch` for fixes, `minor` for new components) and publish again. The CLI's
registry is a snapshot taken at build time, so the package does not pick up
new components until it is republished.

## 4. Google (Search Console + Analytics)

**Search Console** gets you indexed. Do this first.

1. Open https://search.google.com/search-console and add a property.
   - **Domain** property `devigner.cc` (recommended): add the TXT record it
     gives you at your DNS provider. Covers `ui.` and every other subdomain,
     http and https, in one.
   - Or **URL prefix** `https://ui.devigner.cc`, method **HTML tag**: copy only
     the `content="..."` value into `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`,
     redeploy, then click **Verify**.
2. **Sitemaps**: submit `https://ui.devigner.cc/sitemap.xml`.
3. **URL Inspection**: inspect `https://ui.devigner.cc/` and
   `https://ui.devigner.cc/components`, click **Request indexing** for each.
4. Check back after a few days under **Pages** for indexing errors.

**Analytics** only measures traffic; it does not affect ranking.

1. Open https://analytics.google.com, **Admin > Create > Property**, then
   **Data streams > Web**, enter `https://ui.devigner.cc`.
2. Copy the **Measurement ID** (`G-XXXXXXX`) into `NEXT_PUBLIC_GA_ID` and
   redeploy. The tag is only rendered when this is set, so dev traffic is
   never counted.
3. Open the live site and confirm your visit in **Reports > Realtime**.
4. Optional: **Admin > Product links > Search Console links** to see search
   queries inside GA.

GTM is not needed. Add it only if you later run several tags (ad pixels,
conversion tracking) and want to manage them outside the code.

## 5. After launch

- Share the homepage and one component page on X/LinkedIn and check the card
  renders.
- Watch Vercel **Logs** for `/api/checkout` and `/api/webhook` errors during
  the first purchases.
- Re-submit the sitemap in Search Console after adding new components (Google
  also re-reads it on its own).
