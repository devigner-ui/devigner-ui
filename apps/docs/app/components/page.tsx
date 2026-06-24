"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ThemeToggle } from "../../components/theme-provider";
import { Button } from "@devignerui/ui";
import { Badge } from "@devignerui/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@devignerui/ui";
import { Input } from "@devignerui/ui";

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
      initial={reduce ? false : { opacity: 0, y: 24, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8, delay, ease: EASE }}
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
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-foreground text-[11px] font-bold text-background">
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
            href="/pricing"
            className="rounded-full px-3 py-1.5 text-[13px] font-medium text-text-secondary hover:text-foreground transition-colors duration-200"
          >
            Pricing
          </Link>
          <div className="mx-1.5 h-4 w-px bg-border" />
          <ThemeToggle />
        </div>
      </nav>
    </div>
  );
}

function PreviewCard({
  name,
  children,
  className,
}: {
  name: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div
        className={`flex min-h-[220px] items-center justify-center rounded-2xl border border-border bg-background-200 p-6 ${className ?? ""}`}
      >
        {children}
      </div>
      <span className="text-[13px] font-medium text-text-secondary">{name}</span>
    </div>
  );
}

function ButtonPreview() {
  return (
    <div className="flex items-center gap-3">
      <Button variant="secondary" size="sm">
        Button
      </Button>
      <Button variant="default" size="sm">
        Submit
      </Button>
    </div>
  );
}

function InputPreview() {
  return (
    <div className="w-full max-w-[240px] space-y-2">
      <label className="text-[13px] font-medium text-text-secondary">Normal</label>
      <Input placeholder="Search" className="bg-background border-border" />
    </div>
  );
}

function TablePreview() {
  const rows = [
    { order: "#3981", name: "John Doe", avatar: "JD" },
    { order: "#3982", name: "Paige Detienne", avatar: "PD" },
    { order: "#3983", name: "Devon Papsom", avatar: "DP" },
  ];
  return (
    <div className="w-full max-w-[300px] overflow-hidden rounded-xl border border-border">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border bg-background-200">
            <th className="px-4 py-2.5 text-left font-medium text-text-muted">Order #</th>
            <th className="px-4 py-2.5 text-left font-medium text-text-muted">Customer</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.order} className="border-b border-border last:border-0">
              <td className="px-4 py-2.5 text-text-muted">{row.order}</td>
              <td className="flex items-center gap-2 px-4 py-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-[10px] font-medium text-accent">
                  {row.avatar}
                </span>
                <span className="text-foreground">{row.name}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SidebarPreview() {
  const items = [
    { icon: "🔍", label: "Search" },
    { icon: "📥", label: "Inbox" },
    { icon: "🏠", label: "Home" },
    { icon: "📅", label: "Events" },
  ];
  return (
    <div className="w-full max-w-[200px] space-y-1">
      <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-foreground">
        <span className="flex h-5 w-5 items-center justify-center rounded bg-accent text-[10px]">⚡</span>
        Tailwind Labs
      </div>
      <div className="h-px bg-border my-1" />
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] text-text-secondary hover:bg-surface-hover transition-colors"
        >
          <span className="text-[14px]">{item.icon}</span>
          {item.label}
        </div>
      ))}
    </div>
  );
}

function CheckboxPreview() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-5 w-5 items-center justify-center rounded border border-accent bg-accent">
        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div className="flex h-5 w-5 items-center rounded border border-border bg-background" />
    </div>
  );
}

function ComboboxPreview() {
  const items = [
    { name: "Joanne Weber", initials: "JW" },
    { name: "Joel Baker", initials: "JB" },
    { name: "Jonathan Richards", initials: "JR" },
    { name: "Jordan Paul", initials: "JP", selected: true },
  ];
  return (
    <div className="w-full max-w-[260px]">
      <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-[13px]">
        <span className="text-text-muted">Jo</span>
        <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      <div className="mt-1 overflow-hidden rounded-lg border border-border bg-background shadow-elevated">
        {items.map((item) => (
          <div
            key={item.name}
            className={`flex items-center justify-between px-3 py-2 text-[13px] ${
              item.selected
                ? "bg-accent text-white"
                : "text-foreground hover:bg-surface-hover"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 text-[9px] font-medium text-accent">
                {item.initials}
              </span>
              {item.name}
            </div>
            {item.selected && (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RadioPreview() {
  return (
    <div className="w-full max-w-[300px] space-y-4">
      <div>
        <h4 className="text-[14px] font-medium text-foreground">Resale and transfers</h4>
        <p className="mt-1 text-[12px] text-text-muted">Decide if people buy tickets from you or from someone else.</p>
      </div>
      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <div className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-accent">
            <div className="h-2 w-2 rounded-full bg-accent" />
          </div>
          <div>
            <div className="text-[13px] font-medium text-foreground">Allow tickets to be resold</div>
            <div className="text-[12px] text-text-muted">Customers can resell or transfer their tickets.</div>
          </div>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <div className="mt-0.5 h-4 w-4 rounded-full border-2 border-border" />
          <div>
            <div className="text-[13px] font-medium text-foreground">Don&apos;t allow ticket to be resold</div>
          </div>
        </label>
      </div>
    </div>
  );
}

function SwitchPreview() {
  return (
    <div className="flex items-center gap-6">
      <div className="relative h-6 w-11 rounded-full bg-accent">
        <div className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm" />
      </div>
      <div className="relative h-6 w-11 rounded-full bg-gray-200">
        <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm" />
      </div>
    </div>
  );
}

function DescriptionListPreview() {
  const items = [
    { label: "Customer", value: "John Doe" },
    { label: "Event", value: "Bear Hug: Live" },
    { label: "Amount", value: "$150.00 USD" },
    { label: "Amount after exchange rate", value: "US$150.00 →" },
    { label: "Fee", value: "$4.79 USD" },
  ];
  return (
    <div className="w-full max-w-[320px] divide-y divide-border rounded-xl border border-border">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between px-4 py-2.5 text-[13px]">
          <span className="text-text-muted">{item.label}</span>
          <span className="font-medium text-foreground">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function BadgePreview() {
  const colors = [
    "bg-accent text-white",
    "bg-destructive text-white",
    "bg-success text-white",
    "bg-warning text-white",
    "bg-gray-200 text-foreground",
    "bg-accent/10 text-accent",
    "bg-destructive/10 text-destructive",
    "bg-success/10 text-success",
  ];
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {colors.map((color, i) => (
        <span key={i} className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${color}`}>
          Badge
        </span>
      ))}
    </div>
  );
}

