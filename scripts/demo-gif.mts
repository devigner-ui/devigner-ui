/** Records a component's catalog demo as a short looping GIF, for the
 *  changelog cards (scripts/changelog-publish.mts attaches them to the post).
 *
 *   node scripts/demo-gif.mts <slug> [baseUrl]   one GIF into the OS temp dir,
 *     to check how it looks (default http://localhost:3000)
 *
 * Like scripts/og-shots.mjs, the demo's stage is lifted to fill the viewport
 * and the page around it hidden, but the dark ground stays: a GIF has no soft
 * transparency. Frames come from Playwright's screencast, then ffmpeg (on
 * PATH) crops them to the demo and encodes with a two-pass palette, which
 * keeps glows and glass from banding as much as a plain GIF would. */

import { chromium, type Locator, type Page } from "playwright";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const VIEW = { width: 1920, height: 1440 };
// The screencast only captures CSS pixels, so the page is zoomed 2x instead of
// a 2x device scale: small components stay sharp once cropped.
const ZOOM = 2;
// Room around the crop for shadows and glows that spill past the demo's box.
const PAD = 32;
// Multiples of 16, so every size is exactly 16:9.
const WIDTH = 512;
const FPS = 15;

type Box = { x: number; y: number; width: number; height: number };
/** Moves the demo; `mark` widens the crop to take in what shows right now. */
type Steps = (stage: Locator, page: Page, mark: (extra?: Locator) => Promise<void>) => Promise<void>;

// Hover then press the first control: enough for most demos.
const press: Steps = async (stage, page, mark) => {
  const control = stage.locator("button, [role=button], [role=switch], [role=slider]").first();
  await control.hover();
  await page.waitForTimeout(700);
  await mark();
  await control.click();
  await page.waitForTimeout(1500);
  await mark();
};

