import Link from "next/link";

export default function CheckoutSuccess({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-[50px] max-w-6xl items-center justify-between px-[16px]">
          <Link href="/" className="text-[24px] font-semibold leading-[32px] tracking-[-0.96px] text-foreground">
            Devigner UI
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-lg px-[16px] py-[48px] text-center">
        <div className="mb-[24px] text-[48px] text-success">&#10003;</div>
        <h1 className="text-[32px] font-semibold leading-[48px] tracking-[-1.28px] text-foreground">Payment Successful!</h1>
        <p className="mt-[16px] text-[16px] leading-[24px] text-text-secondary">
          Thank you for purchasing Devigner UI. Check your email for your
          license key.
        </p>
        <div className="mt-[32px] flex justify-center gap-[16px]">
          <Link
            href="/"
            className="inline-flex h-[44px] items-center justify-center rounded-[8px] bg-foreground px-[32px] text-[14px] font-medium leading-[20px] text-background hover:bg-foreground/90 transition-colors"
          >
            Go to Home
          </Link>
          <Link
            href="/components"
            className="inline-flex h-[44px] items-center justify-center rounded-[8px] border border-border bg-background px-[32px] text-[14px] font-medium leading-[20px] text-foreground hover:bg-surface transition-colors"
          >
            Browse Components
          </Link>
        </div>
      </div>
    </div>
  );
}
