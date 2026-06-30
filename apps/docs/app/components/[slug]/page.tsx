"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useSpring,
} from "motion/react";
import { CopyButton } from "../../../components/copy-button";
import { CodeBlock } from "../../../components/code-block";
import { ThemeToggle } from "../../../components/theme-provider";

const EASE = [0.16, 1, 0.3, 1] as const;

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Navbar() {
  return (
    <div className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 pt-4">
      <nav className="nav-pill flex h-12 w-full max-w-3xl items-center justify-between rounded-full px-4 bg-background/80 border border-border shadow-elevated">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-foreground tracking-tight"
        >
          <span className="flex size-6 items-center justify-center rounded-lg bg-foreground text-[11px] font-bold text-background">
            D
          </span>
          <span className="text-sm">Devigner</span>
        </Link>
        <div className="flex items-center gap-0.5">
          <Link
            href="/"
            className="rounded-full px-3 py-1.5 text-[13px] font-medium text-text-secondary hover:text-foreground transition-colors duration-200"
          >
            Home
          </Link>
          <Link
            href="/components"
            className="rounded-full px-3 py-1.5 text-[13px] font-medium text-text-secondary hover:text-foreground transition-colors duration-200"
          >
            Components
          </Link>
          <div className="mx-1.5 h-4 w-px bg-border" />
          <ThemeToggle />
        </div>
      </nav>
    </div>
  );
}

interface DesignStyle {
  name: string;
  slug: string;
  description: string;
  free: boolean;
  status: string;
  code: string;
}

const styles: Record<string, DesignStyle[]> = {
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

const componentMeta: Record<
  string,
  { name: string; description: string; category: string; variants: string[] }
> = {
  button: {
    name: "Button",
    description: "Flexible button component with multiple variants and sizes",
    category: "Primitives",
    variants: [
      "Default",
      "Destructive",
      "Outline",
      "Secondary",
      "Ghost",
      "Link",
    ],
  },
  card: {
    name: "Card",
    description:
      "Compound card component with header, content, and footer sections",
    category: "Primitives",
    variants: ["Default", "Interactive", "Header Only"],
  },
  input: {
    name: "Input",
    description: "Form input components with label, error states, and textarea",
    category: "Forms",
    variants: ["Text Input", "Password", "With Icon", "Textarea"],
  },
  badge: {
    name: "Badge",
    description: "Small label component for status, categories, and tags",
    category: "Primitives",
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
    category: "Marketing",
    variants: ["Centered", "Split", "Minimal"],
  },
};

/* ─── Live previews (one per style slug) ─── */

function BtnDefault() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button className="inline-flex h-10 items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-colors duration-200 hover:bg-foreground/90 active:scale-[0.98]">
        Button
      </button>
      <button className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface active:scale-[0.98]">
        Outline
      </button>
      <button className="inline-flex h-10 items-center justify-center rounded-lg bg-surface px-4 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface-hover active:scale-[0.98]">
        Secondary
      </button>
    </div>
  );
}

function BtnGradient() {
  return (
    <button className="group relative inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-size-[200%_auto] bg-left px-6 text-sm font-medium text-white shadow-lg shadow-purple-500/25 transition-all duration-300 hover:bg-right hover:shadow-xl hover:shadow-purple-500/30 active:scale-[0.98]">
      Get started
    </button>
  );
}

function BtnMagnetic() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });
  return (
    <motion.button
      style={{ x: springX, y: springY }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * 0.15);
        y.set((e.clientY - r.top - r.height / 2) * 0.15);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      whileTap={{ scale: 0.97 }}
      className="inline-flex h-11 items-center justify-center rounded-lg bg-foreground px-6 text-sm font-medium text-background"
    >
      Hover me
    </motion.button>
  );
}

function CardDefault() {
  return (
    <div className="w-full max-w-70 rounded-2xl border border-border bg-background shadow-card">
      <div className="flex flex-col space-y-1.5 p-6">
        <div className="text-lg font-semibold tracking-tight text-foreground">
          Project Atlas
        </div>
        <p className="text-[13px] leading-relaxed text-text-muted">
          Deployed to production two hours ago. All checks passing.
        </p>
      </div>
    </div>
  );
}

