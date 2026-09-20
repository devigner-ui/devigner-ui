// Screenshot a docs page against the running dev server, using the Chrome
// already installed on this machine - `playwright` is the driver only, no
// browser download.
//
//   node scripts/shot.mjs <url> <out.png> [--sel <css>] [--hover <css>]
//                         [--theme light|dark] [--wait <ms>] [--size WxH]
//
// --sel screenshots just that element; --hover parks the pointer on it first
// (repeat the flag to hover several in sequence, one shot each, suffixed).

import { chromium } from "playwright";
import path from "node:path";

const argv = process.argv.slice(2);
const [url, out] = argv;
if (!url || !out) {
  console.error("usage: node scripts/shot.mjs <url> <out.png> [flags]");
  process.exit(1);
}
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};
const all = (name) =>
  argv.reduce(
    (acc, a, i) => (a === `--${name}` ? [...acc, argv[i + 1]] : acc),
    [],
  );

const sel = flag("sel");
const theme = flag("theme", "light");
const wait = Number(flag("wait", 1200));
const [w, h] = flag("size", "1440x900").split("x").map(Number);
const hovers = all("hover");

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
  viewport: { width: w, height: h },
  deviceScaleFactor: 2,
  colorScheme: theme === "dark" ? "dark" : "light",
});
page.on("pageerror", (e) => console.error("[page error]", e.message));
page.on(
  "console",
  (m) => m.type() === "error" && console.error("[console]", m.text()),
);

await page.goto(url, { waitUntil: "load" });
await page.evaluate((t) => {
  document.documentElement.classList.toggle("dark", t === "dark");
  document.documentElement.dataset.theme = t;
}, theme);
await page.waitForTimeout(wait);

const shoot = async (file) => {
  const target = sel ? page.locator(sel).first() : page;
  await target.screenshot({ path: file });
  console.log("wrote", file);
};

if (hovers.length === 0) {
  await shoot(out);
} else {
  const ext = path.extname(out);
  const stem = out.slice(0, -ext.length);
  for (const [i, hv] of hovers.entries()) {
    await page.locator(hv).first().hover();
    // Long enough for the springs to settle.
    await page.waitForTimeout(700);
    await shoot(`${stem}-${i + 1}${ext}`);
  }
}

await browser.close();
