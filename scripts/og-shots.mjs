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

// Demos whose best shot is a state reached by pressing something: `press` is
// clicked, and the crop grows to take in the box around `reveal`, which can
// float past the demo's own box (a menu opening over its surroundings).
const OPENED = {
  "liquid-glass": {
    press: 'button[aria-haspopup="menu"]',
    // The rows' clip layer spans the glass panel itself.
    reveal: '[role="menu"]',
  },
};

// Demos whose best shot is a hover state: the pointer rests on `hover` while
// the shot is taken.
const HOVERED = {
  // The globe lights devigner.cc under its Website pill.
  "contact-lens": {
    hover: 'button[aria-label^="Copy website"]',
    // The pill floats above the line, outside the demo's own box.
    reveal: "span[aria-hidden].absolute",
  },
};

// Demos that play through states on their own: extra ms to wait for the best
// one (Image Generation late in its run, refining or complete).
const SETTLE = {
  "image-generation": 5000,
};

// Demos that tint the component for the stage: CSS put back while the shot is
// taken, so the shot (also the footer spotlight) shows the shipped look.
const RESTYLE = {
  // The demo's see-through tabs, made solid again.
  "expand-tabs": `.og-solo [class~="bg-foreground/8"] {
    background-color: color-mix(in oklab, var(--foreground) 8%, var(--background)) !important;
  }`,
};

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
  const restyle = RESTYLE[slug] && (await page.addStyleTag({ content: RESTYLE[slug] }));
  // LazyMount swaps the demo in, FitToStage refits to the bigger stage, then
  // the entrances settle.
  await page.waitForTimeout(1800 + (SETTLE[slug] ?? 0));
  const opened = OPENED[slug];
  if (opened) {
    await stage.locator(opened.press).first().click();
    // The open morph settles, then the glass redraws for its resting shape.
    await page.waitForTimeout(1800);
  }
  const hovered = HOVERED[slug];
  if (hovered) {
    await stage.locator(hovered.hover).first().hover();
    // The lift and the pill settle.
    await page.waitForTimeout(800);
  } else {
    await page.mouse.move(0, 0);
  }
  let box = await stage.locator(".w-max").first().boundingBox();
  if (hovered) {
    const shown = await stage.locator(hovered.reveal).first().boundingBox();
    const x0 = Math.min(box.x, shown.x);
    const y0 = Math.min(box.y, shown.y);
    box = {
      x: x0,
      y: y0,
      width: Math.max(box.x + box.width, shown.x + shown.width) - x0,
      height: Math.max(box.y + box.height, shown.y + shown.height) - y0,
    };
  }
  if (opened) {
    const shown = await stage
      .locator(opened.reveal)
      .first()
      .evaluate((el) => {
        const r = el.parentElement.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      });
    const x0 = Math.min(box.x, shown.x);
    const y0 = Math.min(box.y, shown.y);
    box = {
      x: x0,
      y: y0,
      width: Math.max(box.x + box.width, shown.x + shown.width) - x0,
      height: Math.max(box.y + box.height, shown.y + shown.height) - y0,
    };
  }
  const x = Math.max(0, box.x - PAD);
  const y = Math.max(0, box.y - PAD);
  await page.screenshot({
    path: `${outDir}${slug}.png`,
    omitBackground: true,
    clip: { x, y, width: box.x + box.width + PAD - x, height: box.y + box.height + PAD - y },
  });
  if (opened) await page.keyboard.press("Escape");
  await stage.evaluate((el) => el.classList.remove("og-solo"));
  if (restyle) await restyle.evaluate((el) => el.remove());
  console.log("wrote", slug);
}

await browser.close();