function CardGlass() {
  return (
    <div className="relative flex w-full max-w-70 items-center justify-center overflow-hidden rounded-2xl p-6">
      <div className="absolute inset-0 bg-linear-to-br from-blue-500/50 via-purple-500/40 to-pink-500/50" />
      <div className="relative rounded-2xl border border-white/20 bg-white/10 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-lg">
        <div className="text-[15px] font-semibold text-white">
          Frosted Glass
        </div>
        <p className="mt-1 text-xs text-white/80">
          Backdrop blur over a live gradient.
        </p>
      </div>
    </div>
  );
}

function CardSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        if (!ref.current) return;
        const r = ref.current.getBoundingClientRect();
        setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
      }}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className="relative w-full max-w-70 overflow-hidden rounded-2xl border border-border bg-background p-6"
    >
      <div
        className="pointer-events-none absolute -inset-px transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${pos.x}px ${pos.y}px, rgba(0,112,243,0.18), transparent 40%)`,
        }}
      />
      <div className="relative z-10">
        <div className="text-[15px] font-semibold text-foreground">
          Spotlight Card
        </div>
        <p className="mt-1 text-xs text-text-muted">
          Move your cursor across the card.
        </p>
      </div>
    </div>
  );
}

function InpDefault() {
  return (
    <input
      placeholder="you@example.com"
      className="flex h-10 w-full max-w-65 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    />
  );
}

function InpFloating() {
  const [focused, setFocused] = useState(false);
  const [val, setVal] = useState("");
  return (
    <div className="relative w-full max-w-65">
      <input
        value={val}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => setVal(e.target.value)}
        className="peer h-12 w-full rounded-md border border-border bg-background px-3 pt-4 pb-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
      <label
        className={`pointer-events-none absolute left-3 transition-all duration-200 ${
          focused || val
            ? "top-1 text-[11px] text-accent"
            : "top-3.5 text-sm text-text-muted"
        }`}
      >
        Email address
      </label>
    </div>
  );
}

function InpUnderline() {
  return (
    <input
      placeholder="Search…"
      className="w-full max-w-65 border-b-2 border-border bg-transparent px-0 py-3 text-sm text-foreground transition-colors duration-200 placeholder:text-text-muted focus:border-accent focus:outline-none"
    />
  );
}

function BadgeDefault() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-white">
        Default
      </span>
      <span className="inline-flex items-center rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-foreground">
        Secondary
      </span>
      <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-foreground">
        Outline
      </span>
    </div>
  );
}

function BadgePill() {
  return (
    <span className="inline-flex items-center rounded-full border border-accent/20 bg-linear-to-r from-blue-500/10 to-purple-500/10 px-3 py-1 text-xs font-medium text-accent">
      New feature
    </span>
  );
}

function BadgeDot() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-foreground">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-success" />
      </span>
      Live
    </span>
  );
}

function HeroDefault() {
  return (
    <div className="text-center">
      <div className="text-2xl/tight font-semibold tracking-tight text-foreground">
        Build faster.
      </div>
      <p className="mx-auto mt-2 max-w-65 text-[13px] leading-relaxed text-text-secondary">
        A clean hero with animated text reveal and a clear primary action.
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <button className="h-9 rounded-lg bg-foreground px-4 text-[13px] font-medium text-background active:scale-[0.98]">
          Get started
        </button>
        <button className="h-9 rounded-lg border border-border px-4 text-[13px] font-medium text-foreground active:scale-[0.98]">
          Learn more
        </button>
      </div>
    </div>
  );
}

function HeroGradient() {
  return (
    <div className="relative w-full overflow-hidden rounded-xl p-7 text-center">
      <div className="absolute inset-0 bg-linear-to-br from-accent/20 via-purple-600/20 to-pink-600/20" />
      <div className="relative">
        <div className="text-2xl font-semibold tracking-tight text-foreground">
          Launch in minutes.
        </div>
        <p className="mx-auto mt-2 max-w-65 text-[13px] leading-relaxed text-text-secondary">
          A hero with an animated gradient backdrop.
        </p>
        <button className="mt-4 h-9 rounded-lg bg-foreground px-4 text-[13px] font-medium text-background active:scale-[0.98]">
          Get started
        </button>
      </div>
    </div>
  );
}

