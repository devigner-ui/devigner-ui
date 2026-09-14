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

        const content = component.files[component.file];
        if (content === undefined) {
          console.log(`  ⚠ ${component.file} missing from registry, skipping`);
        } else {
          writeFile(component.file, content, basePath);
        }

        if (component.dependencies.length > 0) {
          console.log(`\n  Install dependencies:`);
          console.log(`  npm i ${component.dependencies.join(" ")}`);
        }
        console.log("");
      } catch (error) {
        console.error(`  ✗ ${error instanceof Error ? error.message : error}`);
      }
    }

    console.log("Done!");
  });
