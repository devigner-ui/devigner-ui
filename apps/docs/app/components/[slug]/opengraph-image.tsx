import { getCatalog } from "@/lib/catalog";
import { Accent, Chip, Command, OG, OgCanvas, OgIcon, OgWordmark, Stage, ogImage, ogShot, ogSize } from "@/lib/og";

export const alt = "A Devigner UI component: free for React and Tailwind CSS.";
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return getCatalog().map((e) => ({ slug: e.slug }));
}

/** Name and install command on the left, the live preview on the right. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getCatalog().find((e) => e.slug === slug);
  const name = entry?.name ?? "Component";
  const words = name.split(" ");
  const last = words.pop();
  const shot = await ogShot(slug);

  return ogImage(
    <OgCanvas glowAt="25% 0%">
      <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "44px 0 56px 56px", width: 600 }}>
        <Chip style={{ alignSelf: "flex-start", height: 52, padding: "0 22px", gap: 14, fontSize: 19, background: "rgba(255,255,255,0.04)" }}>
          <OgWordmark size={24} />
          <span style={{ width: 1, height: 20, background: OG.lineStrong }} />
          Components
          <OgIcon name="chevronRight" color={OG.muted} size={16} />
          <span style={{ color: OG.ink }}>{name}</span>
        </Chip>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: "Geist Mono", fontSize: 19, color: OG.muted }}>
            {entry?.categoryLabel.toLowerCase()}
            {entry?.isNew && (
              <span style={{ display: "flex", borderRadius: 999, border: "1px solid rgba(90,148,255,0.35)", background: "rgba(90,148,255,0.1)", color: OG.brand, padding: "2px 10px", fontSize: 14, letterSpacing: "0.06em" }}>
                NEW
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", marginTop: 16, fontSize: name.length > 14 ? 74 : 84, fontWeight: 600, lineHeight: 1.04, letterSpacing: "-0.055em" }}>
            {words.length > 0 && <span>{words.join(" ")}&nbsp;</span>}
            <Accent>{last}</Accent>
          </div>
          {entry && (
            <div style={{ display: "flex", marginTop: 20, maxWidth: 500, fontSize: 24, lineHeight: 1.45, color: OG.secondary }}>
              {entry.description}
            </div>
          )}
        </div>

        <Command size={19}>
          npx devignerui add&nbsp;<span style={{ color: OG.ink }}>{slug}</span>
        </Command>
      </div>

      {shot && <Stage src={shot} style={{ position: "absolute", top: 64, right: -40, width: 600, height: 502 }} />}
    </OgCanvas>,
  );
}
