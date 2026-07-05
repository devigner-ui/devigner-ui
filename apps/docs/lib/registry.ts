// Single source of truth for the component docs (grid + [slug] page).
// Holds the curated, standalone copy-paste source per style — deliberately distinct
// from the internal packages/ui source (different import paths, tokens, forwardRef).
//
// ponytail: the four sub-maps below were relocated verbatim from [slug]/page.tsx and
// merged into `components` at load. They could be flattened into one literal per
// component later; the merge keeps the move zero-risk for now. The registry/*.json
// files + /api/registry routes are the older, CLI-facing copy — reconcile them onto
// this module when the CLI gets repointed (deferred step).

export interface PropDef {
  name: string;
  type: string;
  default: string;
  description: string;
}

export interface ComponentStyle {
  name: string;
  slug: string;
  description: string;
  free: boolean;
  status: "new" | "updated" | "stable";
  code: string;
  /** Example shown in the Code tab. Falls back to `code` when not authored. */
  usage: string;
}

export interface ComponentData {
  slug: string;
  name: string;
  description: string;
  category: string;
  variants: string[];
  props: PropDef[];
  styles: ComponentStyle[];
  notes?: string[];
}

const styles: Record<string, Omit<ComponentStyle, "usage">[]> = {
  button: [
    {
      name: "Default",
      slug: "default",
      description: "Clean, minimal button with CVA variants",
      free: true,
      status: "stable",
      code: `import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm/5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background hover:bg-foreground/90",
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

export function Button({ className, variant, size, ...props }) {
  return (
    <button className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}`,
    },
    {
      name: "Gradient",
      slug: "gradient",
      description: "Gradient background with glow hover effect",
      free: true,
      status: "new",
      code: `import { cn } from "@/lib/utils";

export function ButtonGradient({ className, size = "md", children, ...props }) {
  return (
    <button
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium text-white transition-all duration-300",
        "bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-size-[200%_auto] bg-left hover:bg-right",
        "shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30",
        size === "sm" && "h-9 px-4 text-sm",
        size === "md" && "h-11 px-6 text-sm",
        size === "lg" && "h-12 px-8 text-base",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}`,
    },
    {
      name: "Magnetic",
      slug: "magnetic",
      description: "Button that follows cursor on hover with spring physics",
      free: false,
      status: "new",
      code: `import { motion, useMotionValue, useSpring } from "motion/react";
import { cn } from "@/lib/utils";

export function ButtonMagnetic({ className, size = "md", children, ...props }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.15);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.15);
  };

  return (
    <motion.button
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-foreground font-medium text-background",
        size === "sm" && "h-9 px-4 text-sm",
        size === "md" && "h-11 px-6 text-sm",
        size === "lg" && "h-12 px-8 text-base",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}`,
    },
  ],
  card: [
    {
      name: "Default",
      slug: "default",
      description: "Clean, minimal card with shadow",
      free: true,
      status: "stable",
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
    },
    {
      name: "Glass",
      slug: "glass",
      description: "Frosted glass card with backdrop blur",
      free: true,
      status: "new",
      code: `import { cn } from "@/lib/utils";

export function GlassCard({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-lg",
        "shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)]",
        className
      )}
      {...props}
    />
  );
}`,
    },
    {
      name: "Spotlight",
      slug: "spotlight",
      description: "Card with radial gradient spotlight following mouse",
      free: false,
      status: "new",
      code: `"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function SpotlightCard({ className, ...props }) {
  const divRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={cn("relative overflow-hidden rounded-2xl border border-border bg-background p-6", className)}
      {...props}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          background: \`radial-gradient(600px circle at \${position.x}px \${position.y}px, rgba(0,112,243,0.15), transparent 40%)\`,
        }}
      />
      <div className="relative z-10">
        {/* content goes here */}
      </div>
    </div>
  );
}`,
    },
  ],
  input: [
    {
      name: "Default",
      slug: "default",
      description: "Clean, minimal input with border",
      free: true,
      status: "stable",
      code: `import { cn } from "@/lib/utils";

const Input = ({ className, type, ...props }) => (
  <input
    type={type}
    className={cn(
      "flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-base/6 placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
);`,
    },
    {
      name: "Floating",
      slug: "floating",
      description: "Input with floating label that animates on focus",
      free: true,
      status: "new",
      code: `"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function FloatingInput({ label, className, ...props }) {
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  return (
    <div className="relative">
      <input
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          setFocused(false);
          setHasValue(!!e.target.value);
        }}
        onChange={(e) => setHasValue(!!e.target.value)}
        className={cn(
          "peer h-12 w-full rounded-md border border-border bg-background px-3 pt-4 pb-1 text-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          className
        )}
        {...props}
      />
      <label
        className={cn(
          "absolute left-3 transition-all duration-200",
          focused || hasValue
            ? "top-1 text-xs text-accent"
            : "top-3 text-sm text-text-muted"
        )}
      >
        {label}
      </label>
    </div>
  );
}`,
    },
    {
      name: "Underline",
      slug: "underline",
      description: "Minimal underline-style input with animated border",
      free: false,
      status: "new",
      code: `"use client";

import { cn } from "@/lib/utils";

export function UnderlineInput({ className, ...props }) {
  return (
    <input
      className={cn(
        "w-full border-b-2 border-border bg-transparent px-0 py-3 text-sm",
        "transition-colors duration-200",
        "focus:border-accent focus:outline-none",
        "placeholder:text-text-muted",
        className
      )}
      {...props}
    />
  );
}`,
    },
  ],
  badge: [
    {
      name: "Default",
      slug: "default",
      description: "Clean, minimal badge with pill shape",
      free: true,
      status: "stable",
      code: `import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-pill border px-2.5 py-0.5 text-xs/4 font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-accent text-white",
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
    },
    {
      name: "Pill",
      slug: "pill",
      description: "Rounded pill badge with subtle gradient",
      free: true,
      status: "new",
      code: `import { cn } from "@/lib/utils";

export function PillBadge({ className, children, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-3 py-1 text-xs/4 font-medium",
        "bg-linear-to-r from-blue-500/10 to-purple-500/10 text-accent",
        "border border-accent/20",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}`,
    },
    {
      name: "Dot",
      slug: "dot",
      description: "Badge with animated dot indicator",
      free: false,
      status: "new",
      code: `"use client";

import { cn } from "@/lib/utils";

export function DotBadge({ className, dotClassName, children, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border border-border px-2.5 py-0.5 text-xs/4 font-medium",
        className
      )}
      {...props}
    >
      <span className={cn("relative flex size-2", dotClassName)}>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-success" />
      </span>
      {children}
    </span>
  );
}`,
    },
  ],
  "hero-section": [
    {
      name: "Default",
      slug: "default",
      description: "Clean hero with animated text reveal",
      free: true,
      status: "stable",
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
    },
    {
      name: "Gradient",
      slug: "gradient",
      description: "Hero with animated gradient background",
      free: true,
      status: "new",
      code: `"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function HeroGradient({ title, description, primaryAction, className }) {
  return (
    <section className={cn("relative overflow-hidden py-12", className)}>
      <div className="absolute inset-0 bg-linear-to-br from-accent/20 via-purple-600/20 to-pink-600/20" />
      <div className="relative mx-auto max-w-4xl text-center">
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-5xl/14 font-semibold tracking-[-2.88px] text-foreground"
        >
          {title}
        </motion.h1>
        {description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 text-base/6 text-text-secondary"
          >
            {description}
          </motion.p>
        )}
        {primaryAction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8"
          >
            {primaryAction}
          </motion.div>
        )}
      </div>
    </section>
  );
}`,
    },
    {
      name: "Parallax",
      slug: "parallax",
      description: "Hero with parallax scroll effects",
      free: false,
      status: "new",
      code: `"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export function HeroParallax({ title, description, primaryAction, className }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={ref} className={cn("relative min-h-[80vh] overflow-hidden", className)}>
      <motion.div style={{ y, opacity }} className="relative mx-auto max-w-4xl px-4 pt-12">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl/14 font-semibold tracking-[-2.88px] text-foreground"
        >
          {title}
        </motion.h1>
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-6 text-base/6 text-text-secondary"
          >
            {description}
          </motion.p>
        )}
        {primaryAction && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-8"
          >
            {primaryAction}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}`,
    },
  ],
};

const meta: Record<
  string,
  { name: string; description: string; category: string; variants: string[] }
> = {
  button: {
    name: "Button",
    description: "Flexible button component with multiple variants and sizes",
    category: "primitives",
    variants: ["Default", "Destructive", "Outline", "Secondary", "Ghost", "Link"],
  },
  card: {
    name: "Card",
    description:
      "Compound card component with header, content, and footer sections",
    category: "primitives",
    variants: ["Default", "Interactive", "Header Only"],
  },
  input: {
    name: "Input",
    description: "Form input components with label, error states, and textarea",
    category: "forms",
    variants: ["Text Input", "Password", "With Icon", "Textarea"],
  },
  badge: {
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
  },
  "hero-section": {
    name: "Hero Section",
    description: "Animated hero section with multiple layout variants",
    category: "marketing",
    variants: ["Centered", "Split", "Minimal"],
  },
};

const props: Record<string, PropDef[]> = {
  button: [
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
  card: [
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
  input: [
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
  badge: [
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
  "hero-section": [
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

const usage: Record<string, Record<string, string>> = {
  button: {
    default: `import { Button } from "@/components/ui/button";

