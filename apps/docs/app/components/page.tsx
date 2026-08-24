import { Navbar } from "@/components/landing/navbar";
import { GalleryIndex } from "@/components/gallery/surface";

export const metadata = {
  title: "React components — Devigner UI",
  description:
    "Browse Devigner UI components by category. Each design arrives finished, installs with the CLI, and the code lands in your repo.",
};

export default function ComponentsPage() {
  return (
    <>
      <Navbar />
      <GalleryIndex kind="component" />
    </>
  );
}
