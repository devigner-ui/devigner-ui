import { Command } from "commander";
import { fetchIndex, type IndexComponent } from "../registry.js";

export const listCommand = new Command()
  .name("list")
  .description("List available components")
  .option("--free", "Show only free components")
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
    if (options.free) {
      components = components.filter((c) => c.styles.some((s) => s.free));
    }

    if (components.length === 0) {
      console.log("\nNo components match.\n");
      return;
    }

    const totalStyles = components.reduce((n, c) => n + c.styles.length, 0);
    const totalVariants = components.reduce((n, c) => n + c.variantCount, 0);

    console.log("\nAvailable components:\n");
    console.log("  Component          Category     Styles  Variants  Free");
    console.log("  ─────────────────  ───────────  ──────  ────────  ────");
    for (const c of components) {
      const free = c.styles.some((s) => s.free) ? "Yes" : "Pro";
      console.log(
        `  ${c.slug.padEnd(17)}  ${c.category.toLowerCase().padEnd(11)}  ${String(
          c.styles.length
        ).padEnd(6)}  ${String(c.variantCount).padEnd(8)}  ${free}`
      );
    }
    console.log("");
    console.log(
      `  ${components.length} components, ${totalStyles} design styles, ${totalVariants} variants total`
    );
    console.log("");
    console.log("  Design styles per component:");
    for (const c of components) {
      console.log(
        `    ${(c.slug + ":").padEnd(15)} ${c.styles.map((s) => s.slug).join(", ")}`
      );
    }
    console.log("");
    console.log("  Usage:");
    console.log("    npx devignerui add button                   # default style");
    console.log("    npx devignerui add button --style magnetic  # magnetic style");
  });
