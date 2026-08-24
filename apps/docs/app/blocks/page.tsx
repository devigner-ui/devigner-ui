import { Navbar } from "@/components/landing/navbar";
import { GalleryIndex } from "@/components/gallery/surface";

export const metadata = {
  title: "React blocks — Devigner UI",
  description:
    "Browse Devigner UI blocks by category. Whole sections, composed and ready to drop in, installed with the CLI.",
};

export default function BlocksPage() {
  return (
    <>
      <Navbar />
      <GalleryIndex kind="block" />
    </>
  );
}
