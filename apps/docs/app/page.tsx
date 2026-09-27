import type { Metadata } from "next";
import { BENTO, FEATURED, SITE_URL, getCatalog } from "@/lib/catalog";
import { REQUIREMENTS } from "@/lib/llms";
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
import { RequestFab } from "../components/request/request-fab";

const TITLE = "Devigner UI: Animated React Components for Tailwind CSS";
const DESCRIPTION =
  "Free animated React components for Tailwind CSS. Keyboard support, reduced motion and dark mode are built in, and one command copies each into your repo.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/", types: { "text/plain": "/llms.txt" } },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/" },
};

export default function HomePage() {
  const entries = getCatalog();
  const bySlug = (slug: string) =>
    entries.find((e) => e.slug === slug) ?? entries[0];
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
            {
              "@type": "WebSite",
              "@id": `${SITE_URL}/#website`,
              name: "Devigner UI",
              url: SITE_URL,
              description: DESCRIPTION,
              inLanguage: "en",
              publisher: { "@id": `${SITE_URL}/#organization` },
            },
            {
              "@type": "Organization",
              "@id": `${SITE_URL}/#organization`,
              name: "Devigner UI",
              url: SITE_URL,
              logo: `${SITE_URL}/apple-icon`,
              sameAs: [
                "https://x.com/devignerui",
                "https://devigner.cc",
                "https://www.npmjs.com/package/devignerui",
              ],
            },
            // The library itself: what it is, what it runs on, what it costs.
            {
              "@type": "SoftwareApplication",
              name: "Devigner UI",
              url: SITE_URL,
              description: DESCRIPTION,
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Any",
              softwareRequirements: REQUIREMENTS,
              license: "https://opensource.org/licenses/MIT",
              downloadUrl: "https://www.npmjs.com/package/devignerui",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              publisher: { "@id": `${SITE_URL}/#organization` },
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
      <RequestFab />
    </div>
  );
}
