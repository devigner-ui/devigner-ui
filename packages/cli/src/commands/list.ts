import { Command } from "commander";
import { fetchIndex, type IndexComponent } from "../registry.js";

export const listCommand = new Command()
  .name("list")
  .description("List available components")
  .option("--category <category>", "Filter by category")
  .action(async (options) => {
    let components: IndexComponent[];
    try {
      components = await fetchIndex();
    } catch (error) {
      console.error(`✗ ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }

    if (options.category) {
      const cat = String(options.category).toLowerCase();
      components = components.filter((c) => c.category.toLowerCase() === cat);
    }

    if (components.length === 0) {
      console.log("\nNo components match.\n");
      return;
    }

    const totalVariants = components.reduce((n, c) => n + c.variantCount, 0);

    console.log("\nAvailable components:\n");
    console.log("  Component          Category     Variants");
    console.log("  ─────────────────  ───────────  ────────");
    for (const c of components) {
      console.log(
        `  ${c.slug.padEnd(17)}  ${c.category.toLowerCase().padEnd(11)}  ${c.variantCount}`
      );
    }
    console.log("");
    console.log(
      `  ${components.length} components, ${totalVariants} variants total`
    );
    console.log("");
    console.log("  Usage:");
    console.log("    npx devignerui add magnetic-button");
  });
