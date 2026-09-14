import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "../components/theme-provider";
// @ts-ignore - CSS module declarations not available in this project
import "./globals.css";

export const metadata: Metadata = {
  title: "Devigner UI",
  description:
    "Beautiful React components, built with Tailwind CSS. Copy-paste or install via CLI.",
};

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
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Clash Display - heavy grotesque display face (Fontshare).
            ponytail: CDN link for now; self-host via next/font/local if perf matters. */}
        <link
          rel="preconnect"
          href="https://api.fontshare.com"
          crossOrigin=""
        />
        <link
          rel="preconnect"
          href="https://cdn.fontshare.com"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=clash-display@500,600,700&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
