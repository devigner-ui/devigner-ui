"use client";

import {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
  useCallback,
  useId,
} from "react";

type Theme = "light" | "dark";

/** Screen-space point the circle reveal expands from. Omit it and the
 *  reveal starts from the viewport centre instead of a specific control. */
type Origin = { x: number; y: number };

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: (origin?: Origin) => void;
}

/** Document with the (still-experimental) View Transitions API - not yet in
 *  every browser's lib.dom types, so this is typed by hand rather than cast
 *  away with `any` at every call site. */
type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => { finished: Promise<void> };
};

const THEME_VT_STYLE_ID = "devignerui-theme-vt-style";
const THEME_VT_ATTR = "circle";

/** Injected once, globally: the actual reveal animation. Runs as a native
 *  View Transition rather than a Motion spring - Motion animates React's
 *  render output, and this has to animate a screenshot of the *entire old
 *  page* peeling back to reveal the new one underneath, which only the
 *  browser's own view-transition pseudo-elements can do. `--ease-in-out`
 *  keeps it on the shared curve tokens rather than an ad-hoc cubic-bezier. */
const THEME_VT_CSS = `
html[data-theme-vt="${THEME_VT_ATTR}"]::view-transition-old(root) {
  animation: none;
  mix-blend-mode: normal;
}
html[data-theme-vt="${THEME_VT_ATTR}"]::view-transition-new(root) {
  animation: devignerui-theme-vt-reveal 700ms var(--ease-in-out);
  mix-blend-mode: normal;
}
@keyframes devignerui-theme-vt-reveal {
  from {
    clip-path: circle(0% at var(--theme-vt-x, 50%) var(--theme-vt-y, 50%));
  }
  to {
    clip-path: circle(150% at var(--theme-vt-x, 50%) var(--theme-vt-y, 50%));
  }
}
`;

function injectThemeTransitionStyle() {
  if (document.getElementById(THEME_VT_STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = THEME_VT_STYLE_ID;
  el.textContent = THEME_VT_CSS;
  document.head.appendChild(el);
}

/** Runs `apply` (the actual theme flip) inside a View Transition that reveals
 *  the new theme through a circle expanding from `origin`. No blur: it
 *  smeared the toggle's own sun-to-moon animation. Falls
 *  back to an instant, unanimated swap when the browser has no View
 *  Transitions support or the user has asked for reduced motion - there is
 *  no fallback animation to design for either case, just no animation. */
function runThemeTransition(origin: Origin | undefined, apply: () => void) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const doc = document as DocumentWithViewTransition;

  if (reduce || !doc.startViewTransition) {
    apply();
    return;
  }

  const { x, y } = origin ?? {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };
  const root = document.documentElement;
  root.style.setProperty("--theme-vt-x", `${x}px`);
  root.style.setProperty("--theme-vt-y", `${y}px`);
  root.dataset.themeVt = THEME_VT_ATTR;

  const transition = doc.startViewTransition(apply);
  transition.finished.finally(() => {
    delete root.dataset.themeVt;
  });
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: "light" as Theme,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
}

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    injectThemeTransitionStyle();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("devignerui-theme") as Theme | null;
    const initial = stored || getSystemTheme();
    setThemeState(initial);
    applyTheme(initial);
    setMounted(true);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("devignerui-theme")) {
        const newTheme = e.matches ? "dark" : "light";
        setThemeState(newTheme);
        applyTheme(newTheme);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("devignerui-theme", newTheme);
  }, []);

  const toggleTheme = useCallback(
    (origin?: Origin) => {
      const next = theme === "dark" ? "light" : "dark";
      runThemeTransition(origin, () => setTheme(next));
    },
    [theme, setTheme],
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="size-9 rounded-full border border-border" />;
  }

  return (
    <button
      ref={buttonRef}
      onClick={() => {
        const rect = buttonRef.current?.getBoundingClientRect();
        toggleTheme(
          rect && { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
        );
      }}
      data-dark={theme === "dark"}
      className="group relative cursor-pointer inline-flex size-9 items-center justify-center rounded-full border border-border text-foreground transition-colors duration-200 ease-out hover:bg-surface-hover"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <ThemeIcon />
    </button>
  );
}

// Sun to moon (the toggles.dev "Spin" toggle), keyed off the button's
// data-dark instead of a dark: variant. The core's clip path swaps shape
// (CSS d:path, with a translate fallback where d isn't animatable) while the
// rays spin and scale out around the centre. Timing uses the shared ease-out token.
const RAYS = [
  "M12 1.4v2.4",
  "m20.3 3.7-2.5 2.5",
  "M22.6 12h-2.4",
  "M12 22.6v-2.4",
  "M1.4 12h2.4",
  "m20.3 20.3-2.5-2.5",
  "m3.7 20.3 2.5-2.5",
  "m3.7 3.7 2.5 2.5",
];

export function ThemeIcon() {
  const clip = `theme-icon-${useId()}`;
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4.5 [--dur:400ms]">
      <defs>
        <clipPath id={clip}>
          <path
            d="M0 0h25a1 1 0 0010 10v14H0Z"
            className="motion-safe:transition-[d,translate] motion-safe:duration-(--dur) motion-safe:ease-out motion-safe:group-data-[dark=true]:delay-[calc(var(--dur)*0.15)] group-data-[dark=true]:[d:path('M0_2h13a1_1_0_0010_10v14H0Z')] group-data-[dark=true]:not-supports-[d:path('M0_0')]:-translate-x-3.25 group-data-[dark=true]:not-supports-[d:path('M0_0')]:translate-y-0.5"
          />
        </clipPath>
      </defs>
      <g stroke="currentColor" strokeLinecap="round">
        <circle
          cx={12}
          cy={12}
          r={5}
          fill="currentColor"
          clipPath={`url(#${clip})`}
          className="origin-center motion-safe:transition-transform motion-safe:duration-(--dur) motion-safe:ease-out group-data-[dark=true]:scale-170"
        />
        {RAYS.map((d) => (
          <path
            key={d}
            d={d}
            fill="none"
            strokeWidth={2}
            strokeLinejoin="round"
            className="origin-center transform-view motion-safe:transition-transform motion-safe:delay-[calc(var(--dur)*0.15)] motion-safe:duration-(--dur) motion-safe:ease-out motion-safe:group-data-[dark=true]:delay-0 group-data-[dark=true]:rotate-45 group-data-[dark=true]:scale-0"
          />
        ))}
      </g>
    </svg>
  );
}