// Demos the default press doesn't show off.
const STEPS: Record<string, Steps> = {
  "nav-notch": async (stage, page, mark) => {
    for (const label of ["Link 2", "Link 9"]) {
      await stage.getByText(label, { exact: true }).click();
      await page.waitForTimeout(1100);
    }
    await mark();
  },
  "contact-lens": async (stage, page, mark) => {
    await stage.locator('button[aria-label^="Copy website"]').first().hover();
    await page.waitForTimeout(900);
    // The pill floats above the line, outside the demo's own box.
    await mark(stage.locator("span[aria-hidden].absolute").first());
    await stage.locator('button[aria-label^="Copy website"]').first().click();
    await page.waitForTimeout(1300);
  },
  "liquid-glass": async (stage, page, mark) => {
    await stage.locator('button[aria-haspopup="menu"]').first().click();
    await page.waitForTimeout(1600);
    // The rows' clip layer spans the glass panel itself.
    await mark(stage.locator('[role="menu"]').locator(".."));
    // Picking a row melts it back; Escape would leave a focus ring.
    await stage.getByRole("menuitem").nth(1).click();
    await page.waitForTimeout(1300);
  },
  "file-upload": async (stage, page, mark) => {
    const file = (name: string, mb: number) => ({
      name,
      mimeType: "application/octet-stream",
      buffer: Buffer.alloc(mb * 1e6),
    });
    await stage
      .locator('input[type="file"]')
      .first()
      .setInputFiles([file("brand-kit.zip", 4), file("logo-final.ai", 2)]);
    await page.waitForTimeout(4800);
    await mark();
  },
  "kpi-chart": async (stage, page, mark) => {
    // Points are evenly spaced, so click along the plot by fraction.
    const plot = await stage.getByRole("slider").first().boundingBox();
    if (!plot) throw new Error("no plot");
    for (const at of [0.5, 0.25, 1]) {
      await page.mouse.click(plot.x + plot.width * at - (at === 1 ? 4 : 0), plot.y + plot.height * 0.6);
      await page.waitForTimeout(1300);
    }
    await mark();
  },
  badge: async (stage, page, mark) => {
    await stage.getByRole("button", { name: /^Remove Files/ }).click();
    await page.waitForTimeout(1200);
    await mark();
    await stage.getByRole("button", { name: "Restore removed badges" }).click();
    await page.waitForTimeout(1200);
  },
  "image-generation": async (stage, page, mark) => {
    // The demo loops queued, generating, refining, complete on its own; the
    // pointer swells the dots while it runs and a click sends a ripple.
    const frame = await stage.getByRole("img").first().boundingBox();
    if (!frame) throw new Error("no frame");
    for (let i = 0; i <= 10; i++) {
      await page.mouse.move(frame.x + frame.width * (0.2 + i * 0.06), frame.y + frame.height * (0.3 + i * 0.04));
      await page.waitForTimeout(120);
    }
    await page.mouse.click(frame.x + frame.width * 0.6, frame.y + frame.height * 0.6);
    await page.waitForTimeout(1000);
    await page.mouse.move(0, 0);
    await page.waitForTimeout(6500);
    await mark();
  },
  // Recorded from its page in trigger mode (see PAGES): open the picker so it
  // plays its opening, then pick a range.
  "date-range-picker": async (stage, page, mark) => {
    await stage.locator('button[aria-haspopup="dialog"]').click();
    await page.waitForTimeout(1400);
    await mark(stage.getByRole("dialog"));
    await stage.getByRole("button", { name: "3 nights", exact: true }).click();
    await page.waitForTimeout(1400);
  },
  // Flick the front card away twice, then back with the arrow key.
  "flick-cards-slider": async (stage, page, mark) => {
    const front = await stage.locator(".w-max").first().boundingBox();
    if (!front) throw new Error("no deck");
    const cx = front.x + front.width / 2;
    const cy = front.y + front.height / 2;
    for (let i = 0; i < 2; i++) {
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      for (let s = 1; s <= 12; s++) {
        await page.mouse.move(cx - s * 18, cy, { steps: 1 });
        await page.waitForTimeout(16);
      }
      await page.mouse.up();
      await page.waitForTimeout(1300);
    }
    await mark();
  },
  // Open the note, type into it and save, so it melts back to the pill.
  "morphing-popover": async (stage, page, mark) => {
    await stage.getByRole("button", { name: /Add note/ }).click();
    await page.waitForTimeout(1300);
    await mark(stage.locator("form").first());
    await stage.locator("textarea").first().pressSequentially("Tighten the title", { delay: 45 });
    await page.waitForTimeout(400);
    await stage.getByRole("button", { name: "Save note" }).click();
    await page.waitForTimeout(1500);
  },
  // Right-click the card, walk down to Move to and into its submenu, then
  // pick Archive.
  "context-menu": async (stage, page, mark) => {
    const area = await stage.locator(".w-max").first().boundingBox();
    if (!area) throw new Error("no card");
    await page.mouse.click(area.x + area.width * 0.42, area.y + area.height * 0.4, { button: "right" });
    await page.waitForTimeout(900);
    const menu = page.getByRole("menu").first();
    await mark(menu);
    for (const label of ["Rename", "Copy link", "Move to"]) {
      await menu.getByRole("menuitem", { name: label }).hover();
      await page.waitForTimeout(380);
    }
    await page.waitForTimeout(700);
    await mark(page.getByRole("menu").last());
    await page.getByRole("menu").last().getByRole("menuitem", { name: "Archive" }).hover();
    await page.waitForTimeout(400);
    await page.getByRole("menu").last().getByRole("menuitem", { name: "Archive" }).click();
    await page.waitForTimeout(1100);
  },
  // Step through a few views; the crop follows the island alone.
  "dynamic-island": async (stage, page, mark) => {
    const island = stage.locator('div[class*="min-w-25"]').first();
    for (const view of ["Timer", "AirDrop", "Screen record", "Music"]) {
      await stage.getByRole("button", { name: view, exact: true }).click();
      await page.waitForTimeout(2000);
      await mark(island);
    }
  },
  // Hover down the rows, then search and open the theme page; Clear is left
  // alone so the list never drops a group mid-recording.
  "command-palette": async (stage, page, mark) => {
    const rows = stage.getByRole("option");
    for (const i of [0, 1, 2, 3]) {
      await rows.nth(i).hover();
      await page.waitForTimeout(320);
    }
    await page.mouse.move(0, 0);
    const field = stage.getByRole("combobox").first();
    await field.click();
    await field.pressSequentially("theme", { delay: 70 });
    await page.waitForTimeout(600);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1100);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(500);
    await mark();
  },
  // The card opens on the panel: fold it into the pill, unfold it again and
  // roll a link to its hover color.
  "menu-notch": async (stage, page, mark) => {
    await mark();
    const toggle = stage.getByRole("button", { name: /^(Close|Menu)$/ }).first();
    await toggle.click();
    await page.waitForTimeout(1100);
    await toggle.click();
    await page.waitForTimeout(1200);
    await mark();
    for (const label of ["About", "Resources"]) {
      await stage.getByText(label, { exact: true }).first().hover();
      await page.waitForTimeout(700);
    }
  },
  // Walk the tooltip across a few bars.
  "chart-card": async (stage, page, mark) => {
    for (const month of ["Apr", "Aug", "Feb", "Jun"]) {
      const label = await stage.getByText(month, { exact: true }).first().boundingBox();
      if (!label) throw new Error("no bars");
      await page.mouse.click(label.x + label.width / 2, label.y - 60);
      await page.waitForTimeout(800);
    }
    await mark();
  },
  // Open the Library panel, then fold it back into the dock.
  "menu-dock": async (stage, page, mark) => {
    await stage.getByRole("menuitem", { name: "Library" }).first().click();
    await page.waitForTimeout(1200);
    await mark(stage.locator('[class*="smooth-shadow-ring-lg"]').first());
    await stage.getByRole("menuitem", { name: "Bookmarked" }).first().hover();
    await page.waitForTimeout(600);
    // A click outside folds it; Escape would leave a focus ring.
    await page.mouse.click(4, 4);
    await page.waitForTimeout(1100);
  },
  // Radios with no button to press: click through the options.
  tabs: async (stage, page, mark) => {
    for (const label of ["History", "Settings", "Playlist"]) {
      await stage.getByText(label, { exact: true }).click();
      await page.waitForTimeout(900);
    }
    await mark();
  },
};

