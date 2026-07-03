"use client";

import { Navbar } from "../components/landing/navbar";
import { Hero } from "../components/landing/hero";
import { Manifesto } from "../components/landing/manifesto";
import { ComponentRange } from "../components/landing/component-range";
import { CliTerminal } from "../components/landing/cli-terminal";
import { Features } from "../components/landing/features";
import { StatsBand } from "../components/landing/stats-band";
import { Pricing } from "../components/landing/pricing";
import { ClosingCTA, SiteFooter } from "../components/landing/closing";
import { SmoothScroll } from "../components/landing/smooth-scroll";

/* ─── Page ─── */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SmoothScroll />
      <div className="grain-overlay" />
      <Navbar />
      <Hero />
      <Manifesto />
      <ComponentRange />
      <CliTerminal />
      <Features />
      <StatsBand />
      <Pricing />
      <ClosingCTA />
      <SiteFooter />
    </div>
  );
}
