import Link from "next/link";
import { IconAdd } from "@devigner-ui/icons";

/** The corner pill on pages without the board: a way to the requests page,
 *  whose own "Request a component" button morphs into the form. A round
 *  icon at rest, so it stays out of the content's way; hover or keyboard
 *  focus widens it and the label comes out of a blur. The label is always in
 *  the DOM, so it stays the link's accessible name while hidden. */
export function RequestFab() {
  return (
    <Link
      href="/requests"
      className="group fixed right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 inline-flex h-12 items-center rounded-full bg-foreground px-3.75 text-[14.5px] font-medium whitespace-nowrap text-background shadow-elevated transition-transform duration-150 ease-out active:scale-[0.97] sm:right-6 sm:bottom-6"
    >
      <IconAdd aria-hidden className="size-4.5 shrink-0" />
      {/* ponytail: max-width, not the 0fr grid trick (a shrink-to-fit parent
          sizes a 0fr track to its content). The cap sits just over the
          label's width (~160px); resize it if the label changes. */}
      <span className="max-w-0 overflow-hidden transition-[max-width] duration-300 ease-out group-hover:max-w-44 group-focus-visible:max-w-44 motion-reduce:transition-none">
        {/* Leaves at once so the shell can close over it; arrives a beat
            after the shell starts to open. */}
        <span className="block pr-1 pl-2 opacity-0 blur-sm transition-[opacity,filter] duration-200 ease-out group-hover:opacity-100 group-hover:blur-none group-hover:delay-75 group-focus-visible:opacity-100 group-focus-visible:blur-none group-focus-visible:delay-75 motion-reduce:transition-none">
          Request a component
        </span>
      </span>
    </Link>
  );
}
