import {
  LogoNextjs,
  LogoReact,
  LogoShadcn,
  LogoTailwind,
  LogoTypeScript,
  LogoVite,
} from "../brand-logos";

// The stack it fits into. Tech logos, not customers.
const STACK = [
  { name: "React", Logo: LogoReact },
  { name: "Next.js", Logo: LogoNextjs },
  { name: "Tailwind CSS", Logo: LogoTailwind },
  { name: "TypeScript", Logo: LogoTypeScript },
  { name: "Vite", Logo: LogoVite },
  { name: "shadcn/ui", Logo: LogoShadcn },
];

export function WorksWith() {
  return (
    <section aria-label="Works with" className="border-y border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 lg:flex-row lg:items-center lg:justify-between">
        <p className="max-w-64 text-[14px]/6 text-text-muted">
          Built for React 19 and Tailwind CSS v4. It drops into the stack you already have.
        </p>
        <ul className="flex flex-wrap items-center gap-x-9 gap-y-4">
          {STACK.map(({ name, Logo }) => (
            <li key={name} className="flex items-center gap-2.5 text-[15px] font-medium text-text-tertiary">
              <Logo className="size-5 opacity-80" />
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
