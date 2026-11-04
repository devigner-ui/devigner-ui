"use client";

import type * as React from "react";
import { IconGlobal, IconMail, IconUser } from "@devigner-ui/icons";
import { ContactLens } from "devignerui";

export const CONTACT_LENS_ITEMS = [
  { label: "Email", icon: <IconMail /> },
  {
    label: "Website",
    icon: <IconGlobal />,
    text: "devigner.cc",
    copy: "https://devigner.cc",
  },
  { label: "Name", icon: <IconUser />, text: "hello" },
];

export default function ContactLensDemo() {
  return <ContactLens value="hello@devigner.cc" items={CONTACT_LENS_ITEMS} />;
}

/** The preview, with a hint pointing at the icons. It fades out once the
 *  pointer is over the component, so it never sits on top of the lens. */
export function ContactLensPreview(props: React.ComponentProps<typeof ContactLens>) {
  return (
    <div className="group/hint relative">
      <ContactLens {...props} />
      <span
        aria-hidden
        className="pointer-events-none absolute top-full right-1/2 mt-1 mr-10 flex items-start gap-1 font-mono text-[11.5px] text-text-muted transition-opacity duration-300 ease-out select-none group-hover/hint:opacity-0"
      >
        <span className="mt-5 whitespace-nowrap">hover me</span>
        <svg
          viewBox="0 0 40 32"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-10 -scale-y-100"
        >
          <path d="M3 4c10 1 24 4 32 20" />
          <path d="M28 21l7 3 1-7" />
        </svg>
      </span>
    </div>
  );
}
