import { permanentRedirect } from "next/navigation";

// The form lives in a dialog on /requests now. Old links keep working and
// keep their prefilled name.
export default async function RequestPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const { name } = await searchParams;
  permanentRedirect(`/requests?new${name ? `&name=${encodeURIComponent(name)}` : ""}`);
}
