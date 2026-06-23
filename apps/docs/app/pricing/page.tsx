"use client";

import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "../../components/theme-provider";

const plans = [
  {
    name: "Basic",
    monthly: 9,
    yearly: 79,
    description: "Access to components released during your subscription month",
    features: [
      "Components released during subscription month",
      "1 project license",
      "Community support",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    monthly: 19,
    yearly: 179,
    description: "Current month + 2 previous months of components",
    features: [
      "Current + 2 previous months of components",
      "5 project licenses",
      "Priority support",
    ],
    highlighted: true,
  },
  {
    name: "Ultra",
    monthly: 39,
    yearly: 349,
    description: "Access to ALL components, no date restriction",
    features: [
      "All components (no date restriction)",
      "Unlimited projects",
      "Priority support",
      "Early access to new components",
    ],
    highlighted: false,
  },
];

const lifetime = {
  price: 600,
  features: [
    "All components (past + future)",
    "All blocks (past + future)",
    "Lifetime updates",
    "Unlimited projects",
    "Priority support forever",
  ],
};

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (plan: string) => {
    setLoading(plan);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.toLowerCase(), billing }),
      });
      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoading(null);
    }
  };

  const handleLifetimeCheckout = async () => {
    setLoading("lifetime");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "lifetime", billing: "one-time" }),
      });
      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-[50px] max-w-6xl items-center justify-between px-[16px]">
          <Link href="/" className="text-[24px] font-semibold leading-[32px] tracking-[-0.96px] text-foreground">
            Devigner UI
          </Link>
          <div className="flex items-center gap-[24px]">
            <Link
              href="/"
              className="text-[14px] font-medium leading-[20px] text-text-secondary hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link
              href="/components"
              className="text-[14px] font-medium leading-[20px] text-text-secondary hover:text-foreground transition-colors"
            >
              Components
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-[16px] py-[48px]">
        <div className="text-center">
          <h1 className="text-[48px] font-semibold leading-[56px] tracking-[-2.88px] text-foreground">Pricing</h1>
          <p className="mt-[16px] text-[16px] leading-[24px] text-text-secondary">
            Choose the plan that fits your needs
          </p>

          {/* Billing Toggle */}
          <div className="mt-[32px] inline-flex items-center rounded-[8px] border border-border p-[4px]">
            <button
              onClick={() => setBilling("monthly")}
              className={`rounded-[6px] px-[16px] py-[8px] text-[14px] font-medium leading-[20px] transition-colors ${
                billing === "monthly"
                  ? "bg-foreground text-background"
                  : "text-text-muted hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`rounded-[6px] px-[16px] py-[8px] text-[14px] font-medium leading-[20px] transition-colors ${
                billing === "yearly"
                  ? "bg-foreground text-background"
                  : "text-text-muted hover:text-foreground"
              }`}
            >
              Yearly
              <span className="ml-[6px] text-[12px] text-success">Save 27%</span>
            </button>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="mt-[48px] grid gap-[24px] sm:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-[16px] border p-[24px] ${
                plan.highlighted
                  ? "border-accent shadow-[0px_0px_0px_1px_rgba(0,112,243,0.15)]"
                  : "border-border"
              }`}
            >
              {plan.highlighted && (
                <div className="mb-[16px] text-[12px] font-medium leading-[16px] text-accent">
                  Most Popular
                </div>
              )}
              <h3 className="text-[24px] font-semibold leading-[32px] tracking-[-0.96px] text-foreground">{plan.name}</h3>
              <p className="mt-[8px] text-[14px] leading-[21px] text-text-secondary">
                {plan.description}
              </p>
              <div className="mt-[24px]">
                <div className="flex items-baseline gap-[4px]">
                  <span className="text-[32px] font-semibold leading-[48px] tracking-[-1.28px] text-foreground">
                    ${billing === "monthly" ? plan.monthly : plan.yearly}
                  </span>
                  <span className="text-[14px] leading-[21px] text-text-muted">
                    /{billing === "monthly" ? "mo" : "yr"}
                  </span>
                </div>
                {billing === "yearly" && (
                  <div className="mt-[4px] text-[14px] leading-[21px] text-text-muted">
                    ${(plan.yearly / 12).toFixed(0)}/mo billed annually
                  </div>
                )}
              </div>
              <ul className="mt-[24px] space-y-[12px]">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-[8px] text-[14px] leading-[21px]"
                  >
                    <svg
                      className="mt-[2px] h-[16px] w-[16px] shrink-0 text-success"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleCheckout(plan.name)}
                disabled={loading === plan.name.toLowerCase()}
                className={`mt-[24px] w-full rounded-[8px] py-[10px] text-[14px] font-medium leading-[20px] transition-colors disabled:opacity-50 ${
                  plan.highlighted
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "border border-border bg-background text-foreground hover:bg-surface"
                }`}
              >
                {loading === plan.name.toLowerCase()
                  ? "Loading..."
                  : "Get Started"}
              </button>
            </div>
          ))}
        </div>

        {/* Lifetime */}
        <div className="mt-[48px] rounded-[16px] border border-accent bg-surface p-[32px]">
          <div className="flex flex-col items-center justify-between gap-[24px] sm:flex-row">
            <div>
              <h3 className="text-[32px] font-semibold leading-[48px] tracking-[-1.28px] text-foreground">Lifetime Access</h3>
              <p className="mt-[8px] text-[16px] leading-[24px] text-text-secondary">
                One-time payment. Access everything forever.
              </p>
              <ul className="mt-[16px] space-y-[8px]">
                {lifetime.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-[8px] text-[14px] leading-[21px]"
                  >
                    <svg
                      className="h-[16px] w-[16px] shrink-0 text-success"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-center">
              <div className="flex items-baseline gap-[4px]">
                <span className="text-[48px] font-semibold leading-[56px] tracking-[-2.88px] text-foreground">${lifetime.price}</span>
              </div>
              <div className="mt-[4px] text-[14px] leading-[21px] text-text-muted">one-time</div>
              <button
                onClick={handleLifetimeCheckout}
                disabled={loading === "lifetime"}
                className="mt-[16px] rounded-[8px] bg-foreground px-[32px] py-[10px] text-[14px] font-medium leading-[20px] text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
              >
                {loading === "lifetime" ? "Loading..." : "Get Lifetime"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
