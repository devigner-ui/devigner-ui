/** The Devigner logo mark. Fills come from --logo-* in globals.css, so the
 *  light and dark versions of the mark follow the theme scope it sits in.
 *  next/og can't read CSS variables, so the OG images pass hex fills. */
export function LogoMark({
  className,
  style,
  tile = "var(--logo-tile)",
  ink = "var(--logo-ink)",
  dot = "var(--logo-dot)",
}: {
  className?: string;
  style?: React.CSSProperties;
  tile?: string;
  ink?: string;
  dot?: string;
}) {
  return (
    <svg aria-hidden viewBox="0 0 23 20" fill="none" className={className} style={style}>
      <path
        fill={tile}
        d="M10.963 19.264q-5.535 0-8.302-2.341Q0 14.58 0 9.685q0-5.002 2.66-7.343Q5.429 0 10.964 0q5.64 0 8.408 2.342 2.767 2.34 2.767 7.343 0 9.58-11.176 9.58"
      />
      <path
        fill={ink}
        d="M7.199 15.946q-1.253 0-2.204-.627-.93-.646-1.463-1.824Q3 12.298 3 10.645q0-1.52.456-2.698t1.349-1.843q.912-.684 2.242-.684.95 0 1.596.342.664.342 1.102 1.026.437.684.703 1.729h.475l-.247-1.216q-.115-.59-.19-1.083a8 8 0 0 1-.057-.893V2h3.078v13.68h-2.508l-.038-2.964h-.418q-.21 1.14-.665 1.862a2.77 2.77 0 0 1-1.121 1.045q-.665.323-1.558.323m1.102-2.47q.59 0 .988-.247.418-.266.665-.665t.361-.855.114-.855v-.399q0-.36-.095-.722a3 3 0 0 0-.285-.703 2.3 2.3 0 0 0-.437-.608 1.9 1.9 0 0 0-.627-.418 1.85 1.85 0 0 0-.76-.152q-.627 0-1.083.342-.437.342-.684.969-.228.627-.228 1.482t.247 1.501q.247.627.722.988.475.342 1.102.342"
      />
      <path
        fill={dot}
        d="M16.934 15.944q-1.226 0-1.838-.518-.59-.519-.59-1.602 0-1.108.59-1.626.612-.519 1.837-.518 1.249 0 1.862.518.612.518.612 1.626 0 2.12-2.474 2.12"
      />
    </svg>
  );
}
