"use client";

import { Navbar } from "../components/landing/navbar";
import { Hero } from "../components/landing/hero";
import { ComponentRange } from "../components/landing/component-range";
import { CliTerminal } from "../components/landing/cli-terminal";
import { Features } from "../components/landing/features";
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
      <ComponentRange />
      <CliTerminal />
      <Features />
      <Pricing />
      <ClosingCTA />
      <SiteFooter />
    </div>
  );
}
