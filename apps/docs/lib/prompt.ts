import { importName } from "./import-name";
import type { ComponentData, PropDef } from "./registry";

/** The choices a prop's type spells out: a string union's literals, or
 *  true/false. Anything else (number, ReactNode, callbacks) is open. */
function options(p: PropDef): string[] | null {
  if (p.type === "boolean") return ["true", "false"];
  const parts = p.type.split("|").map((s) => s.trim());
  return parts.length > 1 && parts.every((s) => /^(["']).*\1$/.test(s)) ? parts : null;
}

function propBlock(p: PropDef) {
  const def = p.default && p.default !== "-" ? `\`${p.default}\`` : "none (leave it out if you don't need it)";
  const opts = options(p)?.filter((o) => o.replace(/["']/g, "") !== p.default.replace(/["']/g, ""));
  return [
    `### \`${p.name}\``,
    p.description,
    `- **Default: ${def}**`,
    `- Other options: ${opts?.length ? opts.map((o) => `\`${o}\``).join(", ") : `any \`${p.type}\``}`,
  ].join("\n");
}

/** A prompt for an AI assistant that installs the component, walks the user
 *  through every prop one question at a time, then writes the code. */
export function buildPrompt(meta: ComponentData) {
  const file = `components/ui/${meta.slug}.tsx`;
  const deps = meta.dependencies.filter((d) => d !== "react");
  return `Help me add the **${meta.name}** component from Devigner UI to my React app. Explain every step in simple, plain words, and wait for my answer whenever you ask me something.

What it is: ${meta.description}

Good for:
${meta.guide.whenToUse.map((s) => `- ${s}`).join("\n")}

Pick something else when:
${meta.guide.whenNotToUse.map((s) => `- ${s}`).join("\n")}

If what I'm building sounds like the second list, tell me before we start.

## Step 1: Install it
Look at my project yourself first: find my package manager from the lockfile (package-lock.json, pnpm-lock.yaml, yarn.lock or bun.lock) and my framework from package.json. Don't ask me. It needs React 18 or 19 and Tailwind CSS v4; if my project doesn't have them, tell me what's missing. Then run these, swapped to my package manager (for example \`pnpm dlx\` and \`pnpm add\`):

\`\`\`sh
npx devignerui init              # only if the project doesn't use Devigner UI yet
npx devignerui add ${meta.slug}${deps.length ? `\nnpm i ${deps.join(" ")}` : ""}
\`\`\`

This creates \`${file}\`. If a command fails, explain the error simply and fix it.

## Step 2: Ask me about each prop
Go through the props below one at a time. For each one, tell me what it does, show the **Default** in bold and the other options, then ask what I want. Tell me at the start that I can answer with these words:
- "default" keeps the default and leaves the prop out of the code
- "skip" leaves the prop out
- "all defaults" skips every question that's left
- "explain" gives me an example of what the prop changes

${meta.props.map(propBlock).join("\n\n")}

## Step 3: Write the code
Start from this example and change it to match my answers:

\`\`\`tsx
import { ${importName(meta)} } from "@/${file.replace(/\.tsx$/, "")}";

${meta.usage}
\`\`\`

Show me the finished code, tell me exactly which file to paste it into, and what I should see on the screen when it works.`;
}

const q = (s: string) => encodeURIComponent(s);

/** Chat apps that open with a prompt already typed in: the desktop app's
 *  own link when it has one, the web chat otherwise. v0 has no desktop app. */
export const PROMPT_TARGETS = [
  {
    name: "Claude",
    app: (p: string) => `claude://claude.ai/new?q=${q(p)}`,
    url: (p: string) => `https://claude.ai/new?q=${q(p)}`,
  },
  {
    name: "Codex",
    // Fills the chat box without sending it.
    app: (p: string) => `codex://new?prompt=${q(p)}`,
    url: (p: string) => `https://chatgpt.com/?q=${q(p)}`,
  },
  { name: "v0", app: null, url: (p: string) => `https://v0.app/chat?q=${q(p)}` },
] as const;

/** How long to wait for the desktop app to take focus before falling back
 *  to the web chat. Inside the click's user activation window, so the
 *  fallback tab is not treated as a popup. */
const APP_WAIT_MS = 900;

/** Tries the desktop app; if the page never loses focus (no app took the
 *  link, and no "Open app?" prompt showed), opens the web chat instead.
 *  ponytail: browsers can't ask whether an app is installed, so this is the
 *  usual focus heuristic; a denied "Open app?" prompt counts as installed. */
export function openTarget(t: (typeof PROMPT_TARGETS)[number], prompt: string) {
  const web = () => window.open(t.url(prompt), "_blank", "noopener");
  if (!t.app) return web();
  let left = false;
  const away = () => {
    left = true;
  };
  const onVisibility = () => document.hidden && away();
  window.addEventListener("blur", away);
  document.addEventListener("visibilitychange", onVisibility);
  window.location.href = t.app(prompt);
  setTimeout(() => {
    window.removeEventListener("blur", away);
    document.removeEventListener("visibilitychange", onVisibility);
    if (!left) web();
  }, APP_WAIT_MS);
}
