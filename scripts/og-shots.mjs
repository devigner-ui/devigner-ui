// Capture each catalog card's live preview, dark theme, for the per-component
// OG images (apps/docs/app/components/[slug]/opengraph-image.tsx). Rerun when
// a component is added or its look changes, then commit the PNGs.
//
//   node scripts/og-shots.mjs [baseUrl]     (default http://localhost:3000)

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const base = process.argv[2] ?? "http://localhost:3000";
const outDir = fileURLToPath(new URL("../apps/docs/assets/og/", import.meta.url));
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 2,
  colorScheme: "dark",
});
await page.addInitScript(() => localStorage.setItem("devignerui-theme", "dark"));
await page.goto(`${base}/components`, { waitUntil: "load" });

const slugs = await page.$$eval("article[aria-labelledby^='card-']", (els) =>
  els.map((el) => el.getAttribute("aria-labelledby").slice("card-".length)),
);

for (const slug of slugs) {
  const stage = page.locator(`article[aria-labelledby='card-${slug}'] .frame-surface`);
  await stage.scrollIntoViewIfNeeded();
  // LazyMount swaps the demo in on intersection; then let entrances settle.
  await page.waitForTimeout(1800);
  await page.mouse.move(0, 0);
  // Stage only: drop the card's 50px category header and 1px borders.
  const box = await stage.boundingBox();
  const head = 51;
  await page.screenshot({
    path: `${outDir}${slug}.png`,
    clip: { x: box.x + 1, y: box.y + head, width: box.width - 2, height: box.height - head - 1 },
  });
  console.log("wrote", slug);
}

await browser.close();
