import type { Metadata } from "next";

import { Navbar } from "../components/landing/navbar";
import { Hero } from "../components/landing/hero";
import { CategoryRail } from "../components/landing/category-rail";
import { ComponentRange } from "../components/landing/component-range";
import { Features } from "../components/landing/features";
import { Pricing } from "../components/landing/pricing";
import { ClosingCTA } from "../components/landing/closing";

export const metadata: Metadata = {
  title: "Devigner UI — finished React components, more than one way",
  description:
    "Copy-paste React components and blocks, organised by category. Every category ships more than one finished design. Install with the CLI; the code is yours.",
};

/* ─── Page ─── */
export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="grain-overlay" />
      <Navbar />
      <Hero>
        <CategoryRail />
      </Hero>
      <ComponentRange />
      <Features />
      <Pricing />
      <ClosingCTA />
    </main>
  );
}
