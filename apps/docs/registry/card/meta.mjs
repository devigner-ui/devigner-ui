export default {
  name: "Card",
  kind: "component",
  description: "Compound card component with header, content, and footer sections",
  category: "cards",
  variants: ["Default", "Interactive", "Header Only"],
  props: [
    {
      name: "className",
      type: "string",
      default: "—",
      description: "Extra classes for the card container.",
    },
    {
      name: "children",
      type: "ReactNode",
      default: "—",
      description: "Card sections — header, content, footer.",
    },
  ],
};
