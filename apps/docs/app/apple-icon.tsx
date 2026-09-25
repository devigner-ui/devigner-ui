import { LogoMark } from "@/components/logo-mark";
import { OG, OG_LOGO, ogImage } from "@/lib/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// The logo mark on the dark ground, full bleed: iOS rounds the corners itself.
export default function AppleIcon() {
  return ogImage(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: OG.ground,
      }}
    >
      <LogoMark {...OG_LOGO} style={{ width: 138, height: 120 }} />
    </div>,
    size,
  );
}
