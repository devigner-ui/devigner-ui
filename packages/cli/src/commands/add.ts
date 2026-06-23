import { Command } from "commander";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";

const REGISTRY_URL = "https://registry.devignerui.com";

interface RegistryFile {
  path: string;
  content: string;
}

interface RegistryComponent {
  name: string;
  description: string;
  category: string;
  styles: {
    slug: string;
    name: string;
    description: string;
    files: string[];
    dependencies?: string[];
  }[];
  dependencies: string[];
}

async function fetchRegistryIndex(): Promise<RegistryComponent[]> {
  const response = await fetch(`${REGISTRY_URL}/index.json`);
  if (!response.ok) {
    throw new Error("Failed to fetch registry index");
  }
  const data = await response.json();
  return data.components;
}

async function fetchComponent(
  name: string
): Promise<RegistryComponent & { files: Record<string, string> }> {
  const response = await fetch(`${REGISTRY_URL}/components/${name}.json`);
  if (!response.ok) {
    throw new Error(`Component "${name}" not found in registry`);
  }
  return response.json();
}

function installFiles(
  files: Record<string, string>,
  basePath: string,
  filter?: (path: string) => boolean
) {
  for (const [filePath, content] of Object.entries(files)) {
    if (filter && !filter(filePath)) continue;

    const targetPath = resolve(basePath, filePath);
    const dir = dirname(targetPath);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    if (existsSync(targetPath)) {
      console.log(`  ⚠ ${filePath} already exists, skipping`);
      continue;
    }

    writeFileSync(targetPath, content);
    console.log(`  ✓ ${filePath}`);
  }
}

export const addCommand = new Command()
  .name("add")
  .description("Add a component to your project")
  .argument("<components...>", "Component names to add")
  .option(
    "-s, --style <style>",
    "Design style to install (default, gradient, magnetic, etc.)"
  )
  .option("-p, --path <path>", "Override components path")
  .action(async (componentNames: string[], options) => {
    const configPath = resolve("components.json");
    if (!existsSync(configPath)) {
      console.error(
        "✗ components.json not found. Run `npx devignerui init` first."
      );
      process.exit(1);
    }

    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    const basePath = resolve(options.path || config.path || "components/ui");

    console.log(`\nAdding components...\n`);

    for (const name of componentNames) {
      try {
        console.log(`📦 ${name}`);
        const component = await fetchComponent(name);

        const styleSlug = options.style || "default";
        const style = component.styles.find((s) => s.slug === styleSlug);

        if (!style) {
          console.log(
            `  ✗ Style "${styleSlug}" not found. Available: ${component.styles.map((s) => s.slug).join(", ")}`
          );
          continue;
        }

        console.log(`  Style: ${style.name}`);

        const styleFiles = style.files;
        if (!styleFiles || styleFiles.length === 0) {
          console.log(`  ⚠ No files found for style "${styleSlug}"`);
          continue;
        }

        installFiles(
          component.files,
          basePath,
          (filePath) =>
            styleFiles.some((f: string) => filePath.endsWith(f)) ||
            filePath.endsWith("index.ts") ||
            filePath.endsWith("index.tsx")
        );

        console.log(`\n  Install command:`);
        console.log(`  npx devignerui add ${name} --style ${styleSlug}`);
        console.log("");
      } catch (error) {
        console.error(`  ✗ ${error}`);
      }
    }

    console.log("Done!");
  });
