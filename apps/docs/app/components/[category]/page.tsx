import { Navbar } from "@/components/landing/navbar";
import { CategoryPage } from "@/components/gallery/surface";
import { getCategories } from "@/lib/registry";

export function generateStaticParams() {
  return getCategories("component").map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const match = getCategories("component").find((c) => c.slug === category);
  if (!match) return {};
  return { title: `${match.name} — Devigner UI`, description: match.description };
}

export default async function Page({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  return (
    <>
      <Navbar />
      <CategoryPage kind="component" categorySlug={category} />
    </>
  );
}
