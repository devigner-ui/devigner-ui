export default {
  name: "Badge",
  kind: "component",
  description: "Small label component for status, categories, and tags",
  category: "badges",
  variants: ["Default", "Secondary", "Outline", "Destructive", "Success", "Warning"],
  props: [
    {
      name: "variant",
      type: '"default" | "secondary" | "outline"',
      default: '"default"',
      description: "Color treatment of the badge.",
    },
    {
      name: "className",
      type: "string",
      default: "—",
      description: "Additional classes merged via cn().",
    },
    {
      name: "children",
      type: "ReactNode",
      default: "—",
      description: "Badge label.",
    },
  ],
};
