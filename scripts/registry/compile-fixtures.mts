import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { descriptors } from "./descriptors.mts";
import { copyPasteSource } from "./generate.mts";
import { guides } from "./guides.mts";

const root = resolve(import.meta.dirname, "../..");
const fixturesRoot = resolve(root, "packages/ui/.registry-fixtures");
const uiPackage = JSON.parse(readFileSync(resolve(root, "packages/ui/package.json"), "utf8"));
const tsc = resolve(root, "node_modules/typescript/lib/tsc.js");

function importedPackages(code: string) {
  return [...code.matchAll(/ from "([^"./][^"]*)"/g)].map(([, specifier]) => specifier.startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0]);
}

rmSync(fixturesRoot, { recursive: true, force: true });
try {
  for (const descriptor of descriptors) {
    const fixture = resolve(fixturesRoot, descriptor.slug);
    const source = copyPasteSource(descriptor.sourceFile);
    const missing = importedPackages(source).filter((dependency) => !descriptor.dependencies.includes(dependency));
    if (missing.length) throw new Error(`${descriptor.slug} is missing declared dependencies: ${missing.join(", ")}`);
    mkdirSync(resolve(fixture, "components/ui"), { recursive: true });
    writeFileSync(resolve(fixture, "components/ui", `${descriptor.slug}.tsx`), source);
    // Each guide recipe is a complete module: type-check it against the copy
    // of the component a user would have, so the docs cannot drift.
    guides[descriptor.slug].recipes.forEach((recipe, index) => {
      writeFileSync(
        resolve(fixture, "components", `recipe-${index}.tsx`),
        recipe.code.replaceAll(`"@/components/ui/${descriptor.slug}"`, `"./ui/${descriptor.slug}"`),
      );
    });
    writeFileSync(resolve(fixture, "package.json"), JSON.stringify({
      private: true,
      dependencies: Object.fromEntries(descriptor.dependencies.map((dependency) => [dependency, dependency === "devignerui" ? "file:../.." : (uiPackage.dependencies[dependency] ?? uiPackage.peerDependencies[dependency] ?? uiPackage.devDependencies[dependency] ?? "*")])),
    }, null, 2));
    writeFileSync(resolve(fixture, "tsconfig.json"), JSON.stringify({
      compilerOptions: {
        target: "ES2022", module: "Preserve", moduleResolution: "bundler", jsx: "react-jsx", strict: true, noEmit: true, skipLibCheck: true, ignoreDeprecations: "6.0", baseUrl: "../..",
        paths: { "devignerui/motion": ["src/motion.ts"], "devignerui/hooks": ["src/hooks.ts"], "devignerui/menu-path": ["src/menu-path.ts"], "devignerui/date-range": ["src/date-range.ts"] },
      },
      include: ["components/**/*.tsx"],
    }, null, 2));
    execFileSync(process.execPath, [tsc, "--project", "tsconfig.json"], { cwd: fixture, stdio: "inherit" });
  }
} finally {
  rmSync(fixturesRoot, { recursive: true, force: true });
}