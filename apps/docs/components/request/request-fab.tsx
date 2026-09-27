import Link from "next/link";
import { IconAdd } from "@devigner-ui/icons";

/** The corner pill on pages without the board: a way to the requests page,
 *  whose own "Request a component" button morphs into the form. */
export function RequestFab() {
  return (
    <Link
      href="/requests"
      className="fixed right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 inline-flex h-12 items-center gap-2 rounded-full bg-foreground pr-5 pl-4 text-[14.5px] font-medium whitespace-nowrap text-background shadow-elevated transition-transform duration-150 ease-out active:scale-[0.97] sm:right-6 sm:bottom-6"
    >
      <IconAdd aria-hidden className="size-4.5" />
      Request a component
    </Link>
  );
}
