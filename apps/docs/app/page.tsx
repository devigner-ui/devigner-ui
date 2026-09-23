import type { Metadata } from "next";
import { Navbar } from "../components/landing/navbar";
import { Hero } from "../components/landing/hero";
import { Catalog } from "../components/landing/catalog";
import { Install } from "../components/landing/install";
import { Pricing } from "../components/landing/pricing";
import { ClosingCTA, SiteFooter } from "../components/landing/closing";
import { SmoothScroll } from "../components/landing/smooth-scroll";

export const metadata: Metadata = {
  title: "Devigner UI: Animated React Components for Tailwind CSS",
  description:
    "Free animated React components built with Tailwind CSS and Motion: a magnetic button, date range picker, menu dock, delete button, chart card and timeline. Install any of them as a plain .tsx file with one CLI command.",
  openGraph: {
    title: "Devigner UI: Animated React Components for Tailwind CSS",
    description:
      "Free animated React components with every state designed. Install one with the CLI and the code is yours.",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-background">
      <SmoothScroll />
      <div className="grain-overlay" />
      <Navbar />
      <main>
        <Hero />
        <Catalog />
        <Install />
        <Pricing />
        <ClosingCTA />
      </main>
      <SiteFooter />
    </div>
  );
}
