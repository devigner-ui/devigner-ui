// Shared by the OG images and the apple icon. next/og can't read CSS
// variables or oklch(), so the dark palette is baked in as hex (converted
// from the .dark tokens in app/globals.css - keep in step when retuning).
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const OG = {
  ground: "#0a0c0e", // --background
  raised: "#0e1013", // --background-100
  surface: "#131519", // --background-200
  ink: "#eff0f2", // --foreground
  secondary: "#b2b4b8", // --text-secondary
  muted: "#83868c", // --text-muted
  brand: "#5a94ff", // --brand
  brandInk: "#070b14", // --brand-foreground
  line: "rgba(239,240,242,0.09)", // --border
  lineStrong: "rgba(239,240,242,0.16)",
  glow: "rgba(90,148,255,0.2)", // --glow, a touch stronger at thumbnail size
};

/** The logo mark's dark-theme fills (--logo-* in globals.css): white tile. */
export const OG_LOGO = { tile: "#fff", ink: "#151922", dot: "#365ee9" };

export const ogSize = { width: 1200, height: 630 };

const asset = (...p: string[]) => readFile(join(process.cwd(), "assets", ...p));

export async function ogImage(node: React.ReactElement, size: { width: number; height: number } = ogSize) {
  const [sans, sansBold, mono, accent, display] = await Promise.all([
    asset("fonts", "geist-400.ttf"),
    asset("fonts", "geist-600.ttf"),
    asset("fonts", "geist-mono-400.woff"),
    asset("fonts", "mazius-display-700-italic.ttf"),
    asset("fonts", "bricolage-grotesque-700.woff"),
  ]);
  return new ImageResponse(node, {
    ...size,
    fonts: [
      { name: "Geist", data: sans, weight: 400, style: "normal" },
      { name: "Geist", data: sansBold, weight: 600, style: "normal" },
      { name: "Geist Mono", data: mono, weight: 400, style: "normal" },
      { name: "Mazius", data: accent, weight: 700, style: "italic" },
      { name: "Bricolage", data: display, weight: 700, style: "normal" },
    ],
  });
}

/** A component preview captured by scripts/og-shots.mjs, as a data URL; null
 *  until that script has been run for the slug. */
export async function ogShot(slug: string) {
  try {
    return `data:image/png;base64,${(await asset("og", `${slug}.png`)).toString("base64")}`;
  } catch {
    return null;
  }
}

/** @devigner-ui/icons glyphs (Outline), paths copied verbatim: the package is
 *  "use client", so a server-rendered image can't call its components. */
const ICONS = {
  arrowRight: [
    { d: "M4 11.25a.75.75 0 0 0 0 1.5zm0 1.5h16v-1.5H4z", fill: true },
    { d: "m14 6 6 6-6 6", round: true },
  ],
  copy: [
    { d: "M6 11c0-2.83 0-4.24.88-5.12S9.18 5 12 5h3c2.83 0 4.24 0 5.12.88S21 8.18 21 11v5c0 2.83 0 4.24-.88 5.12S17.82 22 15 22h-3c-2.83 0-4.24 0-5.12-.88S6 18.82 6 16z" },
    { d: "M6 19a3 3 0 0 1-3-3v-6c0-3.77 0-5.66 1.17-6.83S7.23 2 11 2h4a3 3 0 0 1 3 3" },
  ],
  chevronRight: [{ d: "m9 5 6 7-6 7", round: true }],
} satisfies Record<string, { d: string; fill?: boolean; round?: boolean }[]>;

export function OgIcon({ name, color, size }: { name: keyof typeof ICONS; color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {ICONS[name].map((p: { d: string; fill?: boolean; round?: boolean }) =>
        p.fill ? (
          <path key={p.d} d={p.d} fill={color} />
        ) : (
          <path key={p.d} d={p.d} stroke={color} strokeWidth="1.5" strokeLinecap={p.round ? "round" : undefined} strokeLinejoin={p.round ? "round" : undefined} />
        ),
      )}
    </svg>
  );
}

/** "devigner." as the navbar sets it, the period in cobalt. */
export function OgWordmark({ size = 30 }: { size?: number }) {
  return (
    <div style={{ display: "flex", fontFamily: "Bricolage", fontSize: size, lineHeight: 1, letterSpacing: "-0.045em", color: OG.ink }}>
      devigner<span style={{ color: OG.brand }}>.</span>
    </div>
  );
}

/** The one emphasized word in a title (.accent-word). */
export function Accent({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontFamily: "Mazius", fontStyle: "italic", fontWeight: 700, fontSize: "1.1em", letterSpacing: "-0.01em", color: OG.brand, padding: "0 0.06em" }}>
      {children}
    </span>
  );
}

/** A rounded chip: border, faint fill, 1px top highlight. */
export function Chip({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        borderRadius: 999,
        border: `1px solid ${OG.line}`,
        background: "rgba(255,255,255,0.03)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
        color: OG.secondary,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** "$ npx devignerui <cmd>" with the copy glyph, as the site's command pill. */
export function Command({ children, size = 22 }: { children: React.ReactNode; size?: number }) {
  return (
    <Chip style={{ alignSelf: "flex-start", gap: size * 0.6, height: size * 2.7, padding: `0 ${size * 1.1}px`, fontFamily: "Geist Mono", fontSize: size, color: OG.secondary, background: OG.raised }}>
      <span style={{ color: OG.brand }}>$</span>
      <span style={{ display: "flex" }}>{children}</span>
      <div style={{ display: "flex", marginLeft: size * 0.6 }}>
        <OgIcon name="copy" color={OG.muted} size={size * 1.05} />
      </div>
    </Chip>
  );
}

/** A captured preview in a rounded stage, like a catalog card. */
export function Stage({ src, style }: { src: string; style: React.CSSProperties }) {
  return (
    <div
      style={{
        display: "flex",
        overflow: "hidden",
        borderRadius: 22,
        border: `1px solid ${OG.lineStrong}`,
        background: OG.raised,
        boxShadow: "0 30px 80px rgba(0,0,0,0.55), 0 0 0 6px rgba(255,255,255,0.02)",
        ...style,
      }}
    >
      <img alt="" src={src} style={{ width: "100%", height: "100%", padding: 20, objectFit: "contain" }} />
    </div>
  );
}

/** A shot straight on the ground, no box: fitted into `style`'s area and
 *  scaled up when the component is smaller than it. */
export function Shot({ src, style }: { src: string; style: React.CSSProperties }) {
  return (
    <div style={{ display: "flex", ...style }}>
      <img alt="" src={src} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
    </div>
  );
}

/** 1200 by 630 dark ground: cobalt glow from the top, a dot field fading out. */
export function OgCanvas({ children, glowAt = "50% 0%" }: { children: React.ReactNode; glowAt?: string }) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        background: OG.ground,
        color: OG.ink,
        fontFamily: "Geist",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          backgroundImage: "radial-gradient(rgba(239,240,242,0.07) 1.2px, transparent 1.2px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          backgroundImage: `radial-gradient(ellipse 75% 85% at ${glowAt}, transparent 20%, ${OG.ground} 75%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          backgroundImage: `radial-gradient(ellipse 60% 70% at ${glowAt}, ${OG.glow}, transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
}
