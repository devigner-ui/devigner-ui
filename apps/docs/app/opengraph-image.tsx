import { getCatalog } from "@/lib/catalog";
import { Accent, Chip, Command, OG, OgCanvas, OgIcon, OgWordmark, Stage, ogImage, ogShot, ogSize } from "@/lib/og";

export const alt = "Beautifully Crafted React Components, Built for Developers. Devigner UI, free for React and Tailwind CSS.";
export const size = ogSize;
export const contentType = "image/png";

/** The hero, then three live previews rising from the bottom edge. */
export default async function Image() {
  const entries = getCatalog();
  // Previews whose content sits high in the stage, so the peek shows UI.
  const shots = (await Promise.all(["date-range-picker", "chart-card", "timeline"].map(ogShot))).filter((s): s is string => !!s);

  return ogImage(
    <OgCanvas>
      <div style={{ position: "absolute", top: 44, left: 56, display: "flex" }}>
        <OgWordmark size={30} />
      </div>
      <div style={{ position: "absolute", top: 50, right: 56, display: "flex", fontFamily: "Geist Mono", fontSize: 18, color: OG.muted }}>
        ui.devigner.cc
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", paddingTop: 92 }}>
        <Chip style={{ gap: 12, height: 40, padding: "0 16px 0 5px", fontSize: 18 }}>
          <span style={{ display: "flex", borderRadius: 999, background: "rgba(90,148,255,0.16)", color: OG.brand, padding: "4px 12px", fontSize: 16 }}>
            New
          </span>
          {entries[0].name}
          <OgIcon name="arrowRight" color={OG.muted} size={17} />
        </Chip>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 24, fontSize: 58, fontWeight: 600, lineHeight: 1.06, letterSpacing: "-0.055em" }}>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            Beautifully&nbsp;<Accent>Crafted</Accent>&nbsp;React Components,
          </div>
          <div style={{ display: "flex" }}>Built for Developers.</div>
        </div>

        <div style={{ display: "flex", gap: 14, marginTop: 30 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              height: 58,
              padding: "0 26px",
              borderRadius: 999,
              background: OG.brand,
              color: OG.brandInk,
              fontSize: 21,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 10px 30px rgba(90,148,255,0.3)",
            }}
          >
            Browse components
            <OgIcon name="arrowRight" color={OG.brandInk} size={20} />
          </div>
          <Command size={21}>
            npx devignerui&nbsp;<span style={{ color: OG.ink }}>init</span>
          </Command>
        </div>
      </div>

      {/* Previews, cut by the bottom edge like the hero window below the fold. */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: -170, display: "flex", justifyContent: "center", gap: 24 }}>
        {shots.map((src, i) => (
          <Stage key={i} src={src} style={{ width: 350, height: 330, marginTop: i === 1 ? 0 : 30 }} />
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 90,
          display: "flex",
          backgroundImage: `linear-gradient(to bottom, rgba(10,12,14,0), ${OG.ground})`,
        }}
      />
    </OgCanvas>,
  );
}
