// Capture each catalog demo, dark theme, for the per-component OG images
// (apps/docs/app/components/[slug]/opengraph-image.tsx). Rerun when a component
// is added or its look changes, then commit the PNGs.
//
//   node scripts/og-shots.mjs [baseUrl]     (default http://localhost:3000)
//
// Each shot is the component alone: its card's stage is lifted to fill the
// viewport (so FitToStage doesn't shrink it), the stage box, dots and page are
// hidden, and the demo is cropped tight on a transparent background. The OG
// image then fits it into its free area, scaling small ones up.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const base = process.argv[2] ?? "http://localhost:3000";
const outDir = fileURLToPath(new URL("../apps/docs/assets/og/", import.meta.url));
mkdirSync(outDir, { recursive: true });

// Room around the crop for shadows and glows that spill past the demo's box.
const PAD = 32;

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  // Sharp enough to survive being scaled up in the OG image.
  deviceScaleFactor: 3,
  colorScheme: "dark",
});
await page.addInitScript(() => localStorage.setItem("devignerui-theme", "dark"));
await page.goto(`${base}/components`, { waitUntil: "load" });
await page.addStyleTag({
  content: `
    html, body { background: transparent !important; }
    body { visibility: hidden; }
    .og-solo {
      visibility: visible;
      position: fixed !important;
      inset: 0 !important;
      height: auto !important;
      z-index: 2147483647;
      background: none !important;
    }
    .og-solo::before, .og-solo > span { display: none !important; }
  `,
});

const slugs = await page.$$eval("article[aria-labelledby^='card-']", (els) =>
  els.map((el) => el.getAttribute("aria-labelledby").slice("card-".length)),
);

for (const slug of slugs) {
  const stage = page.locator(`article[aria-labelledby='card-${slug}'] .frame-surface`);
  await stage.scrollIntoViewIfNeeded();
  await stage.evaluate((el) => el.classList.add("og-solo"));
  // LazyMount swaps the demo in, FitToStage refits to the bigger stage, then
  // the entrances settle.
  await page.waitForTimeout(1800);
  await page.mouse.move(0, 0);
  const box = await stage.locator(".w-max").first().boundingBox();
  const x = Math.max(0, box.x - PAD);
  const y = Math.max(0, box.y - PAD);
  await page.screenshot({
    path: `${outDir}${slug}.png`,
    omitBackground: true,
    clip: { x, y, width: box.x + box.width + PAD - x, height: box.y + box.height + PAD - y },
  });
  await stage.evaluate((el) => el.classList.remove("og-solo"));
  console.log("wrote", slug);
}

await browser.close();
