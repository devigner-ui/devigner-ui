/** Renders the changelog section icons to PNGs for Discord server emojis.
 *
 *   node scripts/changelog-emojis.mts
 *
 * Writes docs/changelog-emojis/*.png. Upload each in Server Settings >
 * Emoji with its file name as the emoji name (cl_new, cl_updated, ...);
 * scripts/changelog-publish.mts finds them by name. See docs/changelog.md. */

import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { chromium } from "playwright";

const root = resolve(import.meta.dirname, "..");
// React and the icons are the docs app's dependencies, not the root's.
const require = createRequire(resolve(root, "apps/docs/package.json"));
// Loosely typed: the root has no React types, and this only renders icons.
const { createElement } = require("react") as {
  createElement: (type: unknown, props: object) => unknown;
};
const { renderToStaticMarkup } = require("react-dom/server") as {
  renderToStaticMarkup: (el: unknown) => string;
};
const icons = require("@devigner-ui/icons") as Record<string, unknown>;

// Brand marks the icon set doesn't have. Copied from LogoDiscord and LogoX in
// apps/docs/components/brand-logos.tsx; keep them in step.
const DISCORD_PATH =
  "M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z";
const X_PATH =
  "M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z";
const mark = (d: string) =>
  `<svg viewBox="-1 -1 26 26" width="128" height="128" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`;

// Name: [icon from @devigner-ui/icons, or an SVG string; color]. Section
// colors match the cards' side bars in changelog-publish.mts; button icons
// sit on Discord's grey buttons, so they stay mid-tone for both themes.
const EMOJIS: Record<string, [string, string]> = {
  cl_new: ["IconMagicStar", "#22c55e"],
  cl_updated: ["IconRefreshCircle", "#5a94ff"],
  cl_fixed: ["IconBug", "#f59e0b"],
  cl_removed: ["IconTrashBinMinimalistic", "#ef4444"],
  cl_site: ["IconGlobal", "#a78bfa"],
  cl_components: ["IconBox", "#5a94ff"],
  cl_request: ["IconChatRoundLine", "#5a94ff"],
  cl_discord: [mark(DISCORD_PATH), "#5865f2"],
  cl_x: [mark(X_PATH), "#b2b4b8"],
};

const out = resolve(root, "docs/changelog-emojis");
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 128, height: 128 } });
for (const [name, [icon, color]] of Object.entries(EMOJIS)) {
  if (!icon.startsWith("<") && !icons[icon])
    throw new Error(`No ${icon} in @devigner-ui/icons.`);
  const svg = icon.startsWith("<")
    ? icon
    : renderToStaticMarkup(
        createElement(icons[icon], {
          variant: "Bulk",
          width: 128,
          height: 128,
        }),
      );
  await page.setContent(
    `<body style="margin:0;background:transparent;color:${color}">${svg}</body>`,
  );
  await page
    .locator("svg")
    .screenshot({ path: resolve(out, `${name}.png`), omitBackground: true });
  console.log(`docs/changelog-emojis/${name}.png`);
}
await browser.close();
