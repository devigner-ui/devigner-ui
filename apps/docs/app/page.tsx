import type { Metadata } from "next";
import { BENTO, FEATURED, SITE_URL, getCatalog } from "@/lib/catalog";
import { JsonLd } from "../components/json-ld";
import { Navbar } from "../components/landing/navbar";
import { Hero } from "../components/landing/hero";
import { WorksWith } from "../components/landing/works-with";
import { States } from "../components/landing/states";
import { Install } from "../components/landing/install";
import { FAQS, Faq } from "../components/landing/faq";
import { Pricing } from "../components/landing/pricing";
import { LastCall, SiteFooter } from "../components/landing/closing";
import { SelectionProvider } from "../components/landing/selection";

const TITLE = "Devigner UI: Animated React Components for Tailwind CSS";
const DESCRIPTION =
  "Free animated React components for Tailwind CSS. Keyboard support, reduced motion and dark mode are built in, and one command copies each into your repo.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/" },
};

export default function HomePage() {
  const entries = getCatalog();
  const bySlug = (slug: string) => entries.find((e) => e.slug === slug) ?? entries[0];
  const bento = {
    themes: bySlug(BENTO.themes),
    motion: bySlug(BENTO.motion),
  };

  return (
    <div className="min-h-dvh bg-background">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "WebSite", name: "Devigner UI", url: SITE_URL },
            {
              "@type": "Organization",
              name: "Devigner UI",
              url: SITE_URL,
              logo: `${SITE_URL}/icon.svg`,
              sameAs: ["https://x.com/devignerui"],
            },
            {
              "@type": "FAQPage",
              mainEntity: FAQS.map((f) => ({
                "@type": "Question",
                name: f.question,
                acceptedAnswer: { "@type": "Answer", text: f.answer },
              })),
            },
          ],
        }}
      />
      <Navbar />
      <main>
        <SelectionProvider initial={FEATURED}>
          <Hero entries={entries} />
          <WorksWith />
          <States bento={bento} entries={entries} />
          <Install entries={entries} />
        </SelectionProvider>
        <Pricing />
        <Faq />
        <LastCall />
      </main>
      <SiteFooter />
    </div>
  );
}
