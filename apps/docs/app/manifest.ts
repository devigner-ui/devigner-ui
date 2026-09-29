import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Devigner UI",
    short_name: "Devigner UI",
    description:
      "Beautifully crafted animated React components for Tailwind CSS, installed as plain .tsx files you own.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0c0e",
    theme_color: "#5a94ff",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
