import type { ReactNode } from "react";
import { RootProvider } from "fumadocs-ui/provider/next";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "@/lib/source";
import { ThemeToggle } from "@/components/theme-provider";
// @ts-ignore - CSS module declarations not available in this project
import "./docs.css";

export default function DocsRootLayout({ children }: { children: ReactNode }) {
  return (
    <RootProvider theme={{ enabled: false }}>
      <DocsLayout
        tree={source.pageTree}
        nav={{ title: "Devigner UI", children: <ThemeToggle /> }}
        themeSwitch={{ enabled: false }}
        links={[
          { type: "main", text: "Components", url: "/components" },
          { type: "main", text: "Home", url: "/" },
        ]}
      >
        {children}
      </DocsLayout>
    </RootProvider>
  );
}
