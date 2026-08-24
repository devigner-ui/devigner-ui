// GENERATED FILE — do not edit by hand.
// Source of truth: apps/docs/registry/<slug>/{code.tsx,usage.tsx,meta.mjs}
// Regenerate with: pnpm --filter @devignerui/docs generate:registry

import type { ComponentData, CategoryData } from "./registry";

export const components: Record<string, ComponentData> = {
  "badge": {
    "slug": "badge",
    "name": "Badge",
    "kind": "component",
    "description": "Small label component for status, categories, and tags",
    "category": "badges",
    "variants": [
      "Default",
      "Secondary",
      "Outline",
      "Destructive",
      "Success",
      "Warning"
    ],
    "props": [
      {
        "name": "variant",
        "type": "\"default\" | \"secondary\" | \"outline\"",
        "default": "\"default\"",
        "description": "Color treatment of the badge."
      },
      {
        "name": "className",
        "type": "string",
        "default": "—",
        "description": "Additional classes merged via cn()."
      },
      {
        "name": "children",
        "type": "ReactNode",
        "default": "—",
        "description": "Badge label."
      }
    ],
    "code": "import { cva, type VariantProps } from \"class-variance-authority\";\nimport { type HTMLAttributes } from \"react\";\nimport { cn } from \"@/lib/utils\";\n\nconst badgeVariants = cva(\n  \"inline-flex items-center rounded-pill border px-2.5 py-0.5 text-xs/4 font-medium transition-colors\",\n  {\n    variants: {\n      variant: {\n        default: \"border-transparent bg-accent text-accent-foreground\",\n        secondary: \"border-transparent bg-surface text-foreground\",\n        outline: \"border-border text-foreground\",\n      },\n    },\n    defaultVariants: { variant: \"default\" },\n  }\n);\n\nexport interface BadgeProps\n  extends HTMLAttributes<HTMLDivElement>,\n    VariantProps<typeof badgeVariants> {}\n\nexport function Badge({ className, variant, ...props }: BadgeProps) {\n  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;\n}",
    "usage": "import { Badge } from \"@/components/ui/badge\";\n\nexport default function Example() {\n  return (\n    <div className=\"flex gap-2\">\n      <Badge>Default</Badge>\n      <Badge variant=\"secondary\">Secondary</Badge>\n      <Badge variant=\"outline\">Outline</Badge>\n    </div>\n  );\n}"
  },
  "button": {
    "slug": "button",
    "name": "Button",
    "kind": "component",
    "description": "Flexible button component with multiple variants and sizes",
    "category": "buttons",
    "variants": [
      "Default",
      "Destructive",
      "Outline",
      "Secondary",
      "Ghost",
      "Link"
    ],
    "props": [
      {
        "name": "variant",
        "type": "\"default\" | \"destructive\" | \"outline\" | \"secondary\" | \"ghost\" | \"link\"",
        "default": "\"default\"",
        "description": "Visual style of the button."
      },
      {
        "name": "size",
        "type": "\"sm\" | \"md\" | \"lg\" | \"icon\"",
        "default": "\"md\"",
        "description": "Controls height and padding."
      },
      {
        "name": "pressScale",
        "type": "number",
        "default": "0.96",
        "description": "Scale applied on press."
      },
      {
        "name": "ripple",
        "type": "boolean",
        "default": "false",
        "description": "Spawn a Material-style ripple from the press point."
      },
      {
        "name": "className",
        "type": "string",
        "default": "—",
        "description": "Additional classes merged via cn()."
      },
      {
        "name": "children",
        "type": "ReactNode",
        "default": "—",
        "description": "Button label or content."
      }
    ],
    "code": "\"use client\";\n\nimport {\n  useCallback,\n  useRef,\n  useState,\n  forwardRef,\n  type PointerEvent as ReactPointerEvent,\n  type ReactNode,\n} from \"react\";\nimport { cva, type VariantProps } from \"class-variance-authority\";\nimport { AnimatePresence, motion, useReducedMotion, type HTMLMotionProps } from \"motion/react\";\nimport { cn } from \"@/lib/utils\";\n\nconst buttonVariants = cva(\n  \"inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer rounded-lg text-sm/5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50\",\n  {\n    variants: {\n      variant: {\n        default: \"bg-primary text-primary-foreground hover:bg-primary/90\",\n        destructive: \"bg-destructive text-destructive-foreground hover:bg-destructive/90\",\n        outline: \"border border-border bg-background hover:bg-surface\",\n        secondary: \"bg-surface text-foreground hover:bg-surface-hover\",\n        ghost: \"hover:bg-surface hover:text-foreground\",\n        link: \"text-accent underline-offset-4 hover:underline\",\n      },\n      size: {\n        sm: \"h-9 rounded-lg px-3 py-1.5\",\n        md: \"h-10 rounded-lg px-4 py-2\",\n        lg: \"h-11 rounded-lg px-8 py-2.5\",\n        icon: \"size-10 rounded-lg\",\n      },\n    },\n    defaultVariants: { variant: \"default\", size: \"md\" },\n  }\n);\n\nfunction useHoverCapable() {\n  const [canHover, setCanHover] = useState(true);\n  useState(() => {\n    if (typeof window !== \"undefined\") {\n      setCanHover(window.matchMedia(\"(hover: hover) and (pointer: fine)\").matches);\n    }\n  });\n  return canHover;\n}\n\nexport interface ButtonProps\n  extends Omit<HTMLMotionProps<\"button\">, \"children\">,\n    VariantProps<typeof buttonVariants> {\n  pressScale?: number;\n  ripple?: boolean;\n  children?: ReactNode;\n}\n\nexport const Button = forwardRef<HTMLButtonElement, ButtonProps>(\n  ({ className, variant, size, pressScale = 0.96, ripple = false, onPointerDown, children, ...props }, ref) => {\n    const reduce = useReducedMotion();\n    const canHover = useHoverCapable();\n    const [ripples, setRipples] = useState<{ id: number; x: number; y: number; size: number }[]>([]);\n    const nextId = useRef(0);\n\n    const handlePointerDown = useCallback(\n      (event: ReactPointerEvent<HTMLButtonElement>) => {\n        if (ripple && !reduce) {\n          const rect = event.currentTarget.getBoundingClientRect();\n          const size = Math.max(rect.width, rect.height) * 2;\n          setRipples((prev) => [\n            ...prev,\n            { id: nextId.current++, x: event.clientX - rect.left, y: event.clientY - rect.top, size },\n          ]);\n        }\n        onPointerDown?.(event);\n      },\n      [ripple, reduce, onPointerDown]\n    );\n\n    return (\n      <motion.button\n        ref={ref}\n        whileTap={reduce ? undefined : { scale: pressScale }}\n        whileHover={reduce || !canHover ? undefined : { scale: 1.02 }}\n        transition={{ type: \"spring\", stiffness: 500, damping: 30, mass: 0.6 }}\n        onPointerDown={handlePointerDown}\n        className={cn(buttonVariants({ variant, size }), ripple && \"relative overflow-hidden\", className)}\n        {...props}\n      >\n        {ripple && !reduce ? (\n          <span className=\"pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]\">\n            <AnimatePresence>\n              {ripples.map((r) => (\n                <motion.span\n                  key={r.id}\n                  className=\"absolute rounded-full bg-current\"\n                  style={{ left: r.x, top: r.y, width: r.size, height: r.size, x: \"-50%\", y: \"-50%\" }}\n                  initial={{ scale: 0, opacity: 0.3 }}\n                  animate={{ scale: 1, opacity: 0 }}\n                  exit={{ opacity: 0 }}\n                  transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}\n                  onAnimationComplete={() => setRipples((prev) => prev.filter((x) => x.id !== r.id))}\n                />\n              ))}\n            </AnimatePresence>\n          </span>\n        ) : null}\n        {children}\n      </motion.button>\n    );\n  }\n);\nButton.displayName = \"Button\";",
    "usage": "import { Button } from \"@/components/ui/button\";\n\nexport default function Example() {\n  return (\n    <div className=\"flex gap-3\">\n      <Button>Button</Button>\n      <Button variant=\"outline\">Outline</Button>\n      <Button variant=\"secondary\">Secondary</Button>\n    </div>\n  );\n}"
  },
  "card": {
    "slug": "card",
    "name": "Card",
    "kind": "component",
    "description": "Compound card component with header, content, and footer sections",
    "category": "cards",
    "variants": [
      "Default",
      "Interactive",
      "Header Only"
    ],
    "props": [
      {
        "name": "className",
        "type": "string",
        "default": "—",
        "description": "Extra classes for the card container."
      },
      {
        "name": "children",
        "type": "ReactNode",
        "default": "—",
        "description": "Card sections — header, content, footer."
      }
    ],
    "code": "import { type HTMLAttributes } from \"react\";\nimport { cn } from \"@/lib/utils\";\n\nexport function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {\n  return (\n    <div className={cn(\"rounded-2xl border border-border bg-background shadow-card\", className)} {...props} />\n  );\n}\n\nexport function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {\n  return <div className={cn(\"flex flex-col space-y-1.5 p-6\", className)} {...props} />;\n}\n\nexport function CardTitle({ className, ...props }: HTMLAttributes<HTMLDivElement>) {\n  return <div className={cn(\"text-2xl/8 font-semibold tracking-[-0.96px] text-foreground\", className)} {...props} />;\n}\n\nexport function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {\n  return <div className={cn(\"p-6 pt-0\", className)} {...props} />;\n}",
    "usage": "import {\n  Card,\n  CardHeader,\n  CardTitle,\n  CardContent,\n} from \"@/components/ui/card\";\n\nexport default function Example() {\n  return (\n    <Card className=\"max-w-sm\">\n      <CardHeader>\n        <CardTitle>Project Atlas</CardTitle>\n      </CardHeader>\n      <CardContent>Deployed to production two hours ago.</CardContent>\n    </Card>\n  );\n}"
  },
  "hero-section": {
    "slug": "hero-section",
    "name": "Hero Section",
    "kind": "block",
    "description": "Animated hero section with multiple layout variants",
    "category": "heroes",
    "access": "pro",
    "variants": [
      "Centered",
      "Split",
      "Minimal"
    ],
    "props": [
      {
        "name": "title",
        "type": "string",
        "default": "—",
        "description": "Main headline text."
      },
      {
        "name": "description",
        "type": "string",
        "default": "—",
        "description": "Supporting paragraph below the title."
      },
      {
        "name": "primaryAction",
        "type": "ReactNode",
        "default": "—",
        "description": "Primary call-to-action element."
      },
      {
        "name": "secondaryAction",
        "type": "ReactNode",
        "default": "—",
        "description": "Secondary call-to-action element."
      },
      {
        "name": "className",
        "type": "string",
        "default": "—",
        "description": "Additional classes for the section."
      }
    ],
    "code": "import { motion } from \"motion/react\";\nimport { type ReactNode } from \"react\";\nimport { cn } from \"@/lib/utils\";\n\nexport interface HeroSectionProps {\n  title: string;\n  description?: string;\n  primaryAction?: ReactNode;\n  secondaryAction?: ReactNode;\n  className?: string;\n}\n\nexport function HeroSection({ title, description, primaryAction, secondaryAction, className }: HeroSectionProps) {\n  return (\n    <section className={cn(\"flex flex-col items-center justify-center py-12 text-center\", className)}>\n      <motion.h1\n        initial={{ opacity: 0, y: 30 }}\n        animate={{ opacity: 1, y: 0 }}\n        transition={{ duration: 0.6 }}\n        className=\"text-5xl/14 font-semibold tracking-[-2.88px] text-foreground\"\n      >\n        {title}\n      </motion.h1>\n      {description && (\n        <motion.p\n          initial={{ opacity: 0, y: 30 }}\n          animate={{ opacity: 1, y: 0 }}\n          transition={{ duration: 0.6, delay: 0.15 }}\n          className=\"mt-6 max-w-2xl text-base/6 text-text-secondary\"\n        >\n          {description}\n        </motion.p>\n      )}\n      {(primaryAction || secondaryAction) && (\n        <motion.div\n          initial={{ opacity: 0, y: 30 }}\n          animate={{ opacity: 1, y: 0 }}\n          transition={{ duration: 0.6, delay: 0.3 }}\n          className=\"mt-8 flex gap-4\"\n        >\n          {primaryAction}\n          {secondaryAction}\n        </motion.div>\n      )}\n    </section>\n  );\n}",
    "usage": "import { HeroSection } from \"@/components/ui/hero-section\";\nimport { Button } from \"@/components/ui/button\";\n\nexport default function Example() {\n  return (\n    <HeroSection\n      title=\"Build faster.\"\n      description=\"A clean hero with animated text reveal.\"\n      primaryAction={<Button>Get started</Button>}\n      secondaryAction={<Button variant=\"outline\">Learn more</Button>}\n    />\n  );\n}"
  },
  "input": {
    "slug": "input",
    "name": "Input",
    "kind": "component",
    "description": "Form input components with label, error states, and textarea",
    "category": "inputs",
    "variants": [
      "Text Input",
      "Password",
      "With Icon",
      "Textarea"
    ],
    "props": [
      {
        "name": "type",
        "type": "string",
        "default": "\"text\"",
        "description": "Native HTML input type."
      },
      {
        "name": "placeholder",
        "type": "string",
        "default": "—",
        "description": "Placeholder text shown when empty."
      },
      {
        "name": "className",
        "type": "string",
        "default": "—",
        "description": "Additional classes merged via cn()."
      }
    ],
    "code": "import { type InputHTMLAttributes } from \"react\";\nimport { cn } from \"@/lib/utils\";\n\nexport const Input = ({ className, type, ...props }: InputHTMLAttributes<HTMLInputElement>) => (\n  <input\n    type={type}\n    className={cn(\n      \"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base/6 placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50\",\n      className\n    )}\n    {...props}\n  />\n);",
    "usage": "import { Input } from \"@/components/ui/input\";\n\nexport default function Example() {\n  return <Input type=\"email\" placeholder=\"you@example.com\" />;\n}"
  }
};

export const categories: Record<string, CategoryData> = {
  "buttons": {
    "slug": "buttons",
    "name": "Buttons",
    "kind": "component",
    "order": 1,
    "description": "Button components in several finished designs — variants, sizes, loading and press states included."
  },
  "inputs": {
    "slug": "inputs",
    "name": "Inputs",
    "kind": "component",
    "order": 2,
    "description": "Text inputs and form fields, each a complete design with focus, error and disabled states."
  },
  "badges": {
    "slug": "badges",
    "name": "Badges",
    "kind": "component",
    "order": 3,
    "description": "Status, category and tag labels in several treatments."
  },
  "cards": {
    "slug": "cards",
    "name": "Cards",
    "kind": "component",
    "order": 4,
    "description": "Card surfaces for content, products and stats, in several finished layouts."
  },
  "heroes": {
    "slug": "heroes",
    "name": "Heroes",
    "kind": "block",
    "order": 1,
    "description": "Complete hero sections — headline, supporting copy, calls to action and layout, ready to drop in."
  }
};

export const UTIL_CODE = "import { type ClassValue, clsx } from \"clsx\";\nimport { twMerge } from \"tailwind-merge\";\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs));\n}";
