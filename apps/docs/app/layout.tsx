import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "../components/theme-provider";
import { SITE_URL } from "@/lib/catalog";
// @ts-ignore - CSS module declarations not available in this project
import "./globals.css";

// The logo face: the wordmark, brand tile and the giant footer word only.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-bricolage",
});

// The accent face: one emphasized word in a title (.accent-word). OFL,
// github.com/collletttivo/mazius-display.
const mazius = localFont({
  src: "../assets/fonts/MaziusDisplay-ExtraItalicBold.woff2",
  weight: "700",
  style: "italic",
  display: "swap",
  variable: "--font-mazius",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Devigner UI", template: "%s · Devigner UI" },
  description:
    "Free animated React components for Tailwind CSS, installed as plain files you own.",
  openGraph: { siteName: "Devigner UI", type: "website", locale: "en_US" },
  twitter: {
    card: "summary_large_image",
    site: "@devignerui",
    creator: "@devignerui",
  },
  // Search Console "HTML tag" method: paste only the content="..." value.
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
};

// GA4 measurement ID (G-XXXXXXX). Unset in dev, so local visits are not counted.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('devignerui-theme');
      if (!theme) {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.classList.add(theme);
    } catch(e) {}
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${bricolage.variable} ${mazius.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="gtag" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
