import { cn } from "cn";

const SIZES = {
  /** Beside a name in a list row. */
  sm: "h-4.5 px-2 text-[10px]",
  /** Inside a pill or on a card. */
  md: "h-6 px-2.5 text-[12px]",
  /** Beside a page title. */
  lg: "h-6.5 px-2.5 text-[12.5px]",
};

/** The one New badge: a dark pill glowing blue at the rim (see `badge-new`). */
export function NewBadge({
  size = "md",
  className,
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "badge-new inline-flex shrink-0 items-center rounded-full leading-none font-semibold tracking-[0.01em]",
        SIZES[size],
        className,
      )}
    >
      New
    </span>
  );
}
