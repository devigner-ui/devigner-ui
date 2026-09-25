import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Thanks for your purchase", robots: { index: false } };

export default function CheckoutSuccess({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="grain-overlay" />

      {/* Nav */}
      <div className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 pt-4">
        <nav className="nav-pill flex h-12 w-full max-w-3xl items-center justify-between rounded-full px-4 bg-background/80 border border-border shadow-elevated">
          <Link href="/" className="flex items-center gap-2 font-semibold text-foreground tracking-tight">
            <span className="flex size-6 items-center justify-center rounded-lg bg-foreground text-[11px] font-bold text-background">D</span>
            <span className="text-sm">Devigner</span>
          </Link>
        </nav>
      </div>

      {/* Content */}
      <section className="relative min-h-dvh flex items-center justify-center">
        <div className="absolute inset-0 mesh-gradient" />
        <div className="relative mx-auto max-w-lg px-5 text-center">
          <div className="inline-flex size-16 items-center justify-center rounded-full bg-success/10 text-3xl text-success mb-6">
            <svg className="size-8" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>

          <h1 className="text-[clamp(1.8rem,4vw,2.5rem)] font-semibold leading-[1.15] tracking-[-0.03em] text-foreground">
            Payment Successful!
          </h1>

          <p className="mt-4 mx-auto max-w-sm text-[15px] leading-relaxed text-text-secondary">
            Thank you for purchasing Devigner UI. Check your email for your
            license key.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-7 text-sm font-medium text-background hover:opacity-90 active:scale-[0.98] transition-all duration-200"
            >
              Go to Home
            </Link>
            <Link
              href="/components"
              className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-background/50 px-7 text-sm font-medium text-foreground hover:bg-surface transition-colors duration-200"
            >
              Browse Components
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
