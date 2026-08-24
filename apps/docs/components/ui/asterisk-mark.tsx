import { cn } from "@/lib/utils";

type AsteriskMarkProps = {
  /**
   * Ring copy revealed on hover. Omit to render the spinning mark alone.
   * Hover is driven by the nearest `group/asterisk` ancestor, not by the mark
   * itself — the wordmark it trails is the target, the mark is too small to aim at.
   */
  ringText?: string;
  /** Only needed if two marks with rings share a page — SVG path ids must be unique. */
  ringPathId?: string;
  className?: string;
};

export function AsteriskMark({
  ringText,
  ringPathId = "asterisk-ring-path",
  className,
}: AsteriskMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("relative inline-block aspect-square", className)}
    >
      <span className="ease-out block h-full w-full transition-transform duration-300 group-hover/asterisk:scale-[0.65]">
        <svg
          viewBox="0 0 597.45 594.55"
          className="block h-full w-full animate-spin fill-current [animation-duration:10s] motion-reduce:animate-none"
        >
          <polygon points="320.51 298.54 276.95 298.54 246.95 0 350.51 0 320.51 298.54" />
          <polygon points="317.09 285.5 281.85 311.1 82.1 87.21 165.88 26.34 317.09 285.5" />
          <polygon points="306.66 276.96 293.2 318.38 0 254.66 32 156.17 306.66 276.96" />
          <polygon points="293.2 276.17 306.66 317.6 32 438.38 0 339.9 293.2 276.17" />
          <polygon points="281.85 283.45 317.09 309.06 165.88 568.21 82.1 507.34 281.85 283.45" />
          <polygon points="276.95 296.01 320.51 296.01 350.51 594.55 246.95 594.55 276.95 296.01" />
          <polygon points="280.37 309.06 315.6 283.45 515.35 507.34 431.57 568.21 280.37 309.06" />
          <polygon points="290.8 317.6 304.26 276.17 597.45 339.9 565.45 438.38 290.8 317.6" />
          <polygon points="304.26 318.38 290.8 276.96 565.45 156.17 597.45 254.66 304.26 318.38" />
          <polygon points="315.6 311.1 280.37 285.5 431.57 26.34 515.35 87.21 315.6 311.1" />
        </svg>
      </span>

      {ringText && (
        <svg
          viewBox="0 0 100 100"
          className="ease-out pointer-events-none absolute inset-0 h-full w-full animate-spin opacity-0 transition-opacity duration-300 [animation-duration:25s] [animation-play-state:paused] group-hover/asterisk:opacity-100 group-hover/asterisk:[animation-play-state:running] motion-reduce:animate-none"
        >
          <defs>
            {/* Two arcs, not a <circle>: a path is what <textPath> can follow. */}
            <path
              id={ringPathId}
              fill="none"
              d="M 50, 50 m -43.5, 0 a 43.5,43.5 0 1,1 87,0 a 43.5,43.5 0 1,1 -87,0"
            />
          </defs>
          <text
            fill="currentColor"
            fontSize="12"
            fontWeight="700"
            letterSpacing="2.1"
            dominantBaseline="middle"
            className="font-sans"
          >
            <textPath href={`#${ringPathId}`}>{ringText}</textPath>
          </text>
        </svg>
      )}
    </span>
  );
}
