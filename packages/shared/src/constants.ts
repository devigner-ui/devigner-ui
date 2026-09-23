export const REGISTRY_URL = "https://registry.devignerui.com";
export const CLI_VERSION = "0.1.0";

export const COMPONENT_CATEGORIES = {
  primitives: "Primitives",
  forms: "Forms",
  feedback: "Feedback",
  data: "Data Display",
  navigation: "Navigation",
  overlays: "Overlays",
  marketing: "Marketing Blocks",
  animation: "Animation",
  layout: "Layout",
} as const;

// Every shipped component is free until the first Pro one lands.
export const FREE_COMPONENTS = [
  "magnetic-button",
  "chart-card",
  "delete-button",
  "timeline",
  "menu-dock",
  "date-range-picker",
];