/** Demos the catalog card can't show, recorded from their page's live preview
 *  instead; `crop` is what the frame holds before the steps run. */
const PAGES: Record<string, { crop: string; setup?: (stage: Locator) => Promise<void> }> = {
  "date-range-picker": {
    crop: 'button[aria-haspopup="dialog"]',
    // The preview's Trigger tab, picked before recording starts.
    setup: (stage) => stage.getByText("trigger", { exact: true }).click(),
  },
};

/** Demos left at 1x: the context menu places itself from the pointer's
 *  client position, which page zoom throws off, so it opened off screen. */
const UNZOOMED = new Set(["context-menu"]);

/** Catalog demos framed by one part instead of their whole box. */
const CROP: Record<string, string> = {
  // The island, not the row of view buttons under it.
  "dynamic-island": 'div[class*="min-w-25"]',
};

const union = (a: Box | null, b: Box | null): Box | null => {
  if (!a || !b) return a ?? b;
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  };
};

function encode(list: string, crop: Box, out: string, width: number, fps: number) {
  const r = (n: number) => (n / VIEW.width).toFixed(5);
  const s = (n: number) => (n / VIEW.height).toFixed(5);
  const filter = [
    `crop=iw*${r(crop.width)}:ih*${s(crop.height)}:iw*${r(crop.x)}:ih*${s(crop.y)}`,
    `fps=${fps}`,
    `scale=${width}:${(width * 9) / 16}:flags=lanczos`,
    "split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle",
  ].join(",");
  const run = spawnSync(
    "ffmpeg",
    ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", list, "-vf", filter, "-loop", "0", out],
    { encoding: "utf8" },
  );
  if (run.error) throw new Error(`ffmpeg didn't run (${run.error.message}). Is it on PATH?`);
  if (run.status !== 0) throw new Error(`ffmpeg: ${run.stderr.trim()}`);
}

/** Records each slug's demo into `dir` as `<slug>.gif`, each under `budget`
 *  bytes. Returns the slugs that worked; a failed one is warned about and
 *  left out, so its card can fall back to the OG image. */
