// Categories are the browsable unit: each holds many distinct designs of the
// same kind. `order` drives display sequence; `description` is the indexable
// blurb on /components/<slug> and /blocks/<slug>.
export default [
  {
    slug: "buttons",
    name: "Buttons",
    kind: "component",
    order: 1,
    description:
      "Button components in several finished designs — variants, sizes, loading and press states included.",
  },
  {
    slug: "inputs",
    name: "Inputs",
    kind: "component",
    order: 2,
    description:
      "Text inputs and form fields, each a complete design with focus, error and disabled states.",
  },
  {
    slug: "badges",
    name: "Badges",
    kind: "component",
    order: 3,
    description:
      "Status, category and tag labels in several treatments.",
  },
  {
    slug: "cards",
    name: "Cards",
    kind: "component",
    order: 4,
    description:
      "Card surfaces for content, products and stats, in several finished layouts.",
  },
  {
    slug: "heroes",
    name: "Heroes",
    kind: "block",
    order: 1,
    description:
      "Complete hero sections — headline, supporting copy, calls to action and layout, ready to drop in.",
  },
];
