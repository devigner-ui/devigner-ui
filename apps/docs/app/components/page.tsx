"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ThemeToggle } from "../../components/theme-provider";
import { Button } from "@devignerui/ui";
import { Input } from "@devignerui/ui";
import { components } from "@/lib/registry";

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
            href="/docs"
            className="rounded-full px-3 py-1.5 text-[13px] font-medium text-text-secondary hover:text-foreground transition-colors duration-200"
          >
            Docs
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
  soon = false,
}: {
  name: string;
  children: React.ReactNode;
  className?: string;
  soon?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div
        className={`relative flex h-55 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background-200 p-6 transition-all duration-300 ease-out ${soon ? "opacity-60" : "group-hover:border-border-hover group-hover:bg-background-100 group-hover:shadow-elevated"} ${className ?? ""}`}
      >
        {soon && (
          <span className="absolute right-2.5 top-2.5 rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-text-muted">
            Soon
          </span>
        )}
        {/* ponytail: stopPropagation so clicks on the preview don't trigger the parent onClick */}
        <div onClick={(e) => e.stopPropagation()}>{children}</div>
      </div>
      <div className="flex items-center justify-between px-0.5">
        <span
          className={`text-[13px] font-medium text-text-secondary transition-colors duration-200 ${soon ? "" : "group-hover:text-foreground"}`}
        >
          {name}
        </span>
        {!soon && (
          <span className="-translate-x-1 opacity-0 text-[13px] text-accent transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
            →
          </span>
        )}
      </div>
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
  const [value, setValue] = useState("");
  return (
    <div className="w-full max-w-60 space-y-2">
      <label className="text-[13px] font-medium text-text-secondary">
        Normal
      </label>
      <Input
        placeholder="Search"
        className="bg-background border-border"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}

function TablePreview() {
  const [selected, setSelected] = useState<string | null>(null);
  const rows = [
    { order: "#3981", name: "John Doe", avatar: "JD" },
    { order: "#3982", name: "Paige Detienne", avatar: "PD" },
    { order: "#3983", name: "Devon Papsom", avatar: "DP" },
  ];
  return (
    <div className="w-full max-w-75 overflow-hidden rounded-xl border border-border">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border bg-background-200">
            <th className="px-4 py-2.5 text-left font-medium text-text-muted">
              Order #
            </th>
            <th className="px-4 py-2.5 text-left font-medium text-text-muted">
              Customer
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.order}
              onClick={() =>
                setSelected(row.order === selected ? null : row.order)
              }
              className={`cursor-pointer border-b border-border last:border-0 transition-colors duration-150 ${
                row.order === selected
                  ? "bg-accent/5"
                  : "hover:bg-surface-hover"
              }`}
            >
              <td className="px-4 py-2.5 text-text-muted">{row.order}</td>
              <td className="flex items-center gap-2 px-4 py-2.5">
                <span className="flex size-6 items-center justify-center rounded-full bg-accent/10 text-[10px] font-medium text-accent">
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
  const [active, setActive] = useState("Home");
  const items = [
    { icon: "🔍", label: "Search" },
    { icon: "📥", label: "Inbox" },
    { icon: "🏠", label: "Home" },
    { icon: "📅", label: "Events" },
  ];
  return (
    <div className="w-full max-w-50 space-y-1">
      <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-foreground">
        <span className="flex size-5 items-center justify-center rounded-sm bg-accent text-[10px]">
          ⚡
        </span>
        Tailwind Labs
      </div>
      <div className="h-px bg-border my-1" />
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => setActive(item.label)}
          className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] text-left transition-colors duration-150 ${
            active === item.label
              ? "bg-surface-hover text-foreground font-medium"
              : "text-text-secondary hover:bg-surface-hover"
          }`}
        >
          <span className="text-sm">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}

function CheckboxPreview() {
  const [checks, setChecks] = useState([true, false]);
  return (
    <div className="flex items-center gap-4">
      {checks.map((checked, i) => (
        <button
          key={i}
          onClick={() => setChecks((c) => c.map((v, j) => (j === i ? !v : v)))}
          className={`flex size-5 items-center justify-center rounded-sm border transition-all duration-150 ${
            checked
              ? "border-accent bg-accent"
              : "border-border bg-background hover:border-accent/50"
          }`}
        >
          {checked && (
            <svg
              className="size-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}

function ComboboxPreview() {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState("Jordan Paul");
  const [query, setQuery] = useState("Jo");

  const allItems = [
    { name: "Joanne Weber", initials: "JW" },
    { name: "Joel Baker", initials: "JB" },
    { name: "Jonathan Richards", initials: "JR" },
    { name: "Jordan Paul", initials: "JP" },
  ];

  const filtered = allItems.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="w-full max-w-65">
      <div
        className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-[13px] cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <input
          className="w-full bg-transparent text-foreground outline-none placeholder:text-text-muted"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          placeholder="Search..."
        />
        <svg
          className={`size-4 shrink-0 text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
      {open && filtered.length > 0 && (
        <div className="mt-1 overflow-hidden rounded-lg border border-border bg-background shadow-elevated">
          {filtered.map((item) => (
            <div
              key={item.name}
              onClick={() => {
                setSelected(item.name);
                setQuery(item.name);
                setOpen(false);
              }}
              className={`flex cursor-pointer items-center justify-between px-3 py-2 text-[13px] ${
                item.name === selected
                  ? "bg-accent text-white"
                  : "text-foreground hover:bg-surface-hover"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex size-5 items-center justify-center rounded-full text-[9px] font-medium ${
                    item.name === selected
                      ? "bg-white/20 text-white"
                      : "bg-accent/10 text-accent"
                  }`}
                >
                  {item.initials}
                </span>
                {item.name}
              </div>
              {item.name === selected && (
                <svg
                  className="size-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RadioPreview() {
  const [selected, setSelected] = useState(0);
  const options = [
    {
      label: "Allow tickets to be resold",
      desc: "Customers can resell or transfer their tickets.",
    },
    { label: "Don't allow tickets to be resold", desc: "" },
  ];
  return (
    <div className="w-full max-w-75 space-y-4">
      <div>
        <h4 className="text-sm font-medium text-foreground">
          Resale and transfers
        </h4>
        <p className="mt-1 text-xs text-text-muted">
          Decide if people buy tickets from you or from someone else.
        </p>
      </div>
      <div className="space-y-3">
        {options.map((opt, i) => (
          <label
            key={i}
            className="flex cursor-pointer items-start gap-3"
            onClick={() => setSelected(i)}
          >
            <div
              className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150 ${
                selected === i ? "border-accent" : "border-border"
              }`}
            >
              {selected === i && (
                <div className="size-2 rounded-full bg-accent" />
              )}
            </div>
            <div>
              <div className="text-[13px] font-medium text-foreground">
                {opt.label}
              </div>
              {opt.desc && (
                <div className="text-xs text-text-muted">{opt.desc}</div>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

function SwitchPreview() {
  const [switches, setSwitches] = useState([true, false]);
  return (
    <div className="flex items-center gap-6">
      {switches.map((on, i) => (
        <button
          key={i}
          onClick={() =>
            setSwitches((s) => s.map((v, j) => (j === i ? !v : v)))
          }
          className={`relative h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none ${
            on ? "bg-accent" : "bg-border"
          }`}
        >
          <div
            className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              on ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      ))}
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
    <div className="w-full max-w-80 divide-y divide-border rounded-xl border border-border">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between px-4 py-2.5 text-[13px]"
        >
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
        <span
          key={i}
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${color}`}
        >
          Badge
        </span>
      ))}
    </div>
  );
}

function ListboxPreview() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState({
    flag: "🇨🇦",
    label: "Canada",
  });
  const options = [
    { flag: "🇨🇦", label: "Canada" },
    { flag: "🇺🇸", label: "United States" },
    { flag: "🇬🇧", label: "United Kingdom" },
    { flag: "🇦🇺", label: "Australia" },
  ];
  return (
    <div className="relative w-full max-w-55">
      <label className="mb-1.5 block text-[13px] font-medium text-foreground">
        Country
      </label>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-[13px]"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{selected.flag}</span>
          <span className="text-foreground">{selected.label}</span>
        </div>
        <svg
          className={`size-4 text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-background shadow-elevated">
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => {
                setSelected(opt);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors duration-100 ${
                opt.label === selected.label
                  ? "bg-accent text-white"
                  : "text-foreground hover:bg-surface-hover"
              }`}
            >
              <span className="text-base">{opt.flag}</span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PaginationPreview() {
  const [activePage, setActivePage] = useState(1);
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setActivePage((p) => Math.max(1, p - 1))}
        className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[13px] text-text-muted transition-colors hover:text-foreground"
      >
        <svg
          className="size-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Previous
      </button>
      {[1, 2, 3].map((page) => (
        <button
          key={page}
          onClick={() => setActivePage(page)}
          className={`size-8 rounded-lg text-[13px] font-medium transition-all duration-150 ${
            page === activePage
              ? "bg-accent text-white"
              : "text-text-muted hover:bg-surface-hover hover:text-foreground"
          }`}
        >
          {page}
        </button>
      ))}
    </div>
  );
}

function DropdownPreview() {
  const [open, setOpen] = useState(true);
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-surface-hover"
      >
        Options
        <svg
          className={`size-3 text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-background shadow-elevated">
          <button
            onClick={() => setOpen(false)}
            className="flex w-full px-3 py-2 text-left text-[13px] text-foreground transition-colors hover:bg-surface-hover"
          >
            Edit
          </button>
          <button
            onClick={() => setOpen(false)}
            className="flex w-full px-3 py-2 text-left text-[13px] text-foreground transition-colors hover:bg-surface-hover"
          >
            Duplicate
          </button>
          <div className="h-px bg-border" />
          <button
            onClick={() => setOpen(false)}
            className="flex w-full px-3 py-2 text-left text-[13px] text-destructive transition-colors hover:bg-surface-hover"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function NavigationPreview() {
  const [active, setActive] = useState("Home");
  const items = ["Home", "Events", "Orders"];
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-background-200 p-1">
      {items.map((item) => (
        <button
          key={item}
          onClick={() => setActive(item)}
          className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-200 ${
            active === item
              ? "bg-accent text-white shadow-sm"
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
          className={`flex size-8 items-center justify-center rounded-full border-2 border-background-200 text-[11px] font-medium text-white ${colors[i]}`}
        >
          {initials}
        </span>
      ))}
    </div>
  );
}

// Slugs with a real /components/[slug] page come straight from the registry.
const READY = new Set(Object.keys(components));

const slugOf = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

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
  const router = useRouter();
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
            <p className="mt-4 max-w-lg text-base/relaxed text-text-secondary sm:text-lg">
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
            {componentPreviews.map((comp, i) => {
              const ready = READY.has(slugOf(comp.name));
              return (
                <Reveal key={comp.name} delay={i * 0.04}>
                  <div
                    className={`group ${ready ? "cursor-pointer" : "cursor-default"}`}
                    onClick={
                      ready
                        ? () => router.push(`/components/${slugOf(comp.name)}`)
                        : undefined
                    }
                  >
                    <PreviewCard name={comp.name} soon={!ready}>
                      {comp.component}
                    </PreviewCard>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
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
