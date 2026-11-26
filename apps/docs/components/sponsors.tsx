"use client";

import { useEffect, useState } from "react";
import {
  IconAdd,
  IconArrowRight,
  IconArrowRightUp,
  IconCardTick,
  IconCheck,
  IconCrown,
  IconCupPaper,
  IconEdit,
  IconShieldCheck,
} from "@devigner-ui/icons";
import { DISCORD_URL, LogoDiscord } from "./brand-logos";
import { LogoMark } from "./logo-mark";
import { cn } from "cn";

export const SPONSORS_URL = "https://sponsors.devigner.cc";

/** Tier 2 = $19.99, below the hero and a logo on /sponsors. 0 = coffee, name on /sponsors. 1 is no longer sold. */
type Sponsor = { id: string; tier: number; name: string; url: string; tagline?: string; logo?: string; site?: string; bare?: boolean };

/** This site's coffees: every one not bought on remifybot.com. The two Devigner sites share theirs. */
const isOurCoffee = (s: Sponsor) => s.tier === 0 && s.site !== "remify";

// Fetched in the browser so a new sponsor shows without a redeploy. If the
// service is down the lists stay empty and the page is unaffected.
function useSponsors() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  useEffect(() => {
    fetch(`${SPONSORS_URL}/sponsors.json`)
      .then((r) => (r.ok ? r.json() : { sponsors: [] }))
      .then((d) => setSponsors(Array.isArray(d.sponsors) ? d.sponsors : []))
      .catch(() => {});
  }, []);
  return sponsors;
}

/** The house sponsor, as on icons.devigner.cc: after the paid Featured sponsors under the hero, first in the /sponsors list. */
const REMIFY: Sponsor = {
  id: "remify",
  tier: 2,
  name: "Remify",
  url: "https://remifybot.com",
  tagline: "Multipurpose Discord bot",
  logo: "/sponsors/remify.webp",
};

/** Our own product, first in every sponsor spot, as on icons.devigner.cc and remifybot.com. */
const MELO: Sponsor = {
  id: "melo",
  tier: 2,
  name: "Melo",
  url: "https://gomelo.app",
  tagline: "Free video downloader",
  bare: true, // its icon carries its own tile: shown as is, never rounded or clipped
  logo: "/sponsors/melo.svg",
};

const CHIP =
  "inline-flex h-12 items-center gap-2.5 rounded-xl border p-1.25 pr-3.5 transition-colors duration-200 ease-out";

/** Melo, the paid Featured sponsors, Remify, then "Your logo here": the chips of every Featured row. */
export function SponsorChips({ className }: { className?: string }) {
  const top = [MELO, ...useSponsors().filter((s) => s.tier === 2 && s.logo), REMIFY];
  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", className)}>
      {top.map((s) => (
        <a
          key={s.id}
          href={s.url}
          target="_blank"
          rel="noopener sponsored"
          className={`${CHIP} border-border bg-background-100 hover:border-border-hover hover:bg-surface-hover`}
        >
          <img src={s.logo} alt="" width={36} height={36} className={cn("size-9 object-cover", !s.bare && "rounded-md")} />
          <span className="grid text-left leading-tight">
            <span className="text-[14px] font-semibold text-foreground">{s.name}</span>
            {s.tagline && <span className="text-[11px] text-text-muted">{s.tagline}</span>}
          </span>
        </a>
      ))}
      <a
        href="/sponsors#tiers"
        className={`${CHIP} border-dashed border-border text-[13px] text-text-muted hover:border-border-hover hover:text-foreground`}
      >
        <span className="grid size-9 place-items-center rounded-md bg-surface-hover">
          <IconAdd aria-hidden className="size-4" />
        </span>
        Your logo here
      </a>
    </div>
  );
}

/** The Featured row under the home hero. */
export function SponsorStrip() {
  return (
    <section aria-label="Sponsors" className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-6">
        <span className="text-[13px] text-text-muted">Sponsored by</span>
        <SponsorChips />
      </div>
    </section>
  );
}

