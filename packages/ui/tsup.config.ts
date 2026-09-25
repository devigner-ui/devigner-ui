import { readFile, writeFile } from "node:fs/promises";
import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  entry: ["src/index.ts", "src/motion.ts", "src/hooks.ts", "src/menu-path.ts", "src/date-range.ts"],
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: false,
  // ponytail: never clean during --watch. tsup's clean unlinks dist/ before
  // every rebuild; on Windows the Next dev server holds dist/*.map open, the
  // unlink throws EPERM and aborts the JS build mid-pass. Next is already
  // recompiling off the half-written dist, so its route compile dies before
  // it writes .next/server/app/**/app-build-manifest.json - and every later
  // request for that route 500s on the missing manifest until a restart.
  clean: !options.watch,
  external: ["react", "react-dom", "tailwindcss", "motion", "gsap"],
  // esbuild drops module-level "use client" when bundling, which breaks every
  // component inside a Next.js Server Component. Put it back on the bundles
  // that hold hooks; the pure entries (motion, menu-path, date-range) stay
  // server-safe. Same line as the leading comment, so no line shifts.
  async onSuccess() {
    for (const file of ["index.js", "index.cjs", "hooks.js", "hooks.cjs"]) {
      const path = `dist/${file}`;
      const code = await readFile(path, "utf8");
      if (!code.startsWith('"use client";')) await writeFile(path, `"use client";${code}`);
    }
  },
}));