function HeroParallax() {
  return (
    <div className="text-center">
      <div className="text-2xl font-semibold tracking-tight text-foreground">
        Scroll to reveal.
      </div>
      <p className="mx-auto mt-2 max-w-65 text-[13px] leading-relaxed text-text-secondary">
        Parallax depth ties motion to scroll. The full effect runs on the live
        page.
      </p>
      <button className="mt-4 h-9 rounded-lg bg-foreground px-4 text-[13px] font-medium text-background active:scale-[0.98]">
        Explore
      </button>
    </div>
  );
}

const previews: Record<string, Record<string, React.ReactNode>> = {
  button: {
    default: <BtnDefault />,
    gradient: <BtnGradient />,
    magnetic: <BtnMagnetic />,
  },
  card: {
    default: <CardDefault />,
    glass: <CardGlass />,
    spotlight: <CardSpotlight />,
  },
  input: {
    default: <InpDefault />,
    floating: <InpFloating />,
    underline: <InpUnderline />,
  },
  badge: { default: <BadgeDefault />, pill: <BadgePill />, dot: <BadgeDot /> },
  "hero-section": {
    default: <HeroDefault />,
    gradient: <HeroGradient />,
    parallax: <HeroParallax />,
  },
};

const propsData: Record<
  string,
  { name: string; type: string; default: string; description: string }[]
