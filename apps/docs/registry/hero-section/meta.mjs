export default {
  name: "Hero Section",
  kind: "block",
  description: "Animated hero section with multiple layout variants",
  category: "marketing",
  access: "pro",
  variants: ["Centered", "Split", "Minimal"],
  props: [
    {
      name: "title",
      type: "string",
      default: "—",
      description: "Main headline text.",
    },
    {
      name: "description",
      type: "string",
      default: "—",
      description: "Supporting paragraph below the title.",
    },
    {
      name: "primaryAction",
      type: "ReactNode",
      default: "—",
      description: "Primary call-to-action element.",
    },
    {
      name: "secondaryAction",
      type: "ReactNode",
      default: "—",
      description: "Secondary call-to-action element.",
    },
    {
      name: "className",
      type: "string",
      default: "—",
      description: "Additional classes for the section.",
    },
  ],
};
