export default {
  name: "Button",
  kind: "component",
  description: "Flexible button component with multiple variants and sizes",
  category: "primitives",
  variants: ["Default", "Destructive", "Outline", "Secondary", "Ghost", "Link"],
  props: [
    {
      name: "variant",
      type: '"default" | "destructive" | "outline" | "secondary" | "ghost" | "link"',
      default: '"default"',
      description: "Visual style of the button.",
    },
    {
      name: "size",
      type: '"sm" | "md" | "lg" | "icon"',
      default: '"md"',
      description: "Controls height and padding.",
    },
    {
      name: "pressScale",
      type: "number",
      default: "0.96",
      description: "Scale applied on press.",
    },
    {
      name: "ripple",
      type: "boolean",
      default: "false",
      description: "Spawn a Material-style ripple from the press point.",
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
      description: "Button label or content.",
    },
  ],
};