> = {
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

/* ─── Example usage (shown in the Code tab) ─── */
const usageData: Record<string, Record<string, string>> = {
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

const UTIL_CODE = `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`;

/** npm install line for the manual install, derived from what the source imports. */
function depsFor(code: string) {
  const pkgs = ["clsx", "tailwind-merge"];
  if (code.includes("class-variance-authority"))
    pkgs.push("class-variance-authority");
  if (code.includes("motion/react")) pkgs.push("motion");
  return `npm i ${pkgs.join(" ")}`;
}

export default function ComponentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <ComponentPageInner params={params} />;
}

function ComponentPageInner({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>("");
  const [activeStyle, setActiveStyle] = useState(0);
  const [view, setView] = useState<"preview" | "code">("preview");
  const [installTab, setInstallTab] = useState<"cli" | "manual">("cli");
  const [activeSection, setActiveSection] = useState("preview");

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  // Scroll-spy for the "On this page" rail
  useEffect(() => {
    const ids = ["preview", "installation", "props"];
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) setActiveSection(e.target.id);
      },
      { rootMargin: "-25% 0px -65% 0px" },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [slug, view]);

  const componentStyles = styles[slug] || [];
  const meta = componentMeta[slug];
  const currentStyle = componentStyles[activeStyle];

  // Left-nav: components grouped by category
  const navGroups = Object.entries(componentMeta).reduce<
    Record<string, { slug: string; name: string }[]>
  >((acc, [s, m]) => {
    (acc[m.category] ??= []).push({ slug: s, name: m.name });
    return acc;
  }, {});

  if (!meta || !currentStyle) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="grain-overlay" />
        <div className="flex items-center gap-2.5 text-text-muted">
          <span className="size-4 animate-spin rounded-full border-2 border-border border-t-accent" />
          <p className="text-sm">Loading component…</p>
        </div>
      </div>
    );
  }

  const preview = previews[slug]?.[currentStyle.slug];
  const props = propsData[slug] ?? [];
  const usage = usageData[slug]?.[currentStyle.slug] ?? currentStyle.code;
  const deps = depsFor(currentStyle.code);
  const installCmd = `npx devignerui add ${slug} --style ${currentStyle.slug}`;
  const toc = [
    { id: "preview", label: "Preview" },
    { id: "installation", label: "Installation" },
    { id: "props", label: "Props" },
  ];

  return (
    <div className="min-h-dvh bg-background">
      <div className="grain-overlay" />
      <Navbar />

      <div className="mx-auto max-w-352 px-5 pt-28 pb-20 sm:pt-32">
        <div className="grid gap-10 lg:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)_180px]">
          {/* ─── Left: component nav ─── */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-6">
              {Object.entries(navGroups).map(([category, items]) => (
                <div key={category}>
                  <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                    {category}
                  </p>
                  <ul className="space-y-0.5">
                    {items.map((item) => {
                      const active = item.slug === slug;
                      return (
                        <li key={item.slug}>
                          <Link
                            href={`/components/${item.slug}`}
                            className={`block rounded-lg px-2 py-1.5 text-[13px] transition-colors duration-150 ${
                              active
                                ? "bg-surface-hover font-medium text-foreground"
                                : "text-text-secondary hover:text-foreground"
                            }`}
                          >
                            {item.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </aside>

          {/* ─── Center: content ─── */}
          <main className="min-w-0">
            <Reveal>
              <div className="flex items-center gap-2 text-[13px] text-text-muted">
                <Link
                  href="/components"
                  className="transition-colors duration-200 hover:text-foreground"
                >
                  Components
                </Link>
                <span className="text-border">/</span>
                <span className="text-foreground">{meta.name}</span>
              </div>
              <h1 className="mt-4 text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground">
                {meta.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-surface px-2 py-0.5 text-[11px] font-medium lowercase text-text-secondary">
                  {meta.category}
                </span>
                <span className="inline-flex items-center rounded-md bg-surface px-2 py-0.5 text-[11px] font-medium lowercase text-text-secondary">
                  {currentStyle.status === "new" ? "new" : "stable"}
                </span>
              </div>
              <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-text-secondary">
                {meta.description}
              </p>
            </Reveal>

            {/* Design-style switcher */}
            {componentStyles.length > 1 && (
              <div className="mt-6 flex flex-wrap items-center gap-1.5">
                {componentStyles.map((style, i) => {
                  const active = i === activeStyle;
                  return (
                    <button
                      key={style.slug}
                      onClick={() => setActiveStyle(i)}
                      aria-pressed={active}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-200 ${
                        active
                          ? "border-accent/40 bg-accent/10 text-accent"
                          : "border-border text-text-secondary hover:text-foreground"
                      }`}
                    >
                      {style.name}
                      {!style.free && (
                        <span className="rounded-full bg-accent/15 px-1.5 text-[9px] font-semibold text-accent">
                          Pro
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Preview / Code */}
            <div id="preview" className="mt-6 scroll-mt-28">
              <div className="overflow-hidden rounded-2xl border border-border bg-background-200">
                <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
                  <div className="flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5">
                    {(["preview", "code"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setView(tab)}
                        className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-all duration-200 ${
                          view === tab
                            ? "bg-surface text-foreground shadow-subtle"
                            : "text-text-muted hover:text-foreground"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  {view === "code" ? (
                    <div className="flex items-center gap-2">
                      <span className="hidden font-mono text-[11px] text-text-muted sm:inline">
                        {slug}-demo.tsx
                      </span>
                      <CopyButton
                        code={usage}
                        componentName={`${slug}-${currentStyle.slug}-demo`}
                      />
                    </div>
                  ) : (
                    <span className="font-mono text-[11px] text-text-muted">
                      @devignerui/{slug}-{currentStyle.slug}
                    </span>
                  )}
                </div>

                {view === "preview" ? (
                  <div
                    className="flex min-h-80 items-center justify-center p-6 sm:min-h-105 sm:p-12"
                    style={{
                      backgroundImage:
                        "radial-gradient(var(--border) 1px, transparent 1px)",
                      backgroundSize: "22px 22px",
                    }}
                  >
                    {preview ?? (
                      <p className="text-[13px] text-text-muted">
                        Preview coming soon for this style.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="code-scroll max-h-130 overflow-y-auto bg-(--code-bg)">
                    <CodeBlock code={usage} lang="tsx" />
                  </div>
                )}
              </div>
            </div>

            {/* Installation */}
            <section id="installation" className="mt-14 scroll-mt-28">
              <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground">
                Installation
              </h2>

              <div className="mt-4 inline-flex items-center gap-0.5 rounded-lg border border-border bg-background-200 p-0.5">
                {(["cli", "manual"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setInstallTab(tab)}
                    className={`rounded-md px-3 py-1 text-xs font-medium uppercase tracking-wide transition-all duration-200 ${
                      installTab === tab
                        ? "bg-background text-foreground shadow-subtle"
                        : "text-text-muted hover:text-foreground"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {installTab === "cli" ? (
                <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-border bg-background-200 px-4 py-3 font-mono text-[13px] text-text-secondary">
                  <span className="truncate">
                    <span className="text-text-muted">$</span> {installCmd}
                  </span>
                  <CopyButton
                    code={installCmd}
                    componentName={`install-${slug}-${currentStyle.slug}`}
                  />
                </div>
              ) : (
                <div className="mt-6 space-y-8">
                  {/* 1 · dependencies */}
                  <div className="relative border-l border-border pl-6">
                    <span className="absolute -left-0.75 top-1 h-4 w-1.5 rounded-full bg-text-muted/60" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Install dependencies
                    </h3>
                    <div className="relative mt-3 overflow-hidden rounded-xl border border-border bg-background-200">
                      <div className="absolute right-2 top-2 z-10">
                        <CopyButton
                          code={deps}
                          componentName={`deps-${slug}`}
                        />
                      </div>
                      <CodeBlock code={deps} lang="bash" numbered />
                    </div>
                  </div>

                  {/* 2 · util file */}
                  <div className="relative border-l border-border pl-6">
                    <span className="absolute -left-0.75 top-1 h-4 w-1.5 rounded-full bg-text-muted/60" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Add util file
                    </h3>
                    <div className="mt-3 inline-flex rounded-lg border border-border bg-background-200 px-3 py-1 font-mono text-xs text-text-secondary">
                      lib/utils.ts
                    </div>
                    <div className="relative mt-2 overflow-hidden rounded-xl border border-border bg-background-200">
                      <div className="absolute right-2 top-2 z-10">
                        <CopyButton code={UTIL_CODE} componentName="util-cn" />
                      </div>
                      <CodeBlock code={UTIL_CODE} lang="ts" numbered />
                    </div>
                  </div>

                  {/* 3 · source code */}
                  <div className="relative border-l border-border pl-6">
                    <span className="absolute -left-0.75 top-1 h-4 w-1.5 rounded-full bg-text-muted/60" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Copy the source code
                    </h3>
                    <div className="mt-3 inline-flex rounded-lg border border-border bg-background-200 px-3 py-1 font-mono text-xs text-text-secondary">
                      components/ui/{slug}-{currentStyle.slug}.tsx
                    </div>
                    <div className="relative mt-2 overflow-hidden rounded-xl border border-border bg-background-200">
                      <div className="absolute right-2 top-2 z-10">
                        <CopyButton
                          code={currentStyle.code}
                          componentName={`src-${slug}-${currentStyle.slug}`}
                        />
                      </div>
                      <CodeBlock
                        code={currentStyle.code}
                        lang="tsx"
                        numbered
                        expandable
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Props */}
            <section id="props" className="mt-14 scroll-mt-28">
              <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground">
                Props
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                Props for the{" "}
                <span className="font-mono text-[13px] text-foreground">
                  {meta.name.replace(/\s+/g, "")}
                </span>{" "}
                component.
              </p>
              <div className="mt-4 overflow-hidden rounded-xl border border-border">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-background-200">
                      <th className="px-4 py-2.5 font-medium text-text-muted">
                        Prop
                      </th>
                      <th className="px-4 py-2.5 font-medium text-text-muted">
                        Type
                      </th>
                      <th className="hidden px-4 py-2.5 font-medium text-text-muted sm:table-cell">
                        Default
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {props.map((p) => (
                      <tr
                        key={p.name}
                        className="border-b border-border align-top last:border-0"
                      >
                        <td className="px-4 py-3">
                          <div className="font-mono text-xs font-medium text-foreground">
                            {p.name}
                          </div>
                          <div className="mt-1 text-xs/relaxed text-text-muted">
                            {p.description}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-accent">
                          {p.type}
                        </td>
                        <td className="hidden px-4 py-3 font-mono text-xs text-text-muted sm:table-cell">
                          {p.default}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </main>

          {/* ─── Right: on this page ─── */}
          <aside className="hidden xl:block">
            <div className="sticky top-28">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                On this page
              </p>
              <ul className="space-y-1 border-l border-border">
                {toc.map((item) => {
                  const active = activeSection === item.id;
                  return (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className={`-ml-px block border-l-2 pl-3 text-[13px] transition-colors duration-150 ${
                          active
                            ? "border-accent font-medium text-foreground"
                            : "border-transparent text-text-muted hover:text-foreground"
                        }`}
                      >
                        {item.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded-md bg-foreground text-[10px] font-bold text-background">
              D
            </span>
            <span className="text-[13px] text-text-muted">
              &copy; 2026 Devigner UI
            </span>
          </div>
          <div className="flex items-center gap-5">
            <a
              href="https://twitter.com/devignerui"
              className="text-[13px] text-text-muted hover:text-foreground transition-colors duration-200"
            >
              Twitter
            </a>
            <a
              href="https://github.com/devignerui/devignerui"
              className="text-[13px] text-text-muted hover:text-foreground transition-colors duration-200"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
