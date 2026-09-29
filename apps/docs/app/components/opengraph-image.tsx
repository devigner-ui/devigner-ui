import { getCatalog } from "@/lib/catalog";
import { Accent, Chip, Command, OG, OgCanvas, OgWordmark, Stage, ogImage, ogShot, ogSize } from "@/lib/og";

export const alt = "Animated React Components. Devigner UI, free for React and Tailwind CSS.";
export const size = ogSize;
export const contentType = "image/png";

/** The catalog header on the left, a tilted wall of live previews on the right. */
export default async function Image() {
  const entries = getCatalog();
  const shots = (await Promise.all(entries.map((e) => ogShot(e.slug)))).filter((s): s is string => !!s);
  const columns = [shots.filter((_, i) => i % 2 === 0), shots.filter((_, i) => i % 2 === 1)];

  return ogImage(
    <OgCanvas glowAt="20% 0%">
      <div style={{ position: "absolute", top: -60, left: 660, display: "flex", gap: 20, transform: "rotate(-8deg)" }}>
        {columns.map((col, c) => (
          <div key={c} style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: c * 90 }}>
            {col.map((src, i) => (
              <Stage key={i} src={src} style={{ width: 330, height: 220 }} />
            ))}
          </div>
        ))}
      </div>
      {/* Fade the wall into the ground behind the copy. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          backgroundImage: `linear-gradient(to right, ${OG.ground} 44%, rgba(10,12,14,0.6) 60%, rgba(10,12,14,0) 78%)`,
        }}
      />

      <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "44px 56px 56px", width: 720 }}>
        <OgWordmark size={30} />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <Chip style={{ alignSelf: "flex-start", height: 40, padding: "0 16px", gap: 12, fontSize: 18 }}>
            <span style={{ color: OG.ink }}>{entries.length} components</span>
            <span style={{ width: 1, height: 16, background: OG.lineStrong }} />
            Newest: {entries[0].name}
          </Chip>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 26, fontSize: 84, fontWeight: 600, lineHeight: 1.02, letterSpacing: "-0.055em" }}>
            <div style={{ display: "flex" }}>Animated React</div>
            <div style={{ display: "flex" }}>
              <Accent>Components</Accent>
            </div>
          </div>
          <div style={{ display: "flex", marginTop: 24, maxWidth: 560, fontSize: 25, lineHeight: 1.45, color: OG.secondary }}>
            Free and animated. Try each one live, then install it with one command.
          </div>
        </div>

        <Command size={20}>
          npx devignerui&nbsp;<span style={{ color: OG.ink }}>init</span>
        </Command>
      </div>
    </OgCanvas>,
  );
}