export async function demoGifs(slugs: string[], base: string, dir: string, budget: number) {
  const done = new Set<string>();
  const browser = await chromium.launch({ channel: "chrome" });
  try {
    for (const slug of slugs) {
      const page = await browser.newPage({ viewport: VIEW, colorScheme: "dark" });
      try {
        await page.addInitScript(() => localStorage.setItem("devignerui-theme", "dark"));
        const own = PAGES[slug];
        await page.goto(`${base}/components${own ? `/${slug}` : ""}`, { waitUntil: "load" });
        await page.addStyleTag({
          content: `
            html { zoom: ${UNZOOMED.has(slug) ? 1 : ZOOM}; }
            body { visibility: hidden; }
            .gif-solo {
              visibility: visible;
              position: fixed !important;
              inset: 0 !important;
              height: auto !important;
              z-index: 2147483647;
              background: none !important;
            }
            .gif-solo::before, .gif-solo > span { display: none !important; }
            /* Menus portalled out of the stage still show. */
            [role="menu"], [role="menu"] * { visibility: visible; }
            [role="menu"] { z-index: 2147483647 !important; }
          `,
        });
        const stage = page.locator(
          own ? "[data-gif-stage]" : `article[aria-labelledby='card-${slug}'] .frame-surface`,
        );
        await stage.scrollIntoViewIfNeeded({ timeout: 5000 });
        await stage.evaluate((el) => el.classList.add("gif-solo"));
        await page.mouse.move(0, 0);
        // LazyMount swaps the demo in and FitToStage refits before recording.
        await page.waitForTimeout(1200);
        if (own?.setup) {
          await own.setup(stage);
          await page.mouse.move(0, 0);
          await page.waitForTimeout(700);
        }

        const frames: { data: Buffer; timestamp: number }[] = [];
        await page.screencast.start({
          onFrame: (f) => void frames.push(f),
          size: VIEW,
          quality: 95,
        });
        let crop = null as Box | null;
        const mark = async (extra?: Locator) => {
          crop = union(crop, await stage.locator(own?.crop ?? CROP[slug] ?? ".w-max").first().boundingBox());
          if (extra) crop = union(crop, await extra.boundingBox());
        };
        await page.waitForTimeout(600);
        await mark();
        await (STEPS[slug] ?? press)(stage, page, mark);
        await page.mouse.move(0, 0);
        await page.waitForTimeout(900);
        await page.screencast.stop();
        if (frames.length < 2 || !crop) throw new Error("no frames recorded");

        // Screencast frames come only when something changes, so each one is
        // held until the next one's timestamp.
        const work = mkdtempSync(join(dir, `${slug}-`));
        const list = frames.map((f, i) => {
          const name = join(work, `${i}.jpg`);
          writeFileSync(name, f.data);
          const next = frames[i + 1]?.timestamp ?? f.timestamp + 1000 / FPS;
          return `file '${name.replaceAll("\\", "/")}'\nduration ${((next - f.timestamp) / 1000).toFixed(4)}`;
        });
        // concat drops the last frame's duration unless it's listed again.
        list.push(list.at(-1)!.split("\n")[0]);
        writeFileSync(join(work, "list.txt"), list.join("\n"));

        // A 16:9 frame centered on the demo, never narrower than the GIF
        // itself, so small demos sit in dark ground instead of being upscaled.
        const box = crop as Box;
        const width = Math.min(
          VIEW.width,
          Math.max(box.width + PAD * 2, ((box.height + PAD * 2) * 16) / 9, WIDTH),
        );
        const height = (width * 9) / 16;
        const clamp = (v: number, max: number) => Math.min(Math.max(0, v), max);
        const area = {
          x: clamp(box.x + box.width / 2 - width / 2, VIEW.width - width),
          y: clamp(box.y + box.height / 2 - height / 2, VIEW.height - height),
          width,
          height,
        };
        const out = join(dir, `${slug}.gif`);
        // Smaller and choppier until it fits under Discord's upload limit.
        for (const [width, fps] of [[WIDTH, FPS], [416, 12], [336, 10]]) {
          encode(join(work, "list.txt"), area, out, width, fps);
          if (statSync(out).size <= budget) break;
        }
        const size = statSync(out).size;
        if (size > budget) throw new Error(`${(size / 1e6).toFixed(1)} MB even at its smallest`);
        console.log(`Recorded ${slug} (${(size / 1e6).toFixed(1)} MB).`);
        done.add(slug);
      } catch (err) {
        console.warn(`Couldn't record ${slug} (${(err as Error).message.split("\n")[0]}); using its OG image.`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
  return done;
}

if (import.meta.main) {
  const [slug, base = "http://localhost:3000"] = process.argv.slice(2);
  if (!slug) {
    console.error("Usage: node scripts/demo-gif.mts <slug> [baseUrl]");
    process.exit(1);
  }
  const dir = join(tmpdir(), "devigner-demo-gifs");
  mkdirSync(dir, { recursive: true });
  if ((await demoGifs([slug], base, dir, 8e6)).size) console.log(join(dir, `${slug}.gif`));
}
