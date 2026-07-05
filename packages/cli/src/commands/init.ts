import { Command } from "commander";
import { existsSync, writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

export const initCommand = new Command()
  .name("init")
  .description("Initialize Devigner UI in your project")
  .option("-p, --path <path>", "Path to components directory", "components/ui")
  .option("--css <path>", "Path to global CSS file", "src/index.css")
  .option("--tailwind <version>", "Tailwind CSS version", "4")
  .action((options) => {
    const configPath = resolve("components.json");
    const cssPath = resolve(options.css);
    const componentsDir = resolve(options.path);

    // Create components directory if it doesn't exist
    if (!existsSync(componentsDir)) {
      mkdirSync(componentsDir, { recursive: true });
      console.log(`✓ Created ${options.path}`);
    }

    // Create components.json config
    const config = {
      $schema: "https://devignerui.com/schema.json",
      tailwind: {
        config: options.tailwind === "4" ? "" : "tailwind.config.js",
        css: options.css,
        baseColor: "neutral",
        cssVariables: true,
      },
      aliases: {
        components: "@/components",
        ui: "@/components/ui",
        lib: "@/lib",
        hooks: "@/hooks",
      },
      path: options.path,
    };

    writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`✓ Created components.json`);

    console.log(`\nDevigner UI initialized!`);
    console.log(`\nNext steps:`);
    console.log(`  1. Add a component: npx devignerui add button`);
    console.log(`  2. List components:  npx devignerui list`);
  });
