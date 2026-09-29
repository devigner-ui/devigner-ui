import { getCatalog } from "@/lib/catalog";
import { Accent, Chip, Command, OG, OgCanvas, OgIcon, OgWordmark, Shot, ogImage, ogShot, ogSize } from "@/lib/og";

export const alt = "Beautifully Crafted Animated React Components for Developers. Devigner UI, free for React and Tailwind CSS.";
export const size = ogSize;
export const contentType = "image/png";

/** Fitted whole into their slot along the bottom, no box. */
const ROW = [
  { slug: "file-upload", width: 340 },
  { slug: "chart-card", width: 260 },
  { slug: "date-range-picker", width: 208 },
];

/** Small ones drifting at the edges, out of focus, as if further back. */
const FLOATERS = [
  { slug: "goo-switch", left: 28, top: 150, width: 104, rotate: -10, blur: 1.5 },
  { slug: "inline-time-edit", left: 40, top: 262, width: 116, rotate: 6, blur: 2.5 },
  { slug: "delete-button", left: 1072, top: 124, width: 96, rotate: 9, blur: 1.5 },
  { slug: "magnetic-button", left: 1030, top: 250, width: 150, rotate: -6, blur: 2.5 },
];

/** The hero on top, three live previews below, and small ones floating around it. */
export default async function Image() {
  const entries = getCatalog();
  const [row, floaters] = await Promise.all([
    Promise.all(ROW.map(async (r) => ({ ...r, src: await ogShot(r.slug) }))),
    Promise.all(FLOATERS.map(async (f) => ({ ...f, src: await ogShot(f.slug) }))),
  ]);

  return ogImage(
    <OgCanvas>
      {floaters.map(
        (f) =>
          f.src && (
            <Shot
              key={f.slug}
              src={f.src}
              style={{
                position: "absolute",
                left: f.left,
                top: f.top,
                width: f.width,
                height: f.width,
                opacity: 0.65,
                transform: `rotate(${f.rotate}deg)`,
                filter: `blur(${f.blur}px)`,
              }}
            />
          ),
      )}

      <div style={{ position: "absolute", top: 44, left: 56, display: "flex" }}>
        <OgWordmark size={30} />
      </div>
      <div style={{ position: "absolute", top: 50, right: 56, display: "flex", fontFamily: "Geist Mono", fontSize: 18, color: OG.muted }}>
        ui.devigner.cc
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", paddingTop: 92 }}>
        <Chip style={{ gap: 9, height: 30, padding: "0 12px 0 4px", fontSize: 14 }}>
          <span style={{ display: "flex", borderRadius: 999, background: "rgba(90,148,255,0.16)", color: OG.brand, padding: "2px 9px", fontSize: 12.5 }}>
            New
          </span>
          {entries[0].name}
          <OgIcon name="arrowRight" color={OG.muted} size={13} />
        </Chip>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 20, fontSize: 54, fontWeight: 600, lineHeight: 1.06, letterSpacing: "-0.055em" }}>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            Beautifully&nbsp;<Accent>Crafted</Accent>&nbsp;Animated React
          </div>
          <div style={{ display: "flex" }}>Components for Developers</div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 42,
              padding: "0 18px",
              borderRadius: 999,
              background: OG.brand,
              color: OG.brandInk,
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 24px rgba(90,148,255,0.28)",
            }}
          >
            Browse components
            <OgIcon name="arrowRight" color={OG.brandInk} size={15} />
          </div>
          <Command size={16}>
            npx devignerui&nbsp;<span style={{ color: OG.ink }}>init</span>
          </Command>
        </div>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: 362, height: 240, display: "flex", justifyContent: "center", gap: 40 }}>
        {row.map((r) => r.src && <Shot key={r.slug} src={r.src} style={{ width: r.width, height: 240 }} />)}
      </div>
    </OgCanvas>,
  );
}
