"use client";

import { IconGlobal, IconSms, IconUser } from "@devigner-ui/icons";
import { ContactLens } from "devignerui";

export const CONTACT_LENS_ITEMS = [
  { label: "Email", icon: <IconSms /> },
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
