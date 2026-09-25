import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixtureDirectory = mkdtempSync(join(tmpdir(), "devignerui-ui-smoke-"));
const tarballDirectory = join(fixtureDirectory, "tarballs");
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function runPnpm(args, cwd) {
  if (process.platform === "win32") {
    execFileSync(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", pnpm, ...args], {
      cwd,
      stdio: "inherit",
    });
    return;
  }
  execFileSync(pnpm, args, { cwd, stdio: "inherit" });
}

try {
  mkdirSync(tarballDirectory);
  runPnpm(["pack", "--pack-destination", tarballDirectory], packageDirectory);

  const tarball = readdirSync(tarballDirectory).find((file) =>
    file.endsWith(".tgz"),
  );
  assert.ok(tarball, "pnpm pack did not create a tarball");

  const appDirectory = join(fixtureDirectory, "fixture");
  mkdirSync(appDirectory);
  writeFileSync(
    join(appDirectory, "package.json"),
    `${JSON.stringify(
      {
        name: "ui-package-smoke-fixture",
        private: true,
        type: "module",
        dependencies: {
          "@devigner-ui/icons": "3.3.0",
          "devignerui": `file:${join(tarballDirectory, tarball)}`,
          gsap: "3.15.0",
          motion: "13.4.0",
          react: "19.3.0",
          "react-dom": "19.3.0",
          tailwindcss: "4.3.3",
        },
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    join(appDirectory, "imports.mjs"),
    `import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";

await import("devignerui");
await import("devignerui/motion");
await import("devignerui/hooks");await import("devignerui/menu-path");

const require = createRequire(import.meta.url);
require("devignerui");
require("devignerui/motion");
require("devignerui/hooks");require("devignerui/menu-path");
assert.ok(
  existsSync(require.resolve("devignerui/styles.css")),
  "stylesheet export did not resolve",
);
`,
  );

  runPnpm(["install", "--ignore-scripts"], appDirectory);
  runPnpm(["exec", "devignerui", "--version"], appDirectory);
  runPnpm(["exec", "devignerui", "init"], appDirectory);
  runPnpm(["exec", "devignerui", "list"], appDirectory);
  runPnpm(["exec", "devignerui", "add", "magnetic-button"], appDirectory);
  assert.ok(existsSync(join(appDirectory, "components/ui/magnetic-button.tsx")));
  execFileSync(process.execPath, ["imports.mjs"], {
    cwd: appDirectory,
    stdio: "inherit",
  });
} finally {
  rmSync(fixtureDirectory, { force: true, recursive: true });
}