function ListboxPreview() {
  return (
    <div className="w-full max-w-[220px]">
      <label className="mb-1.5 block text-[13px] font-medium text-foreground">Country</label>
      <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-[13px]">
        <div className="flex items-center gap-2">
          <span className="text-[16px]">🇨🇦</span>
          <span className="text-foreground">Canada</span>
        </div>
        <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

function PaginationPreview() {
  return (
    <div className="flex items-center gap-1">
      <button className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[13px] text-text-muted hover:text-foreground transition-colors">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Previous
      </button>
      {[1, 2, 3].map((page) => (
        <button
          key={page}
          className={`h-8 w-8 rounded-lg text-[13px] font-medium transition-colors ${
            page === 1
              ? "bg-accent text-white"
              : "text-text-muted hover:text-foreground hover:bg-surface-hover"
          }`}
        >
          {page}
        </button>
      ))}
    </div>
  );
}

function DropdownPreview() {
  return (
    <div className="relative inline-block">
      <button className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] font-medium text-foreground">
        Options
        <svg className="h-3 w-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className="absolute left-0 top-full z-10 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-background shadow-elevated">
        <div className="px-3 py-2 text-[13px] text-foreground hover:bg-surface-hover cursor-pointer">Edit</div>
        <div className="px-3 py-2 text-[13px] text-foreground hover:bg-surface-hover cursor-pointer">Duplicate</div>
        <div className="h-px bg-border" />
        <div className="px-3 py-2 text-[13px] text-destructive hover:bg-surface-hover cursor-pointer">Delete</div>
      </div>
    </div>
  );
}

function NavigationPreview() {
  const items = ["Home", "Events", "Orders"];
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-background-200 p-1">
      {items.map((item, i) => (
        <button
          key={item}
          className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
            i === 0
              ? "bg-accent text-white"
              : "text-text-secondary hover:text-foreground"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function AvatarGroupPreview() {
  const avatars = ["JD", "PD", "DP", "JR"];
  const colors = ["bg-accent", "bg-destructive", "bg-success", "bg-warning"];
  return (
    <div className="flex -space-x-2">
      {avatars.map((initials, i) => (
        <span
          key={initials}
          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-background-200 text-[11px] font-medium text-white ${colors[i]}`}
        >
          {initials}
        </span>
      ))}
    </div>
  );
}

const componentPreviews = [
  { name: "Button", component: <ButtonPreview /> },
  { name: "Input", component: <InputPreview /> },
  { name: "Table", component: <TablePreview /> },
  { name: "Sidebar", component: <SidebarPreview /> },
  { name: "Checkbox", component: <CheckboxPreview /> },
  { name: "Combobox", component: <ComboboxPreview /> },
  { name: "Radio groups", component: <RadioPreview /> },
  { name: "Switch", component: <SwitchPreview /> },
  { name: "Description list", component: <DescriptionListPreview /> },
  { name: "Badge", component: <BadgePreview /> },
  { name: "Listbox", component: <ListboxPreview /> },
  { name: "Pagination", component: <PaginationPreview /> },
  { name: "Dropdown", component: <DropdownPreview /> },
  { name: "Navigation", component: <NavigationPreview /> },
  { name: "Avatar group", component: <AvatarGroupPreview /> },
];

export default function ComponentsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="grain-overlay" />
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-12 sm:pt-40 sm:pb-16">
        <div className="absolute inset-0 mesh-gradient" />
        <div className="relative mx-auto max-w-7xl px-5">
          <Reveal>
            <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-foreground">
              Components
            </h1>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-text-secondary sm:text-lg">
              Browse all available components. Multiple design styles per
              component, each with its own variants.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Component Grid */}
      <section className="section-editorial py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {componentPreviews.map((comp, i) => (
              <Reveal key={comp.name} delay={i * 0.04}>
                <Link href={`/components/${comp.name.toLowerCase().replace(/\s+/g, "-")}`}>
                  <PreviewCard name={comp.name}>
                    {comp.component}
                  </PreviewCard>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-foreground text-[10px] font-bold text-background">
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
