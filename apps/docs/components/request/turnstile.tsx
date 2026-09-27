"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "../theme-provider";

/** Cloudflare Turnstile, the bot check on the request form. Renders nothing
 *  until NEXT_PUBLIC_TURNSTILE_SITE_KEY is set, so the form works before
 *  setup. The widget writes its token into a hidden `cf-turnstile-response`
 *  input inside the form, which the API route verifies. */

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
export const turnstileEnabled = !!SITE_KEY;

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loading: Promise<TurnstileApi> | null = null;
function load() {
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject());
    s.onerror = () => {
      loading = null;
      reject(new Error("Turnstile failed to load"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

/** `attempt` changes after every send: a token is single use, so the widget
 *  is rendered fresh for the next try. */
export function Turnstile({ attempt }: { attempt: number }) {
  const box = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!SITE_KEY || !box.current) return;
    let id: string | undefined;
    let gone = false;
    load()
      .then((ts) => {
        if (gone || !box.current) return;
        id = ts.render(box.current, {
          sitekey: SITE_KEY,
          theme: theme === "dark" ? "dark" : "light",
          // Invisible unless Cloudflare actually wants an interaction.
          appearance: "interaction-only",
          action: "component-request",
        });
      })
      .catch(() => {});
    return () => {
      gone = true;
      if (id) window.turnstile?.remove(id);
    };
  }, [attempt, theme]);

  if (!SITE_KEY) return null;
  return <div ref={box} className="empty:hidden" />;
}
