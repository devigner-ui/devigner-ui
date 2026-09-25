import { IconArrowRight } from "@devigner-ui/icons";
import { FaqList } from "./faq-list";

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
      "Yes. Both use a components/ui folder and many of the same CSS variable names, like --primary and --ring. Devigner components also read a few tokens of their own, such as --surface and --brand.",
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
  return (
    <section aria-labelledby="faq-title" className="border-t border-border py-24 sm:py-32">
      <div className="mx-auto max-w-195 px-5">
        <h2
          id="faq-title"
          className="text-center text-[clamp(2rem,3.6vw,2.875rem)] leading-[1.04] font-semibold tracking-tighter text-balance text-foreground"
        >
          Questions, before you <span className="accent-word">install</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-center text-[17px]/7 text-pretty text-text-secondary">
          Short answers to what people ask before they run the first command.
        </p>
        <FaqList items={FAQS} />
        <p className="mt-7 text-center text-[14.5px] text-text-muted">
          Still wondering about something?{" "}
          <a
            href="https://x.com/devignerui"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1 font-medium text-foreground"
          >
            Ask @devignerui on X
            <IconArrowRight
              aria-hidden
              className="size-3.5 text-brand transition-transform duration-200 ease-out group-hover:translate-x-0.5"
            />
          </a>
        </p>
      </div>
    </section>
  );
}
