import { Command } from "commander";
import { existsSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fetchComponent } from "../registry.js";

function writeFile(filePath: string, content: string, basePath: string) {
  const targetPath = resolve(basePath, filePath);
  const dir = dirname(targetPath);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  if (existsSync(targetPath)) {
    console.log(`  ⚠ ${filePath} already exists, skipping`);
    return;
  }

  writeFileSync(targetPath, content);
  console.log(`  ✓ ${filePath}`);
}

export const addCommand = new Command()
  .name("add")
  .description("Add a component to your project")
  .argument("<components...>", "Component names to add")
  .option(
    "-s, --style <style>",
    "Design style to install (default, gradient, magnetic, etc.)",
  )
  .option("-p, --path <path>", "Override components path")
  .action(async (componentNames: string[], options) => {
    const configPath = resolve("components.json");
    if (!existsSync(configPath)) {
      console.error(
        "✗ components.json not found. Run `npx devignerui init` first.",
      );
      process.exit(1);
    }

    // Components install relative to the project root; their paths already
    // include components/ui and lib (e.g. "components/ui/button.tsx").
    const basePath = resolve(options.path || ".");

    console.log(`\nAdding components...\n`);

    for (const name of componentNames) {
      try {
        console.log(`📦 ${name}`);
        const component = await fetchComponent(name);

        const styleSlug = options.style || "default";
        const style = component.styles.find((s) => s.slug === styleSlug);

        if (!style) {
          console.log(
            `  ✗ Style "${styleSlug}" not found. Available: ${component.styles
              .map((s) => s.slug)
              .join(", ")}`,
          );
          continue;
        }

        console.log(`  Style: ${style.name}`);

        // Install the style's own file plus the shared cn() util.
        for (const filePath of [style.file, "lib/utils.ts"]) {
          const content = component.files[filePath];
          if (content === undefined) {
            console.log(`  ⚠ ${filePath} missing from registry, skipping`);
            continue;
          }
          writeFile(filePath, content, basePath);
        }

        if (style.dependencies.length > 0) {
          console.log(`\n  Install dependencies:`);
          console.log(`  npm i ${style.dependencies.join(" ")}`);
        }
        console.log("");
      } catch (error) {
        console.error(`  ✗ ${error instanceof Error ? error.message : error}`);
      }
    }

    console.log("Done!");
  });