/** The logos (Featured, and any older $9.99 one) and coffee names on /sponsors. */
export function SponsorsList() {
  const sponsors = useSponsors();
  const logos = [MELO, REMIFY, ...sponsors.filter((s) => s.tier >= 1 && s.logo)];
  const names = sponsors.filter(isOurCoffee);

  return (
    <div className="mt-12 flex flex-col gap-10">
      {logos.length > 0 && (
        <div>
          <h2 className="text-[13px] font-medium text-text-muted">Sponsors</h2>
          <ul className="mt-4 flex flex-wrap gap-2.5">
            {logos.map((s) => (
              <li key={s.id}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener sponsored"
                  className={`${CHIP} border-border bg-background-100 text-[14px] font-semibold text-foreground hover:border-border-hover hover:bg-surface-hover`}
                >
                  {s.logo && <img src={s.logo} alt="" width={36} height={36} className={cn("size-9 object-cover", !s.bare && "rounded-md")} />}
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {names.length > 0 && (
        <div>
          <h2 className="text-[13px] font-medium text-text-muted">Bought us a coffee</h2>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[15px] text-text-secondary">
            {names.map((s) => (
              <li key={s.id}>
                <a href={s.url} target="_blank" rel="noopener sponsored" className="transition-colors duration-200 ease-out hover:text-foreground">
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** The tiers the sponsor service sells. Keep in step with sponsors.devigner.cc, icons.devigner.cc and remifybot.com.
    Featured sits in the middle on wide screens and first when they stack. */
const TIERS = [
  {
    tier: 0,
    name: "Buy me a coffee",
    price: "3.99",
    per: "a month",
    note: "Billed monthly. Cancel anytime.",
    // A coffee bought here shows on both Devigner sites.
    perks: ["Your name on the Devigner UI and Icons Sponsors pages and sidebars"],
    cta: "Buy me a coffee",
  },
  {
    tier: 2,
    name: "Featured Sponsor",
    price: "19.99",
    per: "a month",
    note: "Billed monthly. Cancel anytime.",
    perks: [
      "Logo, name and tagline under the hero on all four home pages",
      "Also on the Sponsors page of all three sites",
      "Also in Devigner UI's sidebar, footer and component pages",
      "Also on the Player in Remify's dashboard",
      "Also on every Devigner Icons page, its READMEs and Figma plugin",
      "A link straight to your site",
      "Added to the sponsors list on our Discord",
    ],
    cta: "Become a Featured Sponsor",
    featured: true,
  },
] as const;

type Tier = (typeof TIERS)[number];

/** Each tier's mark, big beside its price. */
const MARKS = { 0: IconCupPaper, 2: IconCrown } as const;

/** Where a tier shows: `name` in ink, `rest` dimmed. Coffee bought here shows on both Devigner sites; the paid tiers show everywhere. */
type Place = { href: string; name: string; rest: string; mark: "icons" | "ui" | "remify" | "discord" };
const PLACES: Place[] = [
  { href: "https://icons.devigner.cc", name: "icons", rest: ".devigner.cc", mark: "icons" },
  { href: "https://ui.devigner.cc", name: "ui", rest: ".devigner.cc", mark: "ui" },
  { href: "https://remifybot.com", name: "remifybot", rest: ".com", mark: "remify" },
  { href: DISCORD_URL, name: "Discord", rest: " sponsors list", mark: "discord" },
];
const placesFor = (tier: number) => (tier > 0 ? PLACES : PLACES.filter((p) => p.mark === "icons" || p.mark === "ui"));

const STEPS = [
  { icon: IconCardTick, title: "Pick a tier and pay", detail: "Monthly, on Patreon" },
  { icon: IconEdit, title: "Add your details", detail: "Sign in with Patreon, then add your name, link and logo" },
  { icon: IconShieldCheck, title: "We check it", detail: "Then it goes live, usually within a day" },
];

function TierCard({ t }: { t: Tier }) {
  const featured = "featured" in t && t.featured;
  const Mark = MARKS[t.tier];
  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-[22px] p-7 sm:p-8",
        featured
          ? "bg-[linear-gradient(180deg,var(--glow),var(--background-100)_55%)]"
          : "border border-border bg-linear-to-b from-background-100 to-background",
      )}
    >
      <h3 className="text-center text-[22px] font-semibold tracking-[-0.03em] text-foreground">{t.name}</h3>
      {/* The price and its note, with the tier's mark centred on the price line (48px tall, so 24px down). */}
      <div className="relative mt-4 pr-20">
        <Mark
          aria-hidden
          variant="Bulk"
          className={cn("pointer-events-none absolute top-6 right-0 size-16 -translate-y-1/2", featured ? "text-foreground" : "text-text-muted")}
        />
        <p className="flex items-baseline gap-2 leading-none font-semibold tracking-tighter text-foreground tabular-nums">
          <span className="text-[48px]">
            ${t.price.split(".")[0]}
            <span className="text-[24px] tracking-[-0.03em]">.{t.price.split(".")[1]}</span>
          </span>
          <span className="text-[14px] font-normal tracking-normal text-text-muted">{t.per}</span>
        </p>
        <p className="mt-2.5 text-[14px]/6 text-text-muted">{t.note}</p>
      </div>

      <a
        href={`${SPONSORS_URL}/go/${t.tier}?from=ui`}
        className={cn(
          "group mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-[15px] font-medium transition-transform duration-200 ease-out active:scale-[0.97]",
          featured
            ? "bg-brand text-brand-foreground shadow-[inset_0_1px_0_var(--stage-light)] ring-1 ring-brand-hover"
            : "border border-border text-foreground hover:bg-background-100",
        )}
      >
        {t.cta}
        <IconArrowRight aria-hidden className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
      </a>

      <hr className="my-7 border-border" />

      <ul className="grid gap-3">
        {t.perks.map((p) => (
          <li key={p} className="flex gap-2.5 text-[14.5px]/6 text-text-secondary">
            <IconCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-brand" />
            {p}
          </li>
        ))}
      </ul>

      {/* Where it shows: one small card per place, each a way out to it. */}
      <div className="mt-auto pt-8">
        <p className="text-[12.5px] text-text-muted">Shown on</p>
        <ul className="mt-2.5 grid gap-1.5">
          {placesFor(t.tier).map(({ href, name, rest, mark }) => (
            <li key={href}>
              <a
                href={href}
                target="_blank"
                rel="noopener"
                className="group/site flex h-11 items-center gap-3 rounded-xl border border-border/40 bg-background-100/60 px-3 transition-colors duration-200 ease-out hover:border-border hover:bg-background-100"
              >
                <span className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-[7px] bg-surface-hover ring-1 ring-border">
                  {mark === "remify" ? (
                    <img src="/sponsors/remify.webp" alt="" width={24} height={24} className="size-full object-cover" />
                  ) : mark === "discord" ? (
                    <LogoDiscord className="size-3.5 text-foreground" />
                  ) : mark === "ui" ? (
                    <LogoMark className="size-4" />
                  ) : (
                    <img src="/sponsors/icons.webp" alt="" width={24} height={24} className="size-full object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                  {name}
                  <span className="text-text-muted">{rest}</span>
                </span>
                <IconArrowRightUp
                  aria-hidden
                  className="size-4 shrink-0 text-text-muted transition duration-200 ease-out group-hover/site:translate-x-px group-hover/site:-translate-y-px group-hover/site:text-foreground"
                />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

/* Two columns. Featured is framed in the brand colour with its tab on top,
   and the coffee card drops by the tab's height so both faces line up.
   Then how it works, as one strip cut in three. */
export function SponsorTiers() {
  return (
    <section id="tiers" aria-labelledby="tiers-title" className="mt-24 scroll-mt-28">
      <h2 id="tiers-title" className="text-[clamp(2rem,4vw,3rem)] leading-[1.05] font-semibold tracking-[-0.045em] text-foreground">
        Become a sponsor
      </h2>

      <div className="mt-12 grid gap-5 lg:grid-cols-2 lg:gap-4">
        {TIERS.map((t) =>
          "featured" in t && t.featured ? (
            <div
              key={t.tier}
              className="order-first flex flex-col rounded-[28px] bg-brand p-1.5 pt-0 shadow-[0_28px_70px_-30px_var(--brand)] lg:order-0"
            >
              <p className="flex h-10 items-center justify-center gap-1.5 text-[13px] font-semibold text-brand-foreground">
                <IconCrown aria-hidden variant="Bulk" className="size-4" />
                Most visible
              </p>
              <div className="flex-1 overflow-hidden rounded-[22px] bg-background">
                <TierCard t={t} />
              </div>
            </div>
          ) : (
            <div key={t.tier} className="lg:mt-10 lg:mb-1.5">
              <TierCard t={t} />
            </div>
          ),
        )}
      </div>

      <ol className="mt-8 grid divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background-100/50 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {STEPS.map(({ icon: Icon, title, detail }) => (
          <li key={title} className="flex items-start gap-3 px-5 py-4">
            <Icon aria-hidden variant="Bulk" className="size-6 shrink-0 text-brand" />
            <div className="min-w-0">
              <p className="text-[14px]/6 font-semibold text-foreground">{title}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-text-muted">{detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-6 text-[14px] text-text-muted">
        Monthly tiers renew until you cancel. When a sponsorship ends, it comes off the sites on its own.
      </p>
    </section>
  );
}

/*
 * The Featured sponsor in the component sidebar, stacked above the request
 * card and built like it (a surface tile), but one row tall so the nav keeps
 * its room. With several Featured sponsors it shows one a day, in turn: steady
 * while you browse, fair across the month. The day is picked after mount, so
 * the prerendered page and the first paint agree. Melo and the Featured
 * sponsors come first (Remify isn't in this spot), then this site's coffees, name only with a cup for a logo.
 */
export function SponsorCard({ className }: { className?: string }) {
  const sponsors = useSponsors();
  const all = [MELO, ...sponsors.filter((s) => s.tier === 2 && s.logo), ...sponsors.filter(isOurCoffee)];
  const [day, setDay] = useState(0);
  useEffect(() => setDay(Math.floor(Date.now() / 86_400_000)), []);
  const s = all[day % all.length];
  const coffee = s.tier === 0;

  return (
    <a
      href={s.url}
      target="_blank"
      rel="noopener sponsored"
      className={cn(
        "group flex items-center gap-3 rounded-2xl bg-surface2 p-1.5 pr-3 outline-none! transition-[box-shadow,scale] duration-300 ease-out focus-visible:shadow-[0_0_0_2px_color-mix(in_oklab,var(--brand)_45%,transparent)] active:scale-[0.985]",
        className,
      )}
    >
      <span className="grid size-12 shrink-0 place-items-center">
        {coffee ? (
          <IconCupPaper
            aria-hidden
            variant="Bulk"
            className="size-7 text-brand transition-transform duration-500 ease-out group-hover:scale-110 motion-reduce:transition-none"
          />
        ) : (
          <img
            src={s.logo}
            alt=""
            width={32}
            height={32}
            className={cn("size-8 object-cover transition-transform duration-500 ease-out group-hover:scale-110 motion-reduce:transition-none", !s.bare && "rounded-[7px] ring-1 ring-border")}
          />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[13.5px] leading-[18px] font-medium tracking-[-0.01em] text-foreground">{s.name}</span>
          <span className="shrink-0 rounded-sm bg-background px-1 text-[10px]/4 text-text-muted">{coffee ? "Coffee" : "Sponsor"}</span>
        </span>
        <span className="mt-px block truncate text-[12px]/[16px] text-text-muted">{coffee ? "Bought us a coffee" : s.tagline || "Sponsors Devigner UI"}</span>
      </span>
    </a>
  );
}
