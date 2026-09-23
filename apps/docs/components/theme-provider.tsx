"use client";

import {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
  useCallback,
} from "react";

type Theme = "light" | "dark";

/** Screen-space point the circle-blur reveal expands from. Omit it and the
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
const THEME_VT_ATTR = "circle-blur";

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
    filter: blur(8px);
  }
  to {
    clip-path: circle(150% at var(--theme-vt-x, 50%) var(--theme-vt-y, 50%));
    filter: blur(0px);
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
 *  the new theme through a blurred circle expanding from `origin`. Falls
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
      className="relative inline-flex size-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-surface-hover"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <svg
          className="size-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
          />
        </svg>
      ) : (
        <svg
          className="size-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
          />
        </svg>
      )}
    </button>
  );
}
