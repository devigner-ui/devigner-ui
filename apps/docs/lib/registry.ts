// Single source of truth for the component docs (grid + [slug] page).
// Holds the curated, standalone copy-paste source per component — deliberately
// distinct from the internal packages/ui source (different import paths,
// tokens, forwardRef). One style per component; each installs as
// components/ui/<slug>.tsx.

export interface PropDef {
  name: string;
  type: string;
  default: string;
  description: string;
}

export interface ComponentData {
  slug: string;
  name: string;
  description: string;
  category: string;
  variants: string[];
  props: PropDef[];
  code: string;
  /** Example shown in the Code tab. */
  usage: string;
  notes?: string[];
}

/** Slug-keyed registry the docs read from. */
export const components: Record<string, ComponentData> = {
  button: {
    slug: "button",
    name: "Button",
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
    code: `"use client";

import { useCallback, useRef, useState, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer rounded-lg text-sm/5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-border bg-background hover:bg-surface",
        secondary: "bg-surface text-foreground hover:bg-surface-hover",
        ghost: "hover:bg-surface hover:text-foreground",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 rounded-lg px-3 py-1.5",
        md: "h-10 rounded-lg px-4 py-2",
        lg: "h-11 rounded-lg px-8 py-2.5",
        icon: "size-10 rounded-lg",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

function useHoverCapable() {
  const [canHover, setCanHover] = useState(true);
  useState(() => {
    if (typeof window !== "undefined") {
      setCanHover(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
    }
  });
  return canHover;
}

export const Button = forwardRef(
  ({ className, variant, size, pressScale = 0.96, ripple = false, onPointerDown, children, ...props }, ref) => {
    const reduce = useReducedMotion();
    const canHover = useHoverCapable();
    const [ripples, setRipples] = useState([]);
    const nextId = useRef(0);

    const handlePointerDown = useCallback((event) => {
      if (ripple && !reduce) {
        const rect = event.currentTarget.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;
        setRipples((prev) => [
          ...prev,
          { id: nextId.current++, x: event.clientX - rect.left, y: event.clientY - rect.top, size },
        ]);
      }
      onPointerDown?.(event);
    }, [ripple, reduce, onPointerDown]);

    return (
      <motion.button
        ref={ref}
        whileTap={reduce ? undefined : { scale: pressScale }}
        whileHover={reduce || !canHover ? undefined : { scale: 1.02 }}
        transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.6 }}
        onPointerDown={handlePointerDown}
        className={cn(buttonVariants({ variant, size }), ripple && "relative overflow-hidden", className)}
        {...props}
      >
        {ripple && !reduce ? (
          <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            <AnimatePresence>
              {ripples.map((r) => (
                <motion.span
                  key={r.id}
                  className="absolute rounded-full bg-current"
                  style={{ left: r.x, top: r.y, width: r.size, height: r.size, x: "-50%", y: "-50%" }}
                  initial={{ scale: 0, opacity: 0.3 }}
                  animate={{ scale: 1, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
                  onAnimationComplete={() => setRipples((prev) => prev.filter((x) => x.id !== r.id))}
                />
              ))}
            </AnimatePresence>
          </span>
        ) : null}
        {children}
      </motion.button>
    );
  }
);`,
    usage: `import { Button } from "@/components/ui/button";

export default function Example() {
  return (
    <div className="flex gap-3">
      <Button>Button</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
    </div>
  );
}`,
  },
  card: {
    slug: "card",
    name: "Card",
    description:
      "Compound card component with header, content, and footer sections",
    category: "primitives",
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
    code: `import { cn } from "@/lib/utils";

        function Card({ className, ...props }) {
          return (
            <div className={cn("rounded-2xl border border-border bg-background shadow-card", className)} {...props} />
          );
        }

        function CardHeader({ className, ...props }) {
          return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;
        }

        function CardTitle({ className, ...props }) {
          return <div className={cn("text-2xl/8 font-semibold tracking-[-0.96px] text-foreground", className)} {...props} />;
        }

        function CardContent({ className, ...props }) {
          return <div className={cn("p-6 pt-0", className)} {...props} />;
        }`,
    usage: `import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

export default function Example() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Project Atlas</CardTitle>
      </CardHeader>
      <CardContent>Deployed to production two hours ago.</CardContent>
    </Card>
  );
}`,
  },
  input: {
    slug: "input",
    name: "Input",
    description: "Form input components with label, error states, and textarea",
    category: "forms",
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
    code: `import { cn } from "@/lib/utils";

const Input = ({ className, type, ...props }) => (
  <input
    type={type}
    className={cn(
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base/6 placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
);`,
    usage: `import { Input } from "@/components/ui/input";

export default function Example() {
  return <Input type="email" placeholder="you@example.com" />;
}`,
  },
  badge: {
    slug: "badge",
    name: "Badge",
    description: "Small label component for status, categories, and tags",
    category: "primitives",
    variants: [
      "Default",
      "Secondary",
      "Outline",
      "Destructive",
      "Success",
      "Warning",
    ],
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
    code: `import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-pill border px-2.5 py-0.5 text-xs/4 font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-accent text-accent-foreground",
        secondary: "border-transparent bg-surface text-foreground",
        outline: "border-border text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}`,
    usage: `import { Badge } from "@/components/ui/badge";

export default function Example() {
  return (
    <div className="flex gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  );
}`,
  },
  "hero-section": {
    slug: "hero-section",
    name: "Hero Section",
    description: "Animated hero section with multiple layout variants",
    category: "marketing",
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
    code: `import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function HeroSection({ title, description, primaryAction, secondaryAction, className }) {
  return (
    <section className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-5xl/14 font-semibold tracking-[-2.88px] text-foreground"
      >
        {title}
      </motion.h1>
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-6 max-w-2xl text-base/6 text-text-secondary"
        >
          {description}
        </motion.p>
      )}
      {(primaryAction || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex gap-4"
        >
          {primaryAction}
          {secondaryAction}
        </motion.div>
      )}
    </section>
  );
}`,
    usage: `import { HeroSection } from "@/components/ui/hero-section";
import { Button } from "@/components/ui/button";

export default function Example() {
  return (
    <HeroSection
      title="Build faster."
      description="A clean hero with animated text reveal."
      primaryAction={<Button>Get started</Button>}
      secondaryAction={<Button variant="outline">Learn more</Button>}
    />
  );
}`,
  },
};

/* ─── CLI-facing registry (served by /api/registry → consumed by the CLI) ─── */

const UTIL_CODE = `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`;

/** npm dependencies a component needs, derived from what its source imports. */
export function dependenciesFor(code: string): string[] {
  const deps = ["clsx", "tailwind-merge"];
  if (code.includes("class-variance-authority")) deps.push("class-variance-authority");
  if (code.includes("motion/react")) deps.push("motion");
  return deps;
}

const fileFor = (slug: string) => `components/ui/${slug}.tsx`;

/** Index served at GET /api/registry. */
export function getRegistryIndex() {
  return {
    version: "0.2.0",
    components: Object.values(components).map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description,
      category: c.category,
      variantCount: c.variants.length,
      dependencies: dependenciesFor(c.code),
    })),
  };
}

/** Full component served at GET /api/registry/[slug]; null when unknown. */
export function getRegistryComponent(slug: string) {
  const c = components[slug];
  if (!c) return null;

  const file = fileFor(slug);
  return {
    slug: c.slug,
    name: c.name,
    description: c.description,
    category: c.category,
    variants: c.variants,
    props: c.props,
    file,
    dependencies: dependenciesFor(c.code),
    files: { "lib/utils.ts": UTIL_CODE, [file]: c.code },
  };
}
