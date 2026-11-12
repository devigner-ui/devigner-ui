import type { Metadata } from "next";
import { Navbar } from "../../components/landing/navbar";
import { SiteFooter } from "../../components/landing/closing";
import { SponsorTiers, SponsorsList } from "../../components/sponsors";

export const metadata: Metadata = {
  title: "Sponsors",
  description: "The people and companies who sponsor Devigner UI, Devigner Icons and Remify.",
  alternates: { canonical: "/sponsors" },
};

export default function SponsorsPage() {
  return (
    <div className="min-h-dvh bg-background">
      <Navbar autoHide />
      <main className="relative overflow-hidden pt-32 pb-24 sm:pt-40">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-120 bg-[radial-gradient(50%_60%_at_20%_0%,var(--glow),transparent_70%)]"
        />
        <div className="relative mx-auto max-w-7xl px-5">
          <h1 className="text-[clamp(2rem,4vw,3rem)] leading-[1.05] font-semibold tracking-[-0.045em] text-foreground">
            Sponsors
          </h1>
          <p className="mt-4 max-w-xl text-[17px]/7 text-text-secondary">
            Devigner UI is free. These people and companies help keep it that way. Sponsors are shown on
            ui.devigner.cc, icons.devigner.cc and remifybot.com.
          </p>
          <a
            href="#tiers"
            className="mt-6 inline-flex h-11 items-center rounded-full bg-brand px-5 text-[14.5px] font-medium text-brand-foreground ring-1 ring-brand-hover transition-transform duration-200 ease-out active:scale-[0.97]"
          >
            Become a sponsor
          </a>
          <SponsorsList />
          <SponsorTiers />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