export default function Example() {
  return (
    <div className="flex gap-3">
      <Button>Button</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
    </div>
  );
}`,
    gradient: `import { ButtonGradient } from "@/components/ui/button-gradient";

export default function Example() {
  return <ButtonGradient size="md">Get started</ButtonGradient>;
}`,
    magnetic: `import { ButtonMagnetic } from "@/components/ui/button-magnetic";

export default function Example() {
  return <ButtonMagnetic>Hover me</ButtonMagnetic>;
}`,
  },
  card: {
    default: `import {
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
    glass: `import { GlassCard } from "@/components/ui/glass-card";

export default function Example() {
  return (
    <GlassCard>
      <h3 className="font-semibold text-white">Frosted Glass</h3>
      <p className="text-white/80">Backdrop blur over a live gradient.</p>
    </GlassCard>
  );
}`,
    spotlight: `import { SpotlightCard } from "@/components/ui/spotlight-card";

export default function Example() {
  return (
    <SpotlightCard className="max-w-sm">
      <h3 className="font-semibold text-foreground">Spotlight Card</h3>
      <p className="text-text-muted">Move your cursor across the card.</p>
    </SpotlightCard>
  );
}`,
  },
  input: {
    default: `import { Input } from "@/components/ui/input";

export default function Example() {
  return <Input type="email" placeholder="you@example.com" />;
}`,
    floating: `import { FloatingInput } from "@/components/ui/floating-input";

export default function Example() {
  return <FloatingInput label="Email address" />;
}`,
    underline: `import { UnderlineInput } from "@/components/ui/underline-input";

export default function Example() {
  return <UnderlineInput placeholder="Search…" />;
}`,
  },
  badge: {
    default: `import { Badge } from "@/components/ui/badge";

export default function Example() {
  return (
    <div className="flex gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  );
}`,
    pill: `import { PillBadge } from "@/components/ui/pill-badge";

export default function Example() {
  return <PillBadge>New feature</PillBadge>;
}`,
    dot: `import { DotBadge } from "@/components/ui/dot-badge";

export default function Example() {
  return <DotBadge>Live</DotBadge>;
}`,
  },
  "hero-section": {
    default: `import { HeroSection } from "@/components/ui/hero-section";
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
    gradient: `import { HeroGradient } from "@/components/ui/hero-gradient";
import { Button } from "@/components/ui/button";

export default function Example() {
  return (
    <HeroGradient
      title="Launch in minutes."
      description="A hero with an animated gradient backdrop."
      primaryAction={<Button>Get started</Button>}
    />
  );
}`,
    parallax: `import { HeroParallax } from "@/components/ui/hero-parallax";
import { Button } from "@/components/ui/button";

export default function Example() {
  return (
    <HeroParallax
      title="Scroll to reveal."
      description="Parallax depth ties motion to scroll."
      primaryAction={<Button>Explore</Button>}
    />
  );
}`,
  },
};

/** Merged, slug-keyed registry the docs read from. */
export const components: Record<string, ComponentData> = Object.fromEntries(
  Object.entries(meta).map(([slug, m]) => [
    slug,
    {
      slug,
      name: m.name,
      description: m.description,
      category: m.category,
      variants: m.variants,
      props: props[slug] ?? [],
      styles: (styles[slug] ?? []).map((s) => ({
        ...s,
        usage: usage[slug]?.[s.slug] ?? s.code,
      })),
    },
  ]),
);

/* ─── CLI-facing registry (served by /api/registry → consumed by the CLI) ─── */

// Target filename per style — matches the import paths in the usage examples.
// Irregular (glass-card, not card-glass), so spelled out rather than derived.
const FILE_BY_STYLE: Record<string, Record<string, string>> = {
  button: {
    default: "button.tsx",
    gradient: "button-gradient.tsx",
    magnetic: "button-magnetic.tsx",
  },
  card: {
    default: "card.tsx",
    glass: "glass-card.tsx",
    spotlight: "spotlight-card.tsx",
  },
  input: {
    default: "input.tsx",
    floating: "floating-input.tsx",
    underline: "underline-input.tsx",
  },
  badge: {
    default: "badge.tsx",
    pill: "pill-badge.tsx",
    dot: "dot-badge.tsx",
  },
  "hero-section": {
    default: "hero-section.tsx",
    gradient: "hero-gradient.tsx",
    parallax: "hero-parallax.tsx",
  },
};

const UTIL_CODE = `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`;

/** npm dependencies a style needs, derived from what its source imports. */
export function dependenciesFor(code: string): string[] {
  const deps = ["clsx", "tailwind-merge"];
  if (code.includes("class-variance-authority")) deps.push("class-variance-authority");
  if (code.includes("motion/react")) deps.push("motion");
  return deps;
}

const fileFor = (slug: string, styleSlug: string) =>
  `components/ui/${FILE_BY_STYLE[slug]?.[styleSlug] ?? `${slug}-${styleSlug}.tsx`}`;

/** Index served at GET /api/registry. */
export function getRegistryIndex() {
  return {
    version: "0.1.0",
    components: Object.values(components).map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description,
      category: c.category,
      variantCount: c.variants.length,
      styles: c.styles.map((s) => ({
        slug: s.slug,
        name: s.name,
        free: s.free,
        status: s.status,
        dependencies: dependenciesFor(s.code),
      })),
    })),
  };
}

/** Full component served at GET /api/registry/[slug]; null when unknown. */
export function getRegistryComponent(slug: string) {
  const c = components[slug];
  if (!c) return null;

  const files: Record<string, string> = { "lib/utils.ts": UTIL_CODE };
  const styles = c.styles.map((s) => {
    const file = fileFor(slug, s.slug);
    files[file] = s.code;
    return {
      slug: s.slug,
      name: s.name,
      description: s.description,
      free: s.free,
      status: s.status,
      file,
      dependencies: dependenciesFor(s.code),
    };
  });

  return {
    slug: c.slug,
    name: c.name,
    description: c.description,
    category: c.category,
    variants: c.variants,
    props: c.props,
    styles,
    files,
  };
}
