export default {
  name: "Input",
  kind: "component",
  description: "Form input components with label, error states, and textarea",
  category: "inputs",
  variants: ["Text Input", "Password", "With Icon", "Textarea"],
  props: [
    {
      name: "type",
      type: "string",
      default: '"text"',
      description: "Native HTML input type.",
    },
    {
      name: "placeholder",
      type: "string",
      default: "—",
      description: "Placeholder text shown when empty.",
    },
    {
      name: "className",
      type: "string",
      default: "—",
      description: "Additional classes merged via cn().",
    },
  ],
};
