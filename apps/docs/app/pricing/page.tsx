import { permanentRedirect } from "next/navigation";

// Pricing lives on the home page; old /pricing links keep their ranking.
export default function PricingPage() {
  permanentRedirect("/#pricing");
}
