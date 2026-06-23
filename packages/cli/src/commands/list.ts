import { Command } from "commander";

export const listCommand = new Command()
  .name("list")
  .description("List available components")
  .option("--free", "Show only free components")
  .option("--category <category>", "Filter by category")
  .action((options) => {
    console.log("\nAvailable components:\n");
    console.log("  Component          Category     Styles  Variants  Free");
    console.log("  ─────────────────  ───────────  ──────  ────────  ────");
    console.log("  button             primitives   3       6         Yes");
    console.log("  card               primitives   3       3         Yes");
    console.log("  input              forms        3       4         Yes");
    console.log("  badge              primitives   3       6         Yes");
    console.log("  hero-section       marketing    3       3         Yes");
    console.log("");
    console.log("  5 components, 15 design styles, 22 variants total");
    console.log("");
    console.log("  Design styles per component:");
    console.log("    button:    default, gradient, magnetic");
    console.log("    card:      default, glass, spotlight");
    console.log("    input:     default, floating, underline");
    console.log("    badge:     default, pill, dot");
    console.log("    hero:      default, gradient, parallax");
    console.log("");
    console.log("  Usage:");
    console.log("    npx devignerui add button                 # default style");
    console.log("    npx devignerui add button --style magnetic  # magnetic style");
    console.log("    npx devignerui add card --style glass      # glass style");
  });
