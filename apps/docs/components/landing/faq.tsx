import { FaqReader } from "./faq-reader";

/** One array feeds both the section and the FAQPage JSON-LD. */
export const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is Devigner UI free?",
    answer:
      "Yes. Every component on the site is free, including for commercial work. Pro will be a separate paid set, and nothing that's free now moves behind it.",
  },
  {
    question: "How do I add a component to my project?",
    answer:
      "Run npx devignerui init once per project, then npx devignerui add with the component's name. The CLI writes the file into components/ui and prints the npm packages it needs.",
  },
  {
    question: "Does it work with shadcn/ui?",
    answer:
      "Yes. Components install into the same components/ui folder and use the standard shadcn/ui color tokens (primary, secondary, muted, accent, border, ring and the rest), so they pick up your existing theme and dark mode with nothing to add.",
  },
  {
    question: "Do I need Framer Motion?",
    answer:
      "Most components use Motion, the library that used to be called Framer Motion, and a few use GSAP. Each component's page and the CLI list exactly which packages it needs.",
  },
  {
    question: "Will it work with the Next.js App Router?",
    answer:
      'Yes. Every component starts with "use client", so you can render it from a server component.',
  },
  {
    question: "How do dark mode and theming work?",
    answer:
      "Every color is a CSS variable. Put the dark class on your html element and the components switch, and override any variable in your own CSS to change the look.",
  },
];

export function Faq() {
  return <FaqReader items={FAQS} />;
}
