import type { Metadata } from "next";

import { Navbar } from "../components/landing/navbar";
import { Hero } from "../components/landing/hero";
import { ComponentRange } from "../components/landing/component-range";
import { CliTerminal } from "../components/landing/cli-terminal";
import { Features } from "../components/landing/features";
import { Pricing } from "../components/landing/pricing";
import { ClosingCTA } from "../components/landing/closing";
import { SmoothScroll } from "../components/landing/smooth-scroll";

export const metadata: Metadata = {
  title: "Devigner UI — finished React components, more than one way",
  description:
    "Copy-paste React components and blocks, organised by category. Every category ships more than one finished design. Install with the CLI; the code is yours.",
};

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
    </div>
  );
}
