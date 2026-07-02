// Vermilion burst mark — the recurring brand glyph, lifted from remidevigner.pro.
// Rays are rounded rects radiating from center; colored via currentColor.
export function Starburst({
  className,
  rays = 12,
  ref,
}: {
  className?: string;
  rays?: number;
  ref?: React.Ref<SVGSVGElement>;
}) {
  return (
    <svg
      ref={ref}
      viewBox="0 0 100 100"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      {Array.from({ length: rays }).map((_, i) => (
        <rect
          key={i}
          x="46.5"
          y="4"
          width="7"
          height="42"
          rx="3.5"
          transform={`rotate(${(360 / rays) * i} 50 50)`}
        />
      ))}
    </svg>
  );
}
