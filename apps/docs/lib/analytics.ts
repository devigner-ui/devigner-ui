type EventParams = Record<string, string>;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/** Queue GA4 events even if the afterInteractive tag has not loaded yet. */
export function trackEvent(name: string, params: EventParams) {
  const measurementId = process.env.NEXT_PUBLIC_GA_ID;
  if (typeof window === "undefined" || !measurementId) return;
  window.dataLayer = window.dataLayer || [];
  function gtag(..._args: unknown[]) {
    window.dataLayer?.push(arguments);
  }
  gtag("event", name, { ...params, send_to: measurementId });
}

export function trackCommandCopy(command: string) {
  if (command === "npx devignerui init") {
    trackEvent("command_copy", { command_type: "init" });
  } else if (command.startsWith("npx devignerui add ")) {
    trackEvent("command_copy", {
      command_type: "add",
      component_slug: command.slice("npx devignerui add ".length),
    });
  } else if (command.startsWith("npm i ")) {
    trackEvent("command_copy", { command_type: "dependency" });
  }
}
