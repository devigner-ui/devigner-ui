"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { CopyButton } from "../../../components/copy-button";
import { ThemeToggle } from "../../../components/theme-provider";

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
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-[14px] font-medium leading-[20px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50",
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
        sm: "h-9 rounded-lg px-[12px] py-[6px]",
        md: "h-10 rounded-lg px-[16px] py-[8px]",
        lg: "h-11 rounded-lg px-[32px] py-[10px]",
        icon: "h-10 w-10 rounded-lg",
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
        "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-[length:200%_auto] bg-left hover:bg-right",
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
    <div className={cn("rounded-[16px] border border-border bg-background shadow-card", className)} {...props} />
  );
}

function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col space-y-[6px] p-[24px]", className)} {...props} />;
}

function CardTitle({ className, ...props }) {
  return <div className={cn("text-[24px] font-semibold leading-[32px] tracking-[-0.96px] text-foreground", className)} {...props} />;
}

function CardContent({ className, ...props }) {
  return <div className={cn("p-[24px] pt-0", className)} {...props} />;
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
        "rounded-[16px] border border-white/20 bg-white/10 p-[24px] backdrop-blur-lg",
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
      className={cn("relative overflow-hidden rounded-[16px] border border-border bg-background p-[24px]", className)}
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
      "flex h-10 w-full rounded-[6px] border border-border bg-background px-[12px] py-[8px] text-[16px] leading-[24px] placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50",
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
          "peer h-12 w-full rounded-[6px] border border-border bg-background px-[12px] pt-4 pb-1 text-[14px]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          className
        )}
        {...props}
      />
      <label
        className={cn(
          "absolute left-[12px] transition-all duration-200",
          focused || hasValue
            ? "top-1 text-[12px] text-accent"
            : "top-3 text-[14px] text-text-muted"
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
        "w-full border-b-2 border-border bg-transparent px-0 py-3 text-[14px]",
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
  "inline-flex items-center rounded-[9999px] border px-[10px] py-[2px] text-[12px] font-medium leading-[16px] transition-colors",
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
        "inline-flex items-center rounded-[9999px] px-[12px] py-[4px] text-[12px] font-medium leading-[16px]",
        "bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-accent",
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
        "inline-flex items-center gap-[6px] rounded-[9999px] border border-border px-[10px] py-[2px] text-[12px] font-medium leading-[16px]",
        className
      )}
      {...props}
    >
      <span className={cn("relative flex h-2 w-2", dotClassName)}>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
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
    <section className={cn("flex flex-col items-center justify-center py-[48px] text-center", className)}>
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-[48px] font-semibold leading-[56px] tracking-[-2.88px] text-foreground"
      >
        {title}
      </motion.h1>
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-[24px] max-w-2xl text-[16px] leading-[24px] text-text-secondary"
        >
          {description}
        </motion.p>
      )}
      {(primaryAction || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-[32px] flex gap-[16px]"
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
    <section className={cn("relative overflow-hidden py-[48px]", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-purple-600/20 to-pink-600/20" />
      <div className="relative mx-auto max-w-4xl text-center">
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-[48px] font-semibold leading-[56px] tracking-[-2.88px] text-foreground"
        >
          {title}
        </motion.h1>
        {description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-[24px] text-[16px] leading-[24px] text-text-secondary"
          >
            {description}
          </motion.p>
        )}
        {primaryAction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-[32px]"
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
      <motion.div style={{ y, opacity }} className="relative mx-auto max-w-4xl px-[16px] pt-[48px]">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-[48px] font-semibold leading-[56px] tracking-[-2.88px] text-foreground"
        >
          {title}
        </motion.h1>
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-[24px] text-[16px] leading-[24px] text-text-secondary"
          >
            {description}
          </motion.p>
        )}
        {primaryAction && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-[32px]"
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

const componentMeta: Record<string, { name: string; description: string; category: string; variants: string[] }> = {
  button: {
    name: "Button",
    description: "Flexible button component with multiple variants and sizes",
    category: "Primitives",
    variants: ["Default", "Destructive", "Outline", "Secondary", "Ghost", "Link"],
  },
  card: {
    name: "Card",
    description: "Compound card component with header, content, and footer sections",
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
    variants: ["Default", "Secondary", "Outline", "Destructive", "Success", "Warning"],
  },
  "hero-section": {
    name: "Hero Section",
    description: "Animated hero section with multiple layout variants",
    category: "Marketing",
    variants: ["Centered", "Split", "Minimal"],
  },
};

export default function ComponentPage({ params }: { params: Promise<{ slug: string }> }) {
  return <ComponentPageInner params={params} />;
}

function ComponentPageInner({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>("");
  const [activeStyle, setActiveStyle] = useState(0);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  const componentStyles = styles[slug] || [];
  const meta = componentMeta[slug];
  const currentStyle = componentStyles[activeStyle];

  if (!meta || !currentStyle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-[16px] leading-[24px] text-text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-[50px] max-w-6xl items-center justify-between px-[16px]">
          <Link href="/" className="text-[24px] font-semibold leading-[32px] tracking-[-0.96px] text-foreground">
            Devigner UI
          </Link>
          <div className="flex items-center gap-[24px]">
            <Link href="/" className="text-[14px] font-medium leading-[20px] text-text-secondary hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/components" className="text-[14px] font-medium leading-[20px] text-text-secondary hover:text-foreground transition-colors">
              Components
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-[16px] py-[48px]">
        {/* Header */}
        <div className="mb-[32px]">
          <h1 className="text-[32px] font-semibold leading-[48px] tracking-[-1.28px] text-foreground">{meta.name}</h1>
          <p className="mt-[8px] text-[16px] leading-[24px] text-text-secondary">{meta.description}</p>
          <div className="mt-[16px] flex items-center gap-[16px] text-[14px] leading-[21px] text-text-muted">
            <span>{meta.category}</span>
            <span>&middot;</span>
            <span>{componentStyles.length} styles</span>
            <span>&middot;</span>
            <span>{meta.variants.length} variants per style</span>
          </div>
        </div>

        {/* Design Style Switcher */}
        <div className="mb-[32px]">
          <h2 className="mb-[16px] text-[24px] font-semibold leading-[32px] tracking-[-0.96px] text-foreground">Design Style</h2>
          <div className="flex flex-wrap gap-[12px]">
            {componentStyles.map((style, i) => (
              <button
                key={style.slug}
                onClick={() => setActiveStyle(i)}
                className={`flex items-center gap-[12px] rounded-[16px] border p-[24px] text-left transition-all ${
                  i === activeStyle
                    ? "border-accent bg-accent/5 shadow-[0px_0px_0px_1px_rgba(0,112,243,0.15)]"
                    : "border-border hover:border-border-hover hover:bg-surface"
                }`}
              >
                <div>
                  <div className="flex items-center gap-[8px]">
                    <span className="text-[14px] font-medium leading-[20px] text-foreground">{style.name}</span>
                    {style.free ? (
                      <span className="rounded-[9999px] bg-success/10 px-[8px] py-[2px] text-[12px] font-medium leading-[16px] text-success">
                        Free
                      </span>
                    ) : (
                      <span className="rounded-[9999px] bg-accent/10 px-[8px] py-[2px] text-[12px] font-medium leading-[16px] text-accent">
                        Pro
                      </span>
                    )}
                    {style.status === "new" && (
                      <span className="rounded-[9999px] bg-accent/10 px-[8px] py-[2px] text-[12px] font-medium leading-[16px] text-accent">
                        New
                      </span>
                    )}
                  </div>
                  <p className="mt-[4px] text-[12px] leading-[16px] text-text-muted">{style.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Current Style Info */}
        <div className="mb-[32px] rounded-[16px] border border-border bg-surface p-[24px]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[24px] font-semibold leading-[32px] tracking-[-0.96px] text-foreground">{currentStyle.name} Style</h3>
              <p className="mt-[4px] text-[14px] leading-[21px] text-text-secondary">{currentStyle.description}</p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center rounded-[9999px] px-[10px] py-[2px] text-[12px] font-medium leading-[16px] ${
                currentStyle.free
                  ? "bg-success/10 text-success"
                  : "bg-accent/10 text-accent"
              }`}>
                {currentStyle.free ? "Free" : "Pro"}
              </span>
            </div>
          </div>
        </div>

        {/* Install */}
        <div className="mb-[32px]">
          <h2 className="mb-[16px] text-[24px] font-semibold leading-[32px] tracking-[-0.96px] text-foreground">Installation</h2>
          <div className="overflow-hidden rounded-[16px] border border-border bg-surface">
            <div className="flex items-center gap-[8px] border-b border-border px-[16px] py-[12px]">
              <div className="h-[12px] w-[12px] rounded-full bg-red-400" />
              <div className="h-[12px] w-[12px] rounded-full bg-yellow-400" />
              <div className="h-[12px] w-[12px] rounded-full bg-green-400" />
            </div>
            <pre className="overflow-x-auto p-[24px] font-mono text-[13px] leading-[20px]">
              <code>
                <span className="text-green-500">$</span> npx devignerui add {slug} --style {currentStyle.slug}
              </code>
            </pre>
          </div>
        </div>

        {/* Variants */}
        <div className="mb-[32px]">
          <h2 className="mb-[16px] text-[24px] font-semibold leading-[32px] tracking-[-0.96px] text-foreground">Variants</h2>
          <div className="flex flex-wrap gap-[8px]">
            {meta.variants.map((v) => (
              <span key={v} className="inline-flex items-center rounded-[6px] border border-border px-[12px] py-[6px] text-[14px] leading-[20px] text-foreground">
                {v}
              </span>
            ))}
          </div>
        </div>

        {/* Code */}
        <div className="mb-[32px]">
          <div className="flex items-center justify-between mb-[16px]">
            <h2 className="text-[24px] font-semibold leading-[32px] tracking-[-0.96px] text-foreground">Code</h2>
            <span className="text-[14px] leading-[21px] text-text-muted">
              {currentStyle.name} Style
            </span>
          </div>
          <div className="overflow-hidden rounded-[16px] border border-border">
            <div className="flex items-center justify-between border-b border-border bg-surface px-[16px] py-[8px]">
              <span className="text-[12px] leading-[16px] text-text-muted">
                {slug}-{currentStyle.slug}.tsx
              </span>
              <CopyButton code={currentStyle.code} componentName={`${slug}-${currentStyle.slug}`} />
            </div>
            <pre className="overflow-x-auto p-[24px] font-mono text-[13px] leading-[20px] max-h-[600px] overflow-y-auto">
              <code>{currentStyle.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
