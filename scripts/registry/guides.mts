// Written guidance for every component page, kept next to the descriptors so
// the registry, the docs pages and llms-full.txt all read one source. Every
// claim here is taken from the component's source: when a behavior changes,
// change the matching line. Recipes are complete modules and are type-checked
// by `pnpm registry:fixtures`, so a stale example fails CI.

export interface GuideRecipe {
  title: string;
  description: string;
  code: string;
}

export interface GuideQuestion {
  question: string;
  answer: string;
}

export interface ComponentGuide {
  /** One or two sentences: what the live demo on the page shows. */
  demo: string;
  whenToUse: string[];
  whenNotToUse: string[];
  /** [keys, what they do]. */
  keyboard: [string, string][];
  accessibility: string[];
  theming: string[];
  edgeCases: string[];
  recipes: GuideRecipe[];
  troubleshooting: GuideQuestion[];
}

/** Shared by every component: the tokens and the dark class. */
const TOKENS_MISSING: GuideQuestion = {
  question: "The component renders with no background or the wrong colors.",
  answer:
    "Colors use the standard shadcn/ui tokens only (background, foreground, primary, secondary, muted, accent, border, input, ring, destructive), so a project set up with shadcn/ui needs nothing extra and the component follows its theme, dark mode included. Without shadcn/ui, define those CSS variables for :root and .dark and map them in your Tailwind v4 @theme, or run npx shadcn init.",
};

const REDUCED_MOTION =
  "Honors prefers-reduced-motion and an ancestor <MotionConfig reducedMotion=\"always\">, so an in-app motion switch works too.";

export const guides = {
  "magnetic-button": {
    demo:
      "The live demo is a gradient Get started button. Move the pointer near it and the pill leans toward the cursor while the label drifts and tilts a little further, then both spring back with a wobble when the pointer leaves the field.",
    whenToUse: [
      "One primary call to action per view, such as a hero or pricing button, where a bit of playful physics earns attention.",
      "A link that should feel like a button, via href, including external links (target=\"_blank\" gets rel=\"noopener noreferrer\" added for you).",
    ],
    whenNotToUse: [
      "Dense toolbars, forms or lists of buttons: several magnetic fields next to each other compete for the cursor.",
      "Destructive actions. Use Delete Button, which asks for confirmation.",
    ],
    keyboard: [
      ["Tab", "Focuses the button or link. A focus ring is drawn on the visible pill."],
      ["Enter / Space", "Activates it, like any native button (Enter only for the link form)."],
    ],
    accessibility: [
      "Renders a real <button type=\"button\"> or <a>, so screen readers announce the right role and the label is the children you pass.",
      "The magnetic field is invisible padding cancelled by a negative margin: the hit area grows without moving the layout.",
      "Disabled links get aria-disabled, lose their href and are removed from the tab order.",
      REDUCED_MOTION,
    ],
    theming: [
      "className styles the visible pill, not the invisible field, so backgrounds, rounding and padding go there.",
      "Defaults use bg-secondary and text-foreground, and the focus ring uses ring-ring.",
      "strength and labelStrength are 0 to 10 dials. A different value for each gives the parallax between pill and label.",
    ],
    edgeCases: [
      "The pull only runs on devices with a fine pointer that can hover, so touch screens get a plain button.",
      "field is the radius in px of the attraction zone. Set it to 0 to turn the magnet off while keeping the button.",
      "The field's negative margin can overlap nearby elements. Give the button enough room, or lower field, when it sits inside a tight container.",
    ],
    recipes: [
      {
        title: "External link with a softer pull",
        description: "Lower strength for a subtle lean, and pass href to render a link.",
        code: `import { MagneticButton } from "@/components/ui/magnetic-button";

export function DocsLink() {
  return (
    <MagneticButton href="https://github.com" target="_blank" strength={2} labelStrength={3}>
      View on GitHub
    </MagneticButton>
  );
}`,
      },
    ],
    troubleshooting: [
      {
        question: "The button does not move toward the cursor.",
        answer:
          "Check that reduced motion is off in the OS and in any MotionConfig above it, that the device has a mouse or trackpad, that disabled is not set, and that field is above 0. GSAP must be installed (npm i gsap).",
      },
      {
        question: "Clicks near the button hit it instead of the element next to it.",
        answer:
          "That is the magnetic field, which extends field px (40 by default) around the pill. Lower field or add spacing around the button.",
      },
      TOKENS_MISSING,
    ],
  },

  "chart-card": {
    demo:
      "The live demo is a Total sales card with seven months of bars. The June bar starts open with a hatched fill and a tooltip. Click or tap another bar and the tooltip travels to it.",
    whenToUse: [
      "A dashboard tile with one headline number and a short series behind it, such as monthly sales or weekly signups.",
      "Small series of about 4 to 12 points, where each bar is wide enough to press.",
    ],
    whenNotToUse: [
      "Long or dense series, multiple series or axes with scales. Use a charting library for those.",
      "Data where negative values matter: bar heights assume values of 0 and up.",
    ],
    keyboard: [
      ["Tab", "Moves through the header actions, then each bar. Every bar is a button."],
      ["Enter / Space", "Opens the focused bar and moves the tooltip to it."],
    ],
    accessibility: [
      "Each bar is a <button> named \"label: value\" (for example \"Jun: 16,520\") with aria-pressed on the open one.",
      "Header actions are icon buttons with aria-label taken from each action's label. Actions without onSelect are not rendered, so there are no dead buttons.",
      "The labels row under the chart is aria-hidden because each bar already names itself.",
      REDUCED_MOTION,
    ],
    theming: [
      "classNames targets the root, header, actions, chart, point, tooltip and labels slots, and slotProps passes attributes to them.",
      "The open bar, its dot and the tooltip use primary; idle bars use bg-accent with a border-input top edge.",
      "renderTooltip replaces the tooltip content but keeps its position and motion; renderPoint adds content inside each bar.",
    ],
    edgeCases: [
      "total defaults to the sum of data. Pass it when the headline is not a sum, such as an average or a figure from another source.",
      "Numbers are formatted with en-US grouping (16,520). Format them yourself in renderTooltip for another locale.",
      "Give each point a stable id when the data can reorder or change. If activeId points at an id that no longer exists, the tooltip closes rather than jumping to another bar.",
      "Bars have a minimum height so a near-zero value still shows as a bar.",
      "Two cards on one page keep separate tooltips.",
    ],
    recipes: [
      {
        title: "Controlled selection",
        description: "Keep the open bar in your state, for example to show details for that month elsewhere on the page.",
        code: `import { useState } from "react";
import { ChartCard, type ChartCardActiveId } from "@/components/ui/chart-card";

const sales = [
  { id: "jan", label: "Jan", value: 4200 },
  { id: "feb", label: "Feb", value: 6100 },
  { id: "mar", label: "Mar", value: 5300 },
];

export function SalesCard() {
  const [active, setActive] = useState<ChartCardActiveId>("feb");
  return (
    <ChartCard
      title="Revenue"
      caption="this quarter"
      data={sales}
      activeId={active}
      onActiveChange={setActive}
    />
  );
}`,
      },
    ],
    troubleshooting: [
      {
        question: "My header action buttons do not show up.",
        answer: "Only actions with an onSelect function are rendered. Add onSelect to each action.",
      },
      {
        question: "The wrong bar is open after the data updates.",
        answer:
          "Without ids, bars are matched by index. Give each point a stable id and select by that id.",
      },
      TOKENS_MISSING,
    ],
  },

  "contact-lens": {
    demo:
      "The live demo is hello@devigner.cc in dim text over a mail, a globe and a user icon. Hover the mail icon and the whole address lifts and lights with an Email pill under it; the globe lights devigner.cc under a Website pill, the user icon lights hello under a Name pill. Click an icon to copy that part.",
    whenToUse: [
      "A contact block on a portfolio or studio site where one line carries the name, the domain and the email.",
      "Any short string made of parts people might want to copy one at a time.",
    ],
    whenNotToUse: [
      "Contact details people need to read at a glance. The line rests dimmed; use plain text.",
      "Long or multi-line text. The parts are lit inside one line.",
    ],
    keyboard: [
      ["Tab", "Moves between the icons; the focused icon lights its part like a hover."],
      ["Enter / Space", "Copies the focused icon's part, or follows its link."],
    ],
    accessibility: [
      "Each icon is a real button named Copy <label>: <text>, or a link named <label>: <text> when it has href, with a visible focus ring.",
      "A polite live region announces each copy.",
      "Honors prefers-reduced-motion and an ancestor <MotionConfig reducedMotion=\"always\">: parts and pills fade without lifting or blurring.",
    ],
    theming: [
      "Text and icons are text-foreground at 35% opacity at rest and full when lit; the pill is bg-foreground with text-background, so it flips with the theme.",
      "Everything is sized in em from the root's text-4xl. Pass a text size in className to scale the whole thing.",
      "classNames targets text (every piece), lit (pieces while lit), pill and icon.",
    ],
    edgeCases: [
      "text must appear in value; the first match is lit. Leave it out to light the whole line. The pill sits below the whole line and above a part unless the item sets pill.",
      "An item with href is a link: a click follows it and calls onSelect, with no copy.",
      "copy falls back to text, then to value.",
      "Copying uses navigator.clipboard, which needs https or localhost. A failed copy calls onError and leaves the pill unchanged.",
      "With active passed, hover and focus only call onActiveChange; the lit item changes when you update active.",
    ],
    recipes: [
      {
        title: "Studio contact",
        description: "Email, website and name from one address.",
        code: `import { IconGlobal, IconSms, IconUser } from "@devigner-ui/icons";
import { ContactLens } from "@/components/ui/contact-lens";

const items = [
  { label: "Email", icon: <IconSms /> },
  { label: "Website", icon: <IconGlobal />, text: "devigner.cc", copy: "https://devigner.cc" },
  { label: "Name", icon: <IconUser />, text: "hello" },
];

export function Contact() {
  return <ContactLens value="hello@devigner.cc" items={items} />;
}`,
      },
      {
        title: "Links instead of copy",
        description: "Email opens the mail app, the website opens in a tab.",
        code: `import { IconGlobal, IconSms } from "@devigner-ui/icons";
import { ContactLens } from "@/components/ui/contact-lens";

const items = [
  { label: "Email", icon: <IconSms />, href: "mailto:hello@devigner.cc" },
  { label: "Website", icon: <IconGlobal />, text: "devigner.cc", href: "https://devigner.cc" },
];

export function ContactLinks() {
  return <ContactLens value="hello@devigner.cc" items={items} />;
}`,
      },
      {
        title: "Light a part from outside",
        description: "Control the lit item, for example from a button elsewhere on the page.",
        code: `import { useState } from "react";
import { IconSms, IconUser } from "@devigner-ui/icons";
import { ContactLens } from "@/components/ui/contact-lens";

const items = [
  { label: "Email", icon: <IconSms /> },
  { label: "Name", icon: <IconUser />, text: "hello" },
];

export function Highlighted() {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div>
      <button type="button" onClick={() => setActive("Email")}>Show email</button>
      <ContactLens value="hello@devigner.cc" items={items} active={active} onActiveChange={setActive} />
    </div>
  );
}`,
      },
    ],
    troubleshooting: [TOKENS_MISSING],
  },

  "copy-button": {
    demo:
      "The live demo is a black Copy pill. Click it and the text goes to your clipboard, the pill turns green, the icon blurs into a check and the label retypes itself to Copied, then it settles back after a second.",
    whenToUse: [
      "Copying a command, token, link or code snippet where the user needs to know the copy landed.",
      "Any spot that already has a primary action style and needs a single compact copy control.",
    ],
    whenNotToUse: [
      "Icon-only copy affordances inside dense code blocks. A plain icon button takes less room.",
      "Copying data that needs a format choice (CSV or JSON). Use a menu for that.",
    ],
    keyboard: [["Enter / Space", "Copies the value. Ignored while an async value is still resolving."]],
    accessibility: [
      "A real button element with visible focus.",
      "Its accessible name follows the state (label, pendingLabel, copiedLabel, errorLabel), and a polite live region announces every state but idle.",
      "aria-busy is set while an async value resolves, and data-status mirrors the state for styling.",
      "With iconOnly the text is hidden but label stays the accessible name.",
      REDUCED_MOTION,
    ],
    theming: [
      "Rests on bg-foreground with text-background, so it inverts with the theme. Copied uses bg-green-700 and error bg-red-600, both with white text.",
      "data-status (idle, pending, copied, error) is on the button, so className can target a state, for example data-[status=copied]:bg-emerald-600.",
      "size sets the height, padding, text and icon size: sm 36px, md 44px, lg 52px.",
      "label, copiedLabel, pendingLabel and errorLabel set both the visible text and the accessible name, for translation.",
    ],
    edgeCases: [
      "The default copy uses navigator.clipboard, which needs a secure context (https or localhost). Any failure, in value or in copy, shows the error state and calls onError.",
      "If value returns a promise, the button shows a spinner until it resolves. Clicks during that time are ignored.",
      "Letters the two labels share stay put; only the differing ones swap, so similar labels animate best.",
      "Clicking again while Copied copies again and restarts the resetAfter hold. resetAfter 0 keeps the copied or error state until status changes.",
      "Pass status to drive the look yourself, for example to show Copied after a keyboard shortcut copies.",
    ],
    recipes: [
      {
        title: "Copy an install command",
        description: "Pass the text and log the result.",
        code: `import { CopyButton } from "@/components/ui/copy-button";

export function InstallCommand() {
  return (
    <CopyButton
      value="pnpm add devignerui"
      onCopy={(text) => console.log("copied", text)}
      onError={(error) => console.error(error)}
    />
  );
}`,
      },
      {
        title: "Copy a link created on the server",
        description: "Return a promise from value and the button waits on it with a spinner.",
        code: `import { CopyButton } from "@/components/ui/copy-button";

export function ShareLink({ id }: { id: string }) {
  return (
    <CopyButton
      label="Copy link"
      copiedLabel="Link copied"
      value={() => fetch(\`/api/share/\${id}\`).then((r) => r.text())}
    />
  );
}`,
      },
      {
        title: "Icon-only button in a code block",
        description: "Small and square, with the label kept for screen readers.",
        code: `import { CopyButton } from "@/components/ui/copy-button";

export function CodeCopy({ code }: { code: string }) {
  return <CopyButton value={code} iconOnly size="sm" label="Copy code" />;
}`,
      },
    ],
    troubleshooting: [
      {
        question: "Nothing is copied and I get an error.",
        answer:
          "navigator.clipboard only works on https or localhost and after a user gesture. Serve the page securely and pass onError to show a message.",
      },
    ],
  },
  "delete-button": {
    demo:
      "The live demo is a trash tile. Press it and the lid swings open while Confirm and Keep buttons slide out. Confirm starts a short fake request, so you see the spinner and then a tick before it resets.",
    whenToUse: [
      "Deleting a single row, file or card inline, where a full confirmation dialog would be too heavy.",
      "Deletes that call an API: return the promise from onConfirm and the tile shows pending, then done, or goes back to idle if it fails.",
    ],
    whenNotToUse: [
      "Bulk or irreversible deletes that need the user to read consequences or type a name. Use a dialog for those.",
    ],
    keyboard: [
      ["Enter / Space", "On the trash tile, opens the confirmation. Pressed again while open, it cancels."],
      ["Tab", "Moves between the tile, Confirm and Keep."],
      ["Escape", "Cancels while the confirmation is open and returns focus to the tile."],
    ],
    accessibility: [
      "A real button element with visible focus.",
      "Its accessible name follows the state (label, pendingLabel, copiedLabel, errorLabel), and a polite live region announces every state but idle.",
      "aria-busy is set while an async value resolves, and data-status mirrors the state for styling.",
      "With iconOnly the text is hidden but label stays the accessible name.",
      REDUCED_MOTION,
    ],
    theming: [
      "classNames targets the root, the tile and the confirmation pill.",
      "Uses bg-background for the shell and bg-secondary for the confirmation. The shell's shadow-elevated utility is a Devigner shadow token: define --shadow-elevated in your @theme or swap in shadow-lg.",
      "label, confirmLabel, cancelLabel, pendingLabel and doneLabel set every accessible name, for translation or more specific wording (\"Delete invoice\").",
      "left puts the confirmation on the left of the tile, and the lid opens toward it.",
    ],
    edgeCases: [
      "If onConfirm returns nothing, the tile goes straight to done. If it returns a promise, the spinner only appears after a short grace period, so fast requests do not flash it.",
      "A rejected promise returns the tile to idle and calls onError. Without onError the error is re-thrown, so pass onError to show your own message.",
      "resetAfter (1400 ms by default) is how long the tick stays. Set 0 to keep the done state, for example when the row is about to unmount.",
      "Setting disabled while the confirmation is open closes it.",
    ],
    recipes: [
      {
        title: "Delete through an API with error handling",
        description: "Return the request's promise so the tile waits on it, and handle failures yourself.",
        code: `import { DeleteButton } from "@/components/ui/delete-button";

export function DeleteInvoice({ id }: { id: string }) {
  return (
    <DeleteButton
      label="Delete invoice"
      onConfirm={() => fetch(\`/api/invoices/\${id}\`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Delete failed");
      })}
      onError={(error) => console.error(error)}
    />
  );
}`,
      },
    ],
    troubleshooting: [
      {
        question: "The spinner never shows.",
        answer:
          "onConfirm must return the promise. An async function works; a function that starts a fetch without returning it goes straight to done.",
      },
      {
        question: "I get an uncaught error when the request fails.",
        answer: "Pass onError. Without it, a rejected onConfirm is re-thrown after the tile resets.",
      },
      TOKENS_MISSING,
    ],
  },

  timeline: {
    demo:
      "The live demo is a four-step project timeline: Kickoff, Prototype, Polish and Ship. Hover a step, or tab to something inside it, and that row slides off the rail while the line bends around it.",
    whenToUse: [
      "Roadmaps, onboarding steps, changelogs and process explainers with a handful of steps.",
      "Showing the current step of a flow with activeId, while hovering still previews the others.",
    ],
    whenNotToUse: [
      "An interactive stepper that users click to move through a form. Timeline highlights steps but does not navigate between them.",
      "Very long histories. Each step takes a full row plus spacing.",
    ],
    keyboard: [
      ["Tab", "Steps are not focusable on their own. Focusable content you render inside a step (a link or button) highlights that step while it has focus."],
    ],
    accessibility: [
      "Renders an ordered list (<ol>), and each title is an <h3>, so the step order and titles are in the document outline.",
      "The highlighted step gets aria-current=\"step\".",
      "The rail and dots are decorative and hidden from assistive technology.",
      "Under reduced motion nothing slides and the rail stays straight; only the dot color marks the step.",
    ],
    theming: [
      "classNames targets the root list, each item and each content block.",
      "The active dot uses primary, idle dots and the rail use border, titles use text-foreground and descriptions text-muted-foreground.",
      "renderStep adds your own content above the badge, such as a date, icon or link.",
    ],
    edgeCases: [
      "label defaults to \"Step n\". Pass label on each step for dates or version numbers.",
      "Without defaultActiveId no step is highlighted at rest and the rail is straight until someone hovers.",
      "When the pointer leaves, the highlight returns to the resting step (defaultActiveId), not to the last hovered one.",
      "Long titles and descriptions wrap without breaking the rail: its bend is proportional, not measured.",
      "Give steps stable ids when the list can change.",
    ],
    recipes: [
      {
        title: "Mark the current step",
        description: "Rest on the current step and use your own labels.",
        code: `import { Timeline } from "@/components/ui/timeline";

const steps = [
  { id: "plan", label: "Q1", title: "Plan", description: "Scope the release." },
  { id: "build", label: "Q2", title: "Build", description: "Ship the beta." },
  { id: "launch", label: "Q3", title: "Launch", description: "Open to everyone." },
];

export function Roadmap() {
  return <Timeline steps={steps} defaultActiveId="build" />;
}`,
      },
    ],
    troubleshooting: [
      {
        question: "The highlight jumps back when I move the pointer away.",
        answer:
          "That is by design: it returns to the resting step. Set defaultActiveId to the step that should stay highlighted, or control activeId yourself.",
      },
      TOKENS_MISSING,
    ],
  },

  "menu-dock": {
    demo:
      "The live demo is a dock with Home, Search, Saved and Account. Open Account and the dock grows upward into a menu with Profile, Appearance and Sign out; the arrow keys move between rows and Escape goes back.",
    whenToUse: [
      "App-level navigation that should stay small until needed, like a mobile-style bottom bar on the web.",
      "Nested menus (account, settings, libraries) that open in place instead of in a separate dropdown.",
      "A search field or other custom panel that opens from a dock icon, through an item's content.",
    ],
    whenNotToUse: [
      "Primary navigation with many top-level items. The closed dock is icon-only, so more than about six icons gets hard to scan.",
      "Menus that must stay open next to the content they affect: an outside click closes the dock.",
    ],
    keyboard: [
      ["Tab", "The dock is one tab stop; the last focused row keeps it."],
      ["Left / Right arrows", "Move between icons in the closed dock."],
      ["Up / Down arrows", "Move between rows in an open menu."],
      ["Home / End", "Jump to the first or last row."],
      ["Enter / Space", "Opens an item's submenu or panel, or runs its onSelect or link."],
      ["Escape", "Goes back one level, and closes a content panel."],
    ],
    accessibility: [
      "Each level is role=\"menu\" with menuitem rows, labelled with the level's title (or the dock's label, \"Menu\" by default). Content panels are role=\"dialog\".",
      "Rows with children have aria-haspopup, and the item matching active has aria-current=\"page\".",
      "Icon-only dock buttons get the item's label as aria-label and a title tooltip.",
      "Opening a level moves focus to its first row, and going back returns focus to the row that opened it.",
      REDUCED_MOTION,
    ],
    theming: [
      "className goes on the footprint wrapper that holds the dock's place in the layout; position the dock there. classNames.shell styles the surface that grows, whose shadow-elevated utility is a Devigner shadow token (define --shadow-elevated in your @theme or swap in shadow-lg).",
      "floating pins the dock to the bottom center of the viewport.",
      "destructive rows (such as Sign out) use the destructive color.",
      "Pass activeIcon next to icon to swap in a filled glyph for the active item, and renderIcon to wrap or replace any icon.",
    ],
    edgeCases: [
      "The closed dock reserves its own size, so the menu grows upward over the page instead of pushing content.",
      "An item with both items and onSelect opens its submenu; onSelect is ignored. content wins over items.",
      "Choosing a leaf row calls onSelect or follows href but leaves the menu open. Control path and set it to [] to close after a choice.",
      "If items change under an open level so that the level no longer exists, the dock steps back to the nearest valid level and reports it through onNavigate.",
      "Items are matched to active by id, falling back to label, so give items ids when two share a label.",
    ],
    recipes: [
      {
        title: "Close the dock after a choice",
        description: "Control path so a selection, or a route change, returns to the closed dock.",
        code: `import { useState } from "react";
import { MenuDock, type MenuDockItem } from "@/components/ui/menu-dock";

export function AppDock({ signOut }: { signOut: () => void }) {
  const [path, setPath] = useState<number[]>([]);
  const items: MenuDockItem[] = [
    { id: "home", label: "Home", href: "/" },
    {
      id: "account",
      label: "Account",
      items: [
        { label: "Profile", href: "/profile" },
        { label: "Sign out", destructive: true, onSelect: () => { signOut(); setPath([]); } },
      ],
    },
  ];
  return <MenuDock items={items} active="home" path={path} onNavigate={setPath} />;
}`,
      },
    ],
    troubleshooting: [
      {
        question: "The menu stays open after I pick an item.",
        answer: "That is the default. Pass path and onNavigate, then set the path to [] in onSelect or on route change.",
      },
      {
        question: "The dock jumps or pushes the page when it opens.",
        answer:
          "Put positioning on className (the footprint wrapper), not on a parent that clips overflow. The open panel extends above the footprint, so an overflow-hidden ancestor cuts it off.",
      },
      TOKENS_MISSING,
    ],
  },

  "date-range-picker": {
    demo:
      "The live demo is a Trip Dates calendar where days before today are disabled. Pick a check-in day, then move across the calendar to preview the range before you choose check-out; the badge counts the nights, and presets such as Weekend fill a range in one press.",
    whenToUse: [
      "Booking and travel flows (check-in and check-out, nights), and any start and end date filter.",
      "Inline in a page or a popover you provide, when you want the range preview and presets.",
    ],
    whenNotToUse: [
      "Picking a single date: the picker always produces a start and an end.",
      "Picking times, or ranges that span many months at once. It shows one month at a time.",
    ],
    keyboard: [
      ["Tab", "Focuses the calendar on one day (the start of the range, or today), then the presets and Clear."],
      ["Left / Right arrows", "Previous or next day, skipping disabled days."],
      ["Up / Down arrows", "Same weekday in the previous or next week."],
      ["Home / End", "First or last day of the week (Monday to Sunday)."],
      ["Page Up / Page Down", "Same day in the previous or next month, or its first available day."],
      ["Enter / Space", "Picks the focused day: first press sets the start, second sets the end."],
    ],
    accessibility: [
      "The calendar is a role=\"grid\" labelled with the month and year, with one tab stop that moves with the arrow keys.",
      "Days in the range have aria-selected, and disabled days have aria-disabled and cannot be picked.",
      "Each committed range is announced in a polite live region, for example \"Check-in September 26, check-out September 29, 3 nights\".",
      REDUCED_MOTION,
    ],
    theming: [
      "classNames targets root, header, badge, label, grid, day, presets, presetButton and clearButton.",
      "title, startLabel and endLabel change the copy, so it works for things other than trips (\"Report period\", \"From\", \"To\").",
      "renderBadge replaces the nights badge; it receives the committed range, or the preview range while the end is being picked.",
      "Pass presets={[]} to hide the presets, or your own list of { id, label, getRange }.",
      "Colors come from shadcn tokens. The card's smooth-shadow-ring-lg and the header's shadow-subtle are shadow utilities from shadow-plugin and a Devigner shadow token; replace them with shadow-lg and shadow-xs if you don't use those.",
    ],
    edgeCases: [
      "minDate and maxDate disable everything outside them; isDateDisabled disables single days (weekends, booked nights). All three combine.",
      "A range never crosses a disabled day: if one sits between the start and the day you pick, the end stops on the last available day before it. Presets are clamped the same way.",
      "Picking an end before the start swaps them, so value.start is always the earlier day.",
      "Dates are local midnight Date objects. Serialize them with local getters, not toISOString(), or a user east or west of UTC can see the date shift by one day.",
      "The first click of a new range clears the previous value, so onValueChange receives null before the new range.",
      "Weeks start on Monday and month names are in English.",
    ],
    recipes: [
      {
        title: "Controlled value with booked nights disabled",
        description: "Keep the range in state, block past days and specific booked dates.",
        code: `import { useState } from "react";
import { DateRangePicker, type DateRange } from "@/components/ui/date-range-picker";

const booked = ["2026-10-10", "2026-10-11"];
const key = (d: Date) =>
  \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, "0")}-\${String(d.getDate()).padStart(2, "0")}\`;

export function StayPicker() {
  const [range, setRange] = useState<DateRange | null>(null);
  return (
    <DateRangePicker
      value={range}
      onValueChange={setRange}
      minDate={new Date()}
      isDateDisabled={(date) => booked.includes(key(date))}
    />
  );
}`,
      },
      {
        title: "A report period without presets",
        description: "Change the copy and hide the travel presets.",
        code: `import { DateRangePicker } from "@/components/ui/date-range-picker";

export function ReportPeriod() {
  return (
    <DateRangePicker
      title="Report period"
      startLabel="From"
      endLabel="To"
      presets={[]}
      maxDate={new Date()}
      renderBadge={(range) => (range ? "Custom range" : "All time")}
    />
  );
}`,
      },
    ],
    troubleshooting: [
      {
        question: "Controlled value flickers to null when I start a new range.",
        answer:
          "The first click of a new range clears the value, then the second click sets the full range. Keep the null in state; the picker shows the pending start day itself.",
      },
      {
        question: "The saved dates are one day off.",
        answer:
          "Date objects are local midnight. toISOString() converts to UTC and can move the date. Build the string from getFullYear(), getMonth() and getDate() instead.",
      },
      {
        question: "My range ends earlier than the day I clicked.",
        answer:
          "A disabled day sits between the start and that day, so the range stops before it. Check minDate, maxDate and isDateDisabled.",
      },
      TOKENS_MISSING,
    ],
  },

  "inline-time-edit": {
    demo:
      "The live demo reads 2:30. Press the pencil and the pill splits into an hours field and a minutes field with their units, and a save button; change a number and press the tick, and the fields fold back into one pill with the new time.",
    whenToUse: [
      "Durations shown inline in a row or card (estimates, timers, meeting lengths) that people occasionally correct in place.",
      "Anywhere a full form or dialog would be too heavy for changing two numbers.",
    ],
    whenNotToUse: [
      "Clock times or dates. The value is a duration in minutes, not a time of day.",
      "Durations longer than 99 hours or finer than a minute.",
    ],
    keyboard: [
      ["Enter / Space", "On the pencil, opens the edit. On the tick, saves."],
      ["Tab", "Moves between the hours field, the minutes field and the button while editing."],
      ["Enter", "In either field, saves."],
      ["Up / Down arrows", "In either field, adds or removes 1, clamped to 0 to maxHours for hours and 0 to 59 for minutes."],
      ["Shift + Up / Down", "Steps by 10 instead."],
      ["Escape", "Anywhere in the control, discards the edit and returns focus to the button."],
    ],
    accessibility: [
      "The fields are labelled with hoursLabel and minutesLabel, and are out of the tab order until the edit opens.",
      "The button keeps focus across the swap and is renamed from editLabel to saveLabel, so screen readers hear what it will do.",
      "Fields are role=\"spinbutton\" with aria-valuemin, aria-valuemax and aria-valuenow, and use inputMode=\"numeric\", so phones show a number pad.",
      REDUCED_MOTION,
    ],
    theming: [
      "classNames targets root, tile, input, unit and button.",
      "hourUnit and minuteUnit change the units shown while editing (\"h\", \"m\", or a translation). Closed, the time reads as a clock (2:05) with no units; pass shortTime={false} to keep the units there too.",
      "Tiles use bg-background. The shadow is smooth-shadow-ring-sm, a shadow utility from shadow-plugin, drawn once around the closed pill and per tile when open; replace it with shadow-sm if you don't use shadow-plugin. Values use text-foreground and units text-muted-foreground.",
    ],
    edgeCases: [
      "Each field takes up to two digits. Hours above maxHours and minutes above 59 are clamped on save; empty fields save as 0.",
      "onValueChange only fires on save, with the total in minutes, and only when the total changed. Typing does not change the value.",
      "Clicking outside or tabbing out of the control discards the edit, the same as Escape.",
      "If a controlled value changes while the edit is open, the fields show the new value and anything typed is dropped.",
      "open, defaultOpen and onOpenChange control the edit state, for example to open it from a row action.",
      "Setting disabled while the edit is open discards it.",
    ],
    recipes: [
      {
        title: "Controlled duration",
        description: "Keep the minutes in state and show them elsewhere.",
        code: `import { useState } from "react";
import { InlineTimeEdit } from "@/components/ui/inline-time-edit";

export function Estimate() {
  const [minutes, setMinutes] = useState(90);
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">Estimate</span>
      <InlineTimeEdit value={minutes} onValueChange={setMinutes} />
    </div>
  );
}`,
      },
    ],
    troubleshooting: [
      {
        question: "Typing a number does not update my state.",
        answer: "onValueChange fires when the edit is saved (tick or Enter), not on every keystroke.",
      },
      TOKENS_MISSING,
    ],
  },
  "goo-switch": {
    demo:
      "The live demo is a switch that is on. Click it and the thumb shrinks to a drop, runs to the other end with a tail behind it and settles back into a pill; drag it past either end and it spreads over the edge, and letting go there slings it to the opposite side.",
    whenToUse: [
      "A single on/off setting that applies right away, where the switch itself is part of the product's personality.",
      "Settings screens and toolbars with only a few toggles, so the motion stays a treat.",
    ],
    whenNotToUse: [
      "Choices that only apply after a Save button. Use a checkbox.",
      "Dense tables or long settings lists, where every row moving like liquid gets tiring.",
    ],
    keyboard: [
      ["Space / Enter", "Toggles the switch."],
      ["Tab", "Moves focus to and from the switch."],
    ],
    accessibility: [
      "Renders a native button with role=\"switch\" and aria-checked, so screen readers announce it as a switch and its state.",
      "It has no visible label of its own. Pass aria-label, or aria-labelledby pointing at the text next to it.",
      "The form checkbox is hidden from assistive tech and the tab order; when validation lands on it, focus moves to the switch.",
      REDUCED_MOTION,
    ],
    theming: [
      "On, the track uses var(--primary); off, a mix of var(--muted-foreground) and var(--background). The thumb is white in both themes.",
      "Hover and press wash the track toward var(--background), so it follows dark mode.",
      "size picks a 24, 32 or 40px track; a height class in className overrides it, and the width always follows at 62:32. classNames targets root and svg.",
      "inset sets the gap around the thumb in 32nds of the track height; the thumb grows into whatever the gap gives up.",
      "trail sets how long the droplet tail is on a toggle, and 0 turns it off for a plainer switch.",
    ],
    edgeCases: [
      "A click toggles on release. A drag ends on the side the thumb was let go on.",
      "A drag pulled past sling (half the stretch by default) slings the thumb to the other side: pulled past the right end it turns off, past the left end it turns on. sling={false} turns this off, and stretch={false} stops the thumb at the ends altogether.",
      "With name set, a hidden checkbox submits value under name while the switch is on, and nothing while it is off, the same as a checkbox. required blocks submission while off, and a form reset returns it to defaultChecked.",
      "The pointer is captured while pressed, so the drag keeps working outside the switch.",
      "Setting checked from outside moves the thumb with the same droplet motion as a click.",
    ],
    recipes: [
      {
        title: "In a form",
        description: "Submits \"yes\" under newsletter while on, and must be on to submit.",
        code: `import { GooSwitch } from "@/components/ui/goo-switch";

export function Signup() {
  return (
    <form action="/api/signup" className="flex items-center gap-3">
      <span id="newsletter-label" className="text-sm">Send me the newsletter</span>
      <GooSwitch name="newsletter" value="yes" required aria-labelledby="newsletter-label" />
      <button type="submit">Sign up</button>
    </form>
  );
}`,
      },
      {
        title: "Labelled setting",
        description: "Keep the state in React and label the switch with the text beside it.",
        code: `import { useState } from "react";
import { GooSwitch } from "@/components/ui/goo-switch";

export function WifiSetting() {
  const [on, setOn] = useState(true);
  return (
    <div className="flex items-center justify-between gap-6">
      <span id="wifi-label" className="text-sm font-medium">Wi-Fi</span>
      <GooSwitch checked={on} onCheckedChange={setOn} aria-labelledby="wifi-label" />
    </div>
  );
}`,
      },
    ],
    troubleshooting: [
      {
        question: "Dragging the switch scrolls the page on a phone.",
        answer: "The switch sets touch-action: none on itself. If a parent handles the gesture first (a carousel or a sheet), stop propagation of pointerdown on the switch.",
      },
      {
        question: "My form does not receive the switch value.",
        answer: "Pass name. Without it no form field is rendered. Like a checkbox, the field is only sent while the switch is on.",
      },
      TOKENS_MISSING,
    ],
  },
  "liquid-glass": {
    demo:
      "The live demo is a GlassMenu over a dot field: a Menu pill that swells out from its center into a squircle glass panel of four rows, its text zooming out of the way while the rows zoom in from a little larger and blurred. Pick a row, press Escape or press outside and it melts back into the pill. Pressing the pill swells it slightly and it wobbles back when let go. In Chrome and Edge the rim bends whatever sits behind it.",
    whenToUse: [
      "A small set of actions or destinations that should stay out of the way until asked for, such as a view switcher or a shape picker.",
      "Floating controls over media, maps or artwork, where the Liquid Glass look matches the surroundings.",
    ],
    whenNotToUse: [
      "Long lists or anything that needs search or scrolling. The panel grows to fit every row; use a combobox or a command menu.",
      "Dense toolbars with many menus side by side: each one is its own glass surface with a backdrop filter, which costs GPU time.",
    ],
    keyboard: [
      ["Enter / Space", "On the pill, opens the panel and moves focus to the first row. On a row, picks it and closes the panel."],
      ["Arrow Down / Arrow Up", "Moves between rows, wrapping at the ends."],
      ["Home / End", "Jumps to the first or last row."],
      ["Escape", "Closes the panel and returns focus to the pill."],
      ["Tab", "Closes the panel."],
    ],
    accessibility: [
      "The pill is a button with aria-haspopup=\"menu\" and aria-expanded; the panel is role=\"menu\" named by label, each row a role=\"menuitem\" button.",
      "Focus moves to the first enabled row on open and back to the pill on close, so it never drops to the page body.",
      "The closed panel is inert, so its rows are never tabbed to. Disabled rows are skipped by the arrow keys.",
      "Under prefers-reduced-transparency the glass turns fully tinted and the lens is switched off, the way iOS handles Reduce Transparency.",
      REDUCED_MOTION,
    ],
    theming: [
      "The glass tint mixes var(--background) in by transparency, from 0 (ultra clear, 3%) to 1 (fully tinted, 85%). Even clear glass softens the backdrop slightly; the blur builds up toward the tinted end.",
      "Rows use text-foreground, with a var(--foreground) wash on hover and focus. Hovering the closed pill lights it faintly from inside and pressing lights it brightly, in white light, in both themes.",
      "The rim has a crisp specular line and a soft inner glow, brightest at the top left and bottom right, plus a faint var(--foreground) line at 8% just outside. The specular light and the drop shadow are white and black light, the same in both themes. In Chromium the rim also splits a thin rainbow, like real glass.",
      "The closed pill has gently squircle ends and the open panel firms up into squircle corners as it grows. Browsers with CSS corner-shape draw the focus rings and row highlights with the same curve; others keep them round.",
      "Pass className to place the wrapper.",
    ],
    edgeCases: [
      "The panel grows out of the pill's center, as far each way, and floats over its surroundings without moving them. Over the clear glass anything underneath shows through the rows, so leave it free space all around or raise transparency.",
      "The pill fits its label and the panel fits its widest row; both are re-measured when fonts load or the content changes.",
      "The lens that bends the page behind the rim only renders in Chromium browsers (Chrome, Edge, Arc, Opera). Safari and Firefox show the same frosted glass without the bend.",
      "The lens needs something behind it. On a flat background the glass looks frosted either way; place it over images, stripes or text to see it.",
      "An ancestor with filter, opacity below 1 or a mask cuts the glass off from the page behind it, so the lens and blur only see content inside that ancestor.",
      "Setting disabled while open closes the panel.",
    ],
    recipes: [
      {
        title: "Shape picker",
        description: "onSelect gets the row's id, then the panel melts back.",
        code: `import { GlassMenu } from "@/components/ui/liquid-glass";
import { IconDiamond, IconRecord, IconStop } from "@devigner-ui/icons";

export function ShapeMenu({ pick }: { pick: (id: string) => void }) {
  return (
    <GlassMenu
      label="Shapes"
      onSelect={pick}
      items={[
        { id: "circle", label: "Circle", icon: <IconRecord className="size-6" /> },
        { id: "square", label: "Square", icon: <IconStop className="size-6" /> },
        { id: "diamond", label: "Diamond", icon: <IconDiamond className="size-6" /> },
      ]}
    />
  );
}`,
      },
      {
        title: "Controlled",
        description: "Keep the open state in React, for example to close the menu from elsewhere.",
        code: `import { useState } from "react";
import { GlassMenu } from "@/components/ui/liquid-glass";

export function ViewMenu({ items, show }: {
  items: { id: string; label: string }[];
  show: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <GlassMenu
      label="View"
      items={items}
      open={open}
      onOpenChange={setOpen}
      onSelect={show}
      transparency={0.6}
    />
  );
}`,
      },
    ],
    troubleshooting: [
      {
        question: "The rim does not bend anything.",
        answer:
          "The lens only renders in Chromium browsers, and only when there is visible detail behind the glass. Also check that no ancestor has filter, opacity below 1 or a mask, which cuts the glass off from the page behind it.",
      },
      {
        question: "The glass looks solid.",
        answer:
          "Lower transparency. If it stays solid, the system Reduce Transparency setting is on, which forces the tinted look.",
      },
      {
        question: "The open panel covers content I need.",
        answer:
          "The panel floats and grows from the pill's center in every direction. Place the pill where there is room around it, or raise transparency so what is underneath doesn't show through.",
      },
      TOKENS_MISSING,
    ],
  },
  "file-upload": {
    demo:
      "The live demo is an upload panel with fake uploads. Drag files over it and a badge with the file type and count follows the cursor; drop them and each card fades in as its row opens, then they upload two at a time. Remove one and it fades out as its row closes. Hover a card to pause it. Every third upload fails once, so Retry has something to do. A file over 25 MB or of the wrong type turns the dropzone red instead.",
    whenToUse: [
      "Attaching files to a form or a message, where people want to see each file's progress and fix failures in place.",
      "Large uploads where pause, resume and a queue matter.",
    ],
    whenNotToUse: [
      "A single avatar or logo picker. A plain button and an image preview are lighter.",
      "Hundreds of files at once. The cards animate one by one; use a compact table with totals.",
    ],
    keyboard: [
      ["Tab", "Moves to the choose link, then through each card's pause or play, Retry, close or trash, and Download."],
      ["Space / Enter", "On the choose link, opens the file picker; on a card button, presses it."],
      ["Ctrl/Cmd + V", "With focus in the dropzone, adds files from the clipboard (a copied screenshot, for example)."],
    ],
    accessibility: [
      "The panel is a role=\"group\" labelled by its title, and the header close button is labelled Close.",
      "The choose link is a real button, so the dropzone works without a mouse or drag and drop.",
      "Validation errors on the dropzone are role=\"alert\" and read out as they appear.",
      "Each card's status word (Queued, Uploading, Paused, Completed, or the error) is aria-live=\"polite\"; the percent is not, so it does not talk over everything. The bar is a role=\"progressbar\" labelled with the file name.",
      "Icon buttons carry aria-labels: Pause upload, Resume upload, Start upload, Cancel upload, Dismiss and Remove file.",
      "On a mouse the pause button stays hidden until the card is hovered, but it shows on keyboard focus. On touch it is always visible.",
      REDUCED_MOTION,
    ],
    theming: [
      "Progress, the trail behind it, the choose link and the drag-over state use var(--primary). Paused, the fill turns var(--foreground) and the trail goes grey with a dashed edge.",
      "Errors use var(--destructive): a red dropzone, or a red-ringed card with Retry.",
      "The panel is var(--card) on a var(--muted) shell that holds Cancel (var(--foreground) at 6%) and Submit (var(--primary)).",
      "Badges are colored by file family (archives amber, RAR violet, PDF red, design files orange, images blue, video pink, audio sky, documents indigo, sheets emerald, slides orange), each with its own glyph, and fall back to var(--primary). Image files show a thumbnail instead.",
      "Queued is Tailwind amber-600 and the completed tick emerald-500, since shadcn/ui has no warning or success token.",
      "classNames: FileUploader targets root, panel, header, dropzone, list and footer; FileDropzone targets root, icon, label and hint; FileUpload targets root, card, badge, name, status, track, fill and actions.",
    ],
    edgeCases: [
      "Browsers hide file names and sizes during a drag, so the drag badge shows a type read from the MIME type and a count. Size and type checks run on drop.",
      "A drop with some bad files keeps the good ones and shows the problem on the dropzone: a single file is named (setup.exe: Only ZIP or PDF are allowed.), several read as the first reason and how many were left out. The next drag, pick or paste clears it.",
      "The same file (name, size and modified date) can't be listed twice; dropping it again reads Already in the list.",
      "Files dropped together drip out one after another, 80ms apart. Earlier cards stack above later ones, so a drop falls behind them to the end of the list. Removing a card reverses it: the card melts into the drop, which rises behind the cards above into the dropzone, and the slot closes after it. With reduced motion there is no drop; cards simply appear and disappear.",
      "The bar and the tinted wash behind the card show the reported progress as is, with no easing, and the wash ends exactly at the bar head. How smooth they look depends on how often upload calls onProgress.",
      "Submit stays disabled until at least one file is done and nothing is uploading or queued; it receives only the completed files. Cancel stops every upload and clears the list before calling onCancel. The header close button only calls onClose.",
      "The header shows while title or onClose is set, and the footer while onCancel or onSubmit is; pass title={null} and no onClose for a bare panel.",
      "Thumbnails the browser can't decode (HEIC in most browsers) fall back to the type badge.",
      "maxFiles counts the whole list. A drop bigger than the room left keeps what fits and says how many more could be added. Once full, the dropzone stays live: its hint reads 5 of 5 files added, and a drop, paste or click shakes it with the limit instead of opening the picker. Removing a file clears the message.",
      "FileDropzone takes validate(file, accepted) for your own per-file checks (return a message to reject) and blocked, a message that refuses everything while keeping the zone live.",
      "Pause aborts the upload's signal. Resume calls upload again, so resumable should only be on when upload can continue where it stopped; the demo keeps its own byte count to fake that.",
      "The play button on a queued card starts it right away, ahead of the queue and above concurrency.",
      "Retry resets the bar and calls upload again. The error text is the rejection's message, or Upload failed.",
      "With name set, a hidden file input carries every listed file, so a native form submit includes them. It does not wait for uploads to finish.",
      "Thumbnails use object URLs that are revoked when a card is removed and when the uploader unmounts.",
      "FileDropzone and FileUpload are exported too, for a list you manage yourself: the dropzone hands you accepted and rejected files, and the card is fully controlled by status and progress.",
    ],
    recipes: [
      {
        title: "Upload with fetch-like progress",
        description: "XMLHttpRequest reports upload progress; the signal cancels it.",
        code: `import { FileUploader, type FileUploaderContext } from "@/components/ui/file-upload";

function upload(file: File, { onProgress, signal }: FileUploaderContext) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status < 400 ? resolve() : reject(new Error("Upload failed")));
    xhr.onerror = () => reject(new Error("Network error"));
    signal.addEventListener("abort", () => xhr.abort());
    xhr.open("POST", "/api/upload");
    xhr.send(file);
  });
}

export function Attachments() {
  return <FileUploader upload={upload} accept=".zip,.pdf,.ai,.cdr" maxSize={25 * 1024 * 1024} />;
}`,
      },
      {
        title: "Your own list",
        description: "The dropzone validates, you keep the files, and the card shows whatever state you hand it.",
        code: `import { useState } from "react";
import { FileDropzone, FileUpload } from "@/components/ui/file-upload";

export function Picker() {
  const [files, setFiles] = useState<File[]>([]);
  return (
    <div className="flex flex-col gap-3">
      <FileDropzone accept="image/*" maxSize={5 * 1024 * 1024} onFiles={(ok) => setFiles((f) => [...f, ...ok])} />
      {files.map((file) => (
        <FileUpload
          key={file.name}
          name={file.name}
          size={file.size}
          status="queued"
          onCancel={() => setFiles((f) => f.filter((x) => x !== file))}
        />
      ))}
    </div>
  );
}`,
      },
    ],
    troubleshooting: [
      {
        question: "There is no pause button.",
        answer: "Pause needs resumable on FileUploader (or onPause on FileUpload). On a mouse it also stays hidden until the card is hovered or focused.",
      },
      {
        question: "The drag badge says FILE instead of the type.",
        answer: "Some types have no MIME type the browser will name during a drag (.cdr, for one). The real name and badge appear on the card after the drop.",
      },
      {
        question: "Resume starts the file over.",
        answer: "Resume calls upload again. Report progress for the whole file and continue from the server's offset (tus, S3 multipart), or leave resumable off.",
      },
      TOKENS_MISSING,
    ],
  },
  "slider": {
    demo:
      "The live demo is a horizontal slider at 40 with a mark every 10. Press it and the glass thumb opens to show the value; drag right and the fill grows from yellow through orange to red, the digits sliding up as they change, then let go and the thumb closes back to a circle.",
    whenToUse: [
      "One value where how much matters more than the exact number: heat, volume, brightness, intensity, a 0 to 100 level.",
      "Controls panels and thermostat-style screens where a tall, touchable slider fits.",
    ],
    whenNotToUse: [
      "Picking a min and max. It has one thumb; use a two-thumb range slider.",
      "Entering an exact figure, like a price. Use a number input.",
      "A few named choices (Low, Medium, High). Use a segmented control.",
    ],
    keyboard: [
      ["Arrow Up / Arrow Right", "Raises the value by one step (the arrow along the axis lowers it when inverted)."],
      ["Arrow Down / Arrow Left", "Lowers the value by one step (the arrow along the axis raises it when inverted)."],
      ["Page Up / Page Down", "Moves a tenth of the range (at least one step)."],
      ["Home / End", "Jumps to min or max."],
    ],
    accessibility: [
      "The thumb has role=\"slider\" with aria-valuemin, aria-valuemax, aria-valuenow, aria-orientation and aria-valuetext from format, so screen readers read \"72°\" rather than \"72\".",
      "Pass aria-label or aria-labelledby; both go on the thumb, which is the focus target.",
      "Keyboard focus opens the thumb, so the value is visible to keyboard users too. The focus ring uses var(--ring).",
      "Pressing the track moves focus to the thumb, so the arrow keys work right after a drag.",
      REDUCED_MOTION,
    ],
    theming: [
      "The fill uses Tailwind's red-600, orange-500 and yellow-400 as a gradient. Pass your own gradient stops through classNames.fill, e.g. \"from-sky-600 via-sky-400 to-cyan-300\".",
      "The track is var(--foreground) at 15% and the thumb is var(--background) frosted glass, so both follow dark mode. Marks are hairlines that fade out at both ends, white at 45% in the middle.",
      "size picks a 32, 44 or 56px track, or takes a number of px; the length is h-56 vertical or w-72 horizontal, and an h-* or w-* class in className overrides it.",
      "classNames targets root, track, fill, mark, thumb and value.",
    ],
    edgeCases: [
      "The gradient is tied to the fill's end: a short fill shows only yellow, and red comes in as it nears full.",
      "Pressing the thumb keeps the grab point, so it never jumps; pressing the track glides the thumb there. While dragging it glides after the pointer on a soft follow spring, or moves stop to stop with snap.",
      "Marks count the steps (step={10} over 0 to 100 draws 9) and are spread evenly across the whole track, with or without snap. The thumb can't reach the very ends, so it lands on a mark exactly mid-track and up to half a thumb off near the ends. Past 40 marks none are drawn.",
      "Only one pointer drags at a time; a second finger on the slider is ignored until the first lets go.",
      "onValueChange fires on every move; save or fetch in onValueCommit, which fires once per release.",
      "With snap, when step doesn't divide the range, max is a stop too: step={3} over 0 to 100 snaps to 99, then 100, by pointer and by the arrow keys.",
      "Values are rounded to the step's decimals, so step={0.1} gives 0.3, not 0.30000000000000004.",
      "A controlled value outside min and max is shown clamped. The pointer is captured while pressed, so a drag keeps working outside the slider.",
      "With name set, a hidden input submits the value; a form reset returns it to defaultValue.",
    ],
    recipes: [
      {
        title: "Thermostat",
        description: "Whole degrees from 10 to 30, shown with a degree sign.",
        code: `import { useState } from "react";
import { Slider } from "@/components/ui/slider";

export function Thermostat() {
  const [temp, setTemp] = useState(21);
  return (
    <Slider
      value={temp}
      onValueChange={setTemp}
      min={10}
      max={30}
      step={1}
      format={(v) => \`\${v}°\`}
      orientation="vertical"
      size="lg"
      className="h-72"
      aria-label="Temperature"
    />
  );
}`,
      },
      {
        title: "Volume in a form",
        description: "Submits the level under volume.",
        code: `import { Slider } from "@/components/ui/slider";

export function VolumeForm() {
  return (
    <form action="/api/settings" className="flex items-center gap-4">
      <span id="volume-label" className="text-sm">Volume</span>
      <Slider
        name="volume"
        defaultValue={60}
        size="sm"
        aria-labelledby="volume-label"
      />
      <button type="submit">Save</button>
    </form>
  );
}`,
      },
    ],
    troubleshooting: [
      {
        question: "The fill has no colors.",
        answer: "The gradient is made of Tailwind classes in the component file. Make sure Tailwind scans the folder the component was installed into (an @source line in Tailwind v4 if it lives outside your app).",
      },
      {
        question: "Dragging the slider scrolls the page on a phone.",
        answer: "The slider sets touch-action: none on itself. If a parent handles the gesture first (a carousel or a sheet), stop propagation of pointerdown on the slider.",
      },
      {
        question: "The thumb doesn't look frosted.",
        answer: "The blur comes from backdrop-filter. An ancestor with opacity, filter or mask limits what it can blur, so keep those off the slider's parents.",
      },
      TOKENS_MISSING,
    ],
  },
  "nav-notch": {
    demo:
      "The live demo is a bar of ten notches with Link 5 current. Move the pointer along it and a lens glides with it: the notch underneath opens into a chip with its label and the two notches either side grow taller and brighter. Leave the bar and the lens fades out, leaving the current link as the one bright notch.",
    whenToUse: [
      "A compact section or page switcher where the labels can stay hidden until someone looks for them, such as a portfolio, a slide deck or a long one-page site.",
      "A secondary navigation bar with a handful to a dozen links of similar weight.",
    ],
    whenNotToUse: [
      "Primary navigation people need to scan at a glance. The labels are hidden until hovered or focused; use visible tabs or links.",
      "Long lists of links. Past fifteen or so notches the bar gets wide and the targets thin; use a menu or a sidebar.",
    ],
    keyboard: [
      ["Tab", "Moves focus into the bar, onto the current link, and out again."],
      ["Arrow Left / Arrow Right", "Moves between notches; Arrow Up and Arrow Down do the same."],
      ["Home / End", "Jumps to the first or last notch."],
      ["Enter", "Follows the link, or picks the item when it has no href."],
    ],
    accessibility: [
      "Renders a nav landmark named by label, with a list of real links (or buttons for items without href).",
      "Labels stay in the DOM while hidden, so screen readers read every link name.",
      "The current item carries aria-current=\"page\".",
      "The bar is a single tab stop with the arrow keys moving inside it, and the focused notch opens just like a hovered one, with a visible focus ring.",
      REDUCED_MOTION,
    ],
    theming: [
      "The track is var(--foreground) mixed 9% into var(--background) with a lit top rim, a shaded bottom lip and a hairline edge; notches and the chip are var(--foreground) with var(--background) text and a soft bevel. Every shade is a mix of var(--foreground) or var(--background), so it flips with the theme.",
      "classNames targets track, notch and label. Put placement classes in className.",
    ],
    edgeCases: [
      "The notch hit areas touch each other, so the pointer is always over exactly one notch and moving across the gaps never flickers.",
      "With orientation=\"vertical\" the notches stack in a column and the open chip pops out of the track toward side (right by default), overlapping whatever sits beside the bar. Leave room on that side.",
      "The current item only changes color: its notch is drawn at full strength and never opens into a chip on its own.",
      "Two items with the same label need an id each, since value falls back to label.",
      "A click sets the current item before onSelect runs; with value passed, the bar only changes when you update it.",
    ],
    recipes: [
      {
        title: "Section switcher",
        description: "Keeps the current section in React state.",
        code: `import { useState } from "react";
import { NavNotch } from "@/components/ui/nav-notch";

const items = ["Intro", "Work", "About", "Contact"].map((label) => ({
  label,
  href: \`#\${label.toLowerCase()}\`,
}));

export function Sections() {
  const [section, setSection] = useState<string | null>("Intro");
  return <NavNotch items={items} value={section} onValueChange={setSection} label="Sections" />;
}`,
      },
    ],
    troubleshooting: [
      {
        question: "No notch is highlighted when the page loads.",
        answer: "Pass defaultValue (or value) with the id or label of the current item. Without it every notch rests at the same strength.",
      },
      TOKENS_MISSING,
    ],
  },
  "kpi-chart": {
    demo:
      "The live demo is five months of revenue, Jul to Nov. The line draws itself in from Jul with a dot riding its tip, with a soft fill under it, while a card pops up at the top centre reading Monthly revenue, +320% with a trend chip, and 21K in Nov. Hover the chart and a small ring marks the nearest month; click and the dot glides along the curve to it, the card's digits roll to the new change while the sign and % hold still, and the line and fill past that month fade back.",
    whenToUse: [
      "A hero or dashboard tile that tells one growth story, such as revenue, signups or users over a few months.",
      "Short series of about 3 to 12 points where the change since the start is the headline.",
    ],
    whenNotToUse: [
      "Exact reading of values, several series or a real value axis. The y axis only marks a few round values; use a charting library.",
      "Comparing separate categories. Use Chart Card, whose bars each stand alone.",
    ],
    keyboard: [
      ["Tab", "Focuses the chart."],
      ["Arrow Left / Arrow Right", "Moves the dot to the previous or next point, the same as a click; Arrow Down and Arrow Up do the same."],
      ["Home / End", "Jumps to the first or last point."],
    ],
    accessibility: [
      "The plot is one focusable element with role=\"slider\", named by label, with aria-valuetext reading the focused point, for example \"Nov: 21K, +320%\".",
      "Axis labels, the dot and the card are aria-hidden because the slider already speaks the focused point.",
      "Hovering with a mouse only marks a point; the dot, the card and the spoken value change on a click, a tap, a touch drag along the line or an arrow key, and stay there after the pointer or focus leaves.",
      REDUCED_MOTION,
    ],
    theming: [
      "The accent is the text color of the chart slot: the line, the dot, its halo and the focused month all use currentColor. It defaults to text-primary; pass classNames.chart=\"text-orange-500\" for another accent.",
      "The card is bg-background with a soft shadow ring and foreground text, so it stays neutral whatever the accent. Its trend chip uses the accent for a rise and the destructive token for a drop. Extra classes go through classNames.tooltip.",
      "The fill under the line is the accent at 16% fading to clear at the bottom, and shares the line's faded start.",
      "The base is bg-background; under a .dark ancestor it is var(--foreground) mixed 9% into var(--background), the same tone as the Nav Notch track.",
      "Gridlines use stroke-border and fade out toward their top and bottom; idle labels use text-muted-foreground.",
    ],
    edgeCases: [
      "The card shows the change since the first point, rounded to a whole percent, with the focused value and label under it (21K in Nov). When the first value is 0 it shows the formatted value instead of a percentage.",
      "A point above the first value gets a rising trend chip, a point below it a falling one in the destructive color, and the first point or an equal value fades the chip out while keeping its space. The arrow animates only when the trend changes (none to rising, rising to falling): it turns and slides in along the way it points; moving between two points with the same trend leaves it still.",
      "The y axis uses round steps (1, 2, 2.5 or 5 times a power of ten), starts on a step at or below the lowest value and ends at the highest value, so the top of the line sits near the top of the chart and the top tick can be just below it.",
      "The curve is monotone: it never dips below or rises above the points it joins, so growth data never shows a fake dip.",
      "Points are spaced evenly whatever their labels say; the chart has no time axis.",
      "Past 8 points, only every nth label and gridline is drawn, counted back from the last so the newest point is always named. The focused point always shows its label, and thinned labels too close to it are hidden.",
      "The trend chip follows the rounded figure, so a change that rounds to 0% shows no arrow.",
      "A series where every value is the same draws a flat line across the middle.",
      "The card stays fixed at the top centre of the chart while the dot travels; only its figures change. When the dot passes under it, the card fades to a quarter so the dot stays visible.",
      "The card keeps one width for the whole series: it makes room for the longest figure and value line across every point, so picking another point never resizes it.",
      "The y axis column is at least 3rem wide, so short labels never move it; a label longer than that widens the column instead of spilling past it.",
      "The blank right of the plot mirrors the blank left of the y labels (the column minus the widest label), so the chart sits balanced in the card. When the tick text changes length with a new formatValue, that right blank eases to the new size.",
      "currency takes an ISO 4217 code (USD, EUR, SEK, XOF). An invalid code throws, the same as Intl.NumberFormat.",
      "The locale decides where the symbol goes and how it is spaced: $20K in en-US, 20K € in de-DE, F CFA 20K for XOF in en-US. The digits still come from formatValue.",
      "On the y axis the symbol shows once, above the ticks, as the axis unit; the ticks stay plain numbers.",
      "From 1000% the change reads in thousands: +1K%, +1.1K%, then whole thousands from +10K%.",
      "Only the digits roll, one wheel per place, keyed from the right so the ones digit stays put when the figure gains a digit. The sign, %, separators and any letters from formatValue (the K in 21K) hold still.",
    ],
    recipes: [
      {
        title: "Currency and a custom accent",
        description: "Show US dollars and color the line with a palette color.",
        code: `import { KpiChart } from "@/components/ui/kpi-chart";

const revenue = [
  { label: "Aug", value: 5000 },
  { label: "Sept", value: 8400 },
  { label: "Oct", value: 13100 },
  { label: "Nov", value: 21000 },
];

export function RevenueChart() {
  return (
    <KpiChart
      data={revenue}
      label="Monthly revenue"
      currency="USD"
      classNames={{ chart: "text-orange-500" }}
    />
  );
}`,
      },
    ],
    troubleshooting: [
      {
        question: "The card shows a value instead of a percentage.",
        answer: "The first point's value is 0, where a change in percent has no meaning. Start the series at a non-zero value.",
      },
      {
        question: "The line is black or gray instead of colored.",
        answer: "The accent follows the primary token, which many themes set to near black. Pass a text color in classNames.chart.",
      },
      TOKENS_MISSING,
    ],
  },
  badge: {
    demo:
      "The live demo shows every kind of badge in rows: statuses (Approved, In Progress, a dashed Not applicable, Failed, Waiting for approval, Submitted, Pending, Archived), three removable file badges with counts (Folders 4, Files 12, Images 36) that fold away when removed while the rest slide over, then come back with a restore button, a person with an avatar and a country with its flag, and presence badges (Online and Offline with a haloed dot, Do not disturb).",
    whenToUse: [
      "Showing the state of a row in a table or list, such as Approved, Pending or Failed.",
      "Active filters or picked values that the user can remove one by one.",
      "Small labels for a person, a country or presence next to a name, or a link to a topic with href.",
    ],
    whenNotToUse: [
      "A main action such as Save or Delete. Use a button; a clickable badge reads as a label first.",
      "A toggle between filters. Use a switch or a segmented control, which expose pressed or checked state.",
      "Long text. The label never wraps; it is cut with an ellipsis when the badge runs out of room.",
    ],
    keyboard: [
      ["Tab", "Focuses the badge when it has href or onClick, then its remove button when it has onRemove. A plain badge is not focusable."],
      ["Enter / Space", "Follows the link, clicks the badge, or clicks the focused remove button. Space does not follow a link."],
    ],
    accessibility: [
      "A plain badge is a <span>, so screen readers read its label as text in the flow.",
      "With href the label is an <a>; with onClick it is a <button type=\"button\">. Its hit area covers the whole pill, and the pill shows the focus outline.",
      "The icon and media are aria-hidden: the label carries the meaning, so color is never the only signal. The count is read after the label.",
      "The remove button is a real <button type=\"button\"> named \"Remove\" plus the label's text through aria-labelledby, whatever the children are, or removeLabel when set. It shows a focus outline in the ring color.",
      "After a remove, focus moves to the next badge's remove button or action in the same parent, or the previous one when it was the last, so keyboard users keep their place and screen readers announce where they landed.",
      "A label cut with an ellipsis shows its full text as a tooltip on hover.",
      "Under reduced motion a removed badge goes at once, with no fold.",
    ],
    theming: [
      "Each tone is only a text color: neutral is text-foreground and danger text-destructive; success is Tailwind emerald-700 (emerald-400 in dark), warning amber-700 (amber-400 in dark) and info blue-700 (blue-400 in dark), since shadcn/ui has no success, warning or info token and primary is near black in most themes. Those shades keep the text at 4.5:1 or better on the badge's tint in each theme.",
      "The fill is that color at 8% and the outline at 15% (30% dashed), both from currentColor, so a text-* class in className gives a new tone, for example className=\"text-violet-600\". Hover on a clickable badge adds a little more fill.",
      "Because the fill comes from the text color, a tone built on a theme token follows the theme with no dark: class. A palette color needs a dark: shade, as success and warning have, to keep its contrast.",
      "The focus outline uses the ring token.",
    ],
    edgeCases: [
      "Sizes are sm (24px), md (28px, the default) and lg (32px); text, icons, media and the close button scale with them.",
      "media is fitted to a circle of 16, 20 or 24px by size, as far from the rim as from the top and bottom. Whatever is passed fills it, an img or an Avatar component with its own size class alike. In icon, svg icons without a size-* class are drawn 14, 16 or 18px; anything with its own size-* class keeps it, like a small presence dot.",
      "The badge never wraps its label. Inside a narrow parent the label is cut with an ellipsis, and the icon, count and remove button stay whole.",
      "Removing folds the badge to nothing, the gap after it included, so its neighbours in a flex or grid row slide over; then onRemove is called. Take the badge out of your state there. A badge still mounted a moment later, say after a cancelled confirm or a failed request, unfolds again.",
      "The fold closes the gap using the parent's column-gap, so it assumes a flex or grid parent; elsewhere it folds without closing a gap.",
      "With href the label renders as an a, or as linkAs (Next's Link, say) for client-side navigation; target and rel go to it.",
    ],
    recipes: [
      {
        title: "Removable filters",
        description: "A row of filters the user clears one by one.",
        code: `import { useState } from "react";
import { IconFolder } from "@devigner-ui/icons";
import { Badge } from "@/components/ui/badge";

export function Filters() {
  const [filters, setFilters] = useState(["Folders", "Files", "Images"]);
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((f) => (
        <Badge
          key={f}
          icon={<IconFolder />}
          onRemove={() => setFilters((all) => all.filter((x) => x !== f))}
        >
          {f}
        </Badge>
      ))}
    </div>
  );
}`,
      },
      {
        title: "Person with an avatar",
        description: "Any image or avatar in the media slot is drawn round and sized to the badge.",
        code: `import { Badge } from "@/components/ui/badge";

export function Assignee({ name, avatar }: { name: string; avatar: string }) {
  return <Badge media={<img src={avatar} alt="" />}>{name}</Badge>;
}`,
      },
    ],
    troubleshooting: [
      {
        question: "The badge folds away but leaves an empty spot.",
        answer: "The badge folds first, then onRemove is called. Take the badge out of the list you render in that callback; a badge left mounted unfolds again a moment later.",
      },
      {
        question: "My color class does not change the badge.",
        answer: "Pass a text color (text-violet-600), not a background: the fill and outline are drawn from the text color.",
      },
      TOKENS_MISSING,
    ],
  },
  "image-generation": {
    demo:
      "The live demo plays one generation on a loop: a still grid of tiny dots fills the frame, faint while queued and full strength while generating, then the dots grow and take on the colors of the picture while refining, and finally grow into each other and fade as the sharp image comes in. Move the mouse over the grid and the dots around it swell and part a little; click to send a small ripple through them.",
    whenToUse: [
      "The result slot of an AI image tool, from the moment the request is sent until the image arrives.",
      "Any long job that ends in a picture, such as a render, an upscale or a thumbnail being made on the server.",
      "Progress reported in a few steps (queued, generating, refining) rather than as a percentage.",
    ],
    whenNotToUse: [
      "A plain image that is only loading over the network. Use a skeleton or the browser's own lazy loading.",
      "Showing an exact percentage or time left. The swarm shows the stage, not how far along it is.",
      "Long grids of many results at once. Frames share one animation loop and one theme watcher, but each still draws its own canvas; a few on screen are fine, dozens moving together are not.",
    ],
    keyboard: [
      ["Tab", "Focuses the Try again button when status is \"error\" and onRetry is set, or the download button when status is \"complete\" and download is set. The frame itself is not focusable."],
      ["Enter / Space", "Presses Try again or download."],
    ],
    accessibility: [
      "The frame has role=\"img\" and is named by label, or by the status text and prompt (\"Generating image: Glass spheres...\").",
      "The root has aria-busy while the status is queued, generating or refining.",
      "A visually hidden aria-live=\"polite\" region holds the status text, so each new status is read out once, even with showStatus off. The visible status line is aria-hidden so it isn't read twice.",
      "The canvas, the media layer and the status icon are aria-hidden. The status is always written out in text, so neither color nor motion is the only signal.",
      "Try again is a real <button type=\"button\"> with a focus ring in the ring color. It appears without taking focus, so a failure never pulls a keyboard user away from where they are; the live region announces it.",
      "Download is an icon-only <button type=\"button\"> over the frame's top-right corner, named by downloadLabel (\"Download\") with the same text as a tooltip and the same focus ring. It sits outside the role=\"img\" frame so screen readers reach it, and also appears without taking focus.",
      "A prompt cut with an ellipsis shows in full as a tooltip on hover.",
      REDUCED_MOTION + " Under reduced motion the dots jump straight to each state's size and color, the pointer neither swells nor moves them, a click sends no ripple and the status icon stands still.",
    ],
    theming: [
      "The frame is bg-muted with rounded-xl corners; extra classes go through classNames.frame.",
      "The dots are drawn in the canvas's text color: the foreground token, or the destructive token when status is \"error\". They are read again whenever the class or data-theme attribute of <html> or the system color scheme changes, so a theme switch recolors them without a reload.",
      "The status mark sits in a 36px cell with no background: a 32px thinking orb while the job is in progress, a tick when complete, and an alert in the destructive color on error.",
      "While refining, each dot takes the color of the image under it, rounded to 4 bits a channel.",
      "The status line is text-foreground, text-destructive on error; extra classes go through classNames.status.",
    ],
    edgeCases: [
      "The dots sit on a hex grid that fills the frame, 12px apart, so a bigger frame has more of them.",
      "The canvas follows the frame's size; a resize, or moving the window to a screen with another pixel ratio, lays the dots out again where the current state wants them.",
      "The animation stops by itself once every dot has settled, and pauses while the frame is scrolled out of view.",
      "Coloring the dots needs to read the image's pixels. For an image from another domain, set crossOrigin=\"anonymous\" and serve it with CORS headers (Access-Control-Allow-Origin); without them the dots stay one color and the image still shows when complete. The img of src uses the same mode, so the image is downloaded once.",
      "Colors are read only once the image has loaded, so the dots never flash black on the way. Transparent parts of an image leave their dots in the ink color.",
      "children replace the img of src as the visible media, so a Next Image works. The dots only take image colors when tintSrc or src is set as well; a small tintSrc thumbnail saves downloading the full image just for its colors. children that render nothing, such as {ready && <Image />} before it is ready, count as no media.",
      "Once the image is in progress no longer (complete or error), the dots stop catching the pointer, so a right-click, long-press or drag reaches the finished image.",
      "With no src and no children, complete leaves the tiny dots in place instead of fading them, since there is nothing to show under them.",
      "On error a small ripple runs out from the middle, then the dots settle back and dim to 45%. The image, if any, shows faintly and blurred, scaled a touch so the blur keeps clear of the frame's edges.",
      "If the pointer is over the frame when the status leaves the in-progress states, the swell around it lets go instead of staying where the cursor was.",
      "The grid never moves on its own; only the pointer moves dots off their places. A mouse or pen swells the dots within about a quarter of the frame's shorter side and gently parts the closest ones; a finger scrolls the page as usual. A click or tap sends a small ripple. None of this works once the status is complete or error.",
      "Download fetches src and saves it under the download name, so it works for an image on another domain only when that domain sends CORS headers (Access-Control-Allow-Origin). Without them the image opens in a new tab instead, where it can be saved by hand. It needs src; with only children there is nothing to save, so the button stays hidden.",
      "The frame is max-w-xs (320px) wide by default and its height follows aspectRatio. Pass a max-w-* or w-* class in className for another size.",
    ],
    recipes: [
      {
        title: "Wired to a generation request",
        description: "Shows each stage the server reports, then the finished image, with a retry on failure.",
        code: `import { useState } from "react";
import {
  ImageGeneration,
  type ImageGenerationStatus,
} from "@/components/ui/image-generation";

export function Generator({ prompt }: { prompt: string }) {
  const [status, setStatus] = useState<ImageGenerationStatus>("queued");
  const [url, setUrl] = useState<string>();

  async function run() {
    setStatus("generating");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({ prompt }),
      });
      const { image } = (await res.json()) as { image: string };
      setUrl(image);
      setStatus("refining");
      setTimeout(() => setStatus("complete"), 1200);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <button type="button" onClick={run}>
        Generate
      </button>
      <ImageGeneration
        status={status}
        src={url}
        prompt={prompt}
        onRetry={run}
      />
    </div>
  );
}`,
      },
      {
        title: "Wide frame",
        description: "A 16:9 frame with no status line.",
        code: `import { ImageGeneration } from "@/components/ui/image-generation";

export function Banner({ src }: { src?: string }) {
  return (
    <ImageGeneration
      status={src ? "complete" : "generating"}
      src={src}
      aspectRatio="16 / 9"
      showStatus={false}
      className="max-w-xl"
    />
  );
}`,
      },
    ],
    troubleshooting: [
      {
        question: "The dots never take on the image's colors.",
        answer: "The image is on another domain, so the browser won't let the canvas read its pixels unless it is served with Access-Control-Allow-Origin and crossOrigin=\"anonymous\" is set. Or serve it from your own domain. The dots also stay one color when only children is passed; set tintSrc or src too.",
      },
      {
        question: "The frame is tiny or has no height.",
        answer: "The height comes from aspectRatio and the width from the parent, up to max-w-xs. Inside a flex row with no width, give it a w-* class.",
      },
      TOKENS_MISSING,
    ],
  },
  "stardust-slider": {
    demo:
      "The live demo is a card labelled Select strike: at 28%. Grab the handle and it brightens and grows; fling it right and it stretches with the speed while the blue fill glows with drifting dust, and the percentage rolls up digit by digit after it. Click the number to type one.",
    whenToUse: [
      "One headline value in a dashboard or trading style screen, such as a strike, a risk level or an allocation, where the control is the focus of the card.",
      "A value with a few meaningful stops: snap=\"marks\" with labelled marks pulls the fill onto them like detents.",
      "A tall fader, such as volume or a level meter, with orientation=\"vertical\", or the track alone inside your own layout with variant=\"bare\".",
    ],
    whenNotToUse: [
      "Dense settings panels with many sliders: each one runs its own dust animation. Use Slider.",
      "Picking a min and max. It has one handle; use a two-thumb range slider.",
      "A value that is mostly typed. The readout accepts typing, but a number input is the better primary control.",
    ],
    keyboard: [
      ["Tab", "Focuses the number when it is editable, then the track. The track draws a focus ring; the number turns into a field in place when clicked or activated with Enter."],
      ["Arrow Up / Arrow Right", "Raises the value by one step, ten with Shift (Arrow Left raises it right-to-left)."],
      ["Arrow Down / Arrow Left", "Lowers the value by one step, ten with Shift (Arrow Right lowers it right-to-left)."],
      ["Page Up / Page Down", "Moves a tenth of the range (at least one step)."],
      ["Home / End", "Jumps to min or max."],
      ["Arrow Up / Arrow Down in the field", "Steps the typed number by one step, ten with Shift; the fill follows."],
      ["Enter / Escape", "In the typed value field: commits it, or puts back the value it opened with, and returns focus to the track."],
    ],
    accessibility: [
      "The track has role=\"slider\" with aria-valuemin, aria-valuemax, aria-valuenow, aria-orientation and aria-valuetext, the same text the readout shows (\"28%\", \"$110\").",
      "label names the slider through aria-labelledby. Without a label, and always with variant=\"bare\", pass aria-label or aria-labelledby.",
      "The rolling digits are hidden from screen readers; the editable number is a button named \"Type a value, now 28%\", and its field is named \"Type a value\".",
      "Pressing the track moves focus to it, so the arrow keys work right after a drag. Its focus ring uses var(--ring). The number has no ring by design: it edits in place, as a borderless field the width of its text, with its text selected so typing replaces it.",
      REDUCED_MOTION + " Under reduced motion the dust stays still, the readout changes without rolling and the fill jumps instead of gliding.",
    ],
    theming: [
      "The card is var(--card) with var(--card-foreground) text and the label is var(--muted-foreground). The track is var(--foreground) mixed 9% into var(--background) with the same bevel as Nav Notch, so both follow dark mode. Marks are hairlines of var(--border) that fade out at both ends, like a divider; mark labels are var(--muted-foreground).",
      "color sets the fill (#365ee9 by default). The fill fades it in from transparent at its start to full strength at its end, so a short fill still ends bright.",
      "The dust is white. At min the fill shrinks to a slim neutral socket around the handle (var(--foreground) at 8%) with a var(--foreground) handle, and the color and dust fade in over the first 8% of the track, so an empty slider reads as empty. The handle is see-through white with a light backdrop blur.",
      "Vertical cards stack the label, smaller, above the number, both centred over the track; mark labels hang beside the track with room kept on both sides, so the track stays centred. size picks a 44, 54 or 64px track, with a 320, 372 or 420px card and sm, base or lg text; everything inside scales with it. A w-* class in className changes the width, and a vertical track's length comes from an h-* class in classNames.track.",
      "classNames targets label, value, track, fill, handle, mark and markLabel.",
    ],
    edgeCases: [
      "Grabbing near the handle keeps the grab point, so it never jumps; pressing elsewhere on the track glides the fill there.",
      "snap=\"marks\" pulls the fill onto a mark when the pointer comes within about 10px of one (scaled with size) and releases it past that; snap=\"steps\" moves it from stop to stop. Free, it follows the pointer on a soft spring.",
      "The fill is revealed with a clip-path over a fixed layer and the handle moves on transforms, so a drag never changes layout. Its start follows the track's round end; its end keeps a tight corner and rounds into a half circle over the last 15% of the track.",
      "The readout rolls like an odometer: the ones digit turns with the value, each higher digit turns only while the one below rolls over, and each column blurs a little with its speed. With Intl formatting, group separators (1,250) and the locale's decimal mark sit between the columns and a leading digit or separator unfolds as the value grows into it, so text around the number never jumps. Compact notation (1.2K) or a format function that changes the digits shows plain text.",
      "Typed values are clamped to min and max and rounded to step; anything that isn't a number is ignored. Both a comma and a point work as the decimal mark.",
      "scale=\"log\" needs min above 0 and otherwise falls back to linear. Arrow keys always move by step in values, so on a log scale a step is a short distance at the top and a long one at the bottom.",
      "Right-to-left comes from dir, or from the page's direction when dir is unset. The track mirrors; the numbers still read left to right. Vertical ignores it.",
      "The dust gathers toward the handle: half the motes drift in the last 20% of the fill around the handle, most of the rest along its middle and only a few in its dark first 30%, and a short fill shows fewer. It only animates while the slider is on screen.",
      "Marks outside the range are skipped. Only one pointer drags at a time.",
      "onValueChange fires on every move; save or fetch in onValueCommit, which fires once per release, per key press and per typed value.",
      "With name set, a hidden input submits the value.",
    ],
    recipes: [
      {
        title: "Strike with detents",
        description: "Strikes from 90 to 130 in dollars, pulled onto the labelled round numbers.",
        code: `import { useState } from "react";
import { StardustSlider } from "@/components/ui/stardust-slider";

export function StrikePicker() {
  const [strike, setStrike] = useState(110);
  return (
    <StardustSlider
      label="Select strike:"
      value={strike}
      onValueChange={setStrike}
      min={90}
      max={130}
      step={1}
      snap="marks"
      marks={[
        { value: 100, label: "100" },
        { value: 110, label: "ATM" },
        { value: 120, label: "120" },
      ]}
      formatOptions={{ style: "currency", currency: "USD" }}
    />
  );
}`,
      },
      {
        title: "Vertical fader",
        description: "A tall, small fader without the card, saved on release.",
        code: `import { StardustSlider } from "@/components/ui/stardust-slider";

export function Volume({ save }: { save: (value: number) => void }) {
  return (
    <StardustSlider
      aria-label="Volume"
      variant="bare"
      orientation="vertical"
      size="sm"
      defaultValue={60}
      color="#0ea5e9"
      onValueCommit={save}
      classNames={{ track: "h-72" }}
    />
  );
}`,
      },
      {
        title: "Budget on a log scale",
        description: "From 100 to 1,000,000 in euros, German style, with room for the small amounts.",
        code: `import { StardustSlider } from "@/components/ui/stardust-slider";

export function Budget() {
  return (
    <StardustSlider
      label="Budget"
      min={100}
      max={1000000}
      step={100}
      defaultValue={5000}
      scale="log"
      marks={[]}
      locale="de-DE"
      formatOptions={{ style: "currency", currency: "EUR" }}
    />
  );
}`,
      },
    ],
    troubleshooting: [
      {
        question: "The fill shows no color.",
        answer: "The fill uses color-mix() and clip-path, which need a 2023 or newer browser. Check that color is a valid CSS color.",
      },
      {
        question: "The number doesn't match the value right away.",
        answer: "That is the roll: the readout catches up with the value over about half a second. The value passed to onValueChange and read by screen readers is always current.",
      },
      {
        question: "The number shows as plain text instead of rolling.",
        answer: "The digits couldn't be found in the formatted text: compact notation (1.2K), a numbering system with other digits, or a format function that rounds or abbreviates. Use formatOptions with standard notation to keep the roll.",
      },
      TOKENS_MISSING,
    ],
  },
  "expand-tabs": {
    demo:
      "The live demo is a row of four tiles: Commands (with a dot on its corner), About, Portfolio and Shortcuts. Move the pointer onto one and it widens, fills with the accent and its icon blurs out while the label blurs in; the tiles beside it slide over to make room. Leave and it closes back to a square. Click a tile and it becomes the selected tab: the dot shrinks off Commands and grows on it, and the tile keeps its resting look.",
    whenToUse: [
      "A compact icon bar where the names can wait until someone points at a tile, such as a portfolio header or a floating toolbar of a few sections.",
      "Three to six links of similar weight, each with a recognizable icon.",
    ],
    whenNotToUse: [
      "Primary navigation that has to be scanned at a glance or used mostly on touch screens. Labels show only on hover or keyboard focus; use visible tabs.",
      "Many links. Each tile is 72px and opens wider, so a long row gets crowded; use a menu.",
    ],
    keyboard: [
      ["Tab / Shift+Tab", "Moves between tiles; the focused tile opens and shows its label with a focus ring."],
      ["Enter", "Selects the tile and follows the link, or runs onSelect when the item has no href. Space does the same on a button."],
    ],
    accessibility: [
      "Renders a nav landmark named by label, with a list of real links (or buttons for items without href).",
      "The label stays in the DOM while hidden, so every tile is named by its label; the icon is aria-hidden.",
      "A badge is drawn as an aria-hidden dot, and its text is added to the tile's name for screen readers.",
      "The selected tile carries aria-current (page on a link, true on a button). Keyboard focus also opens a tile; a click's focus does not. At rest the selection is shown by the dot alone, so a sighted user relies on that dot.",
      REDUCED_MOTION,
    ],
    theming: [
      "A closed tile is bg-foreground/8 with text-foreground icons, so it follows the theme.",
      "The open tile and the badge dot are filled with color (#2152ff by default) and the open tile's text is white in both themes. Pass a darker color if yours is light.",
      "classNames targets tab, active, label and badge. Put placement classes in className.",
    ],
    edgeCases: [
      "An open tile is as wide as its label plus 28px either side, and never narrower than the 72px square. The width is measured, so a font that loads late resizes it.",
      "The row grows around the open tile, so the tiles beside it move; center the bar (or anchor its start) so it shifts the way you want.",
      "Icons are sized 24px unless the svg has its own size-* class.",
      "The badge dot is cut out of the tile with a 5px gap that shows whatever sits behind the bar, and the notch is rounded where it meets the tile's top and right edges. The cutout is sized for the 14px dot, so resizing the dot through classNames.badge leaves the gap off.",
      "A tile opens when the pointer moves over it, not when the pointer enters it. Opening reflows the row and slides tiles under a still pointer; opening on enter would flip two tiles back and forth for as long as the pointer rests near their edge.",
      "There is one dot: on the first item with a badge until a tab is selected, then on the selected tile. The badge text stays with its own item for screen readers.",
      "value and defaultValue are indexes into items. With no selection (the default) the dot stays on the first badged item.",
      "Items are keyed by href, then label, so two items with neither need distinct labels.",
    ],
    recipes: [
      {
        title: "Portfolio header",
        description: "Four sections, one marked new.",
        code: `import { IconCommand, IconHome, IconKeyboard, IconUser } from "@devigner-ui/icons";
import { ExpandTabs } from "@/components/ui/expand-tabs";

const items = [
  { label: "Home", icon: <IconHome />, href: "#home" },
  { label: "About", icon: <IconUser />, href: "#about" },
  { label: "Shortcuts", icon: <IconCommand />, href: "#shortcuts", badge: "New" },
  { label: "Contact", icon: <IconKeyboard />, href: "#contact" },
];

export function Header() {
  return <ExpandTabs items={items} label="Sections" />;
}`,
      },
    ],
    troubleshooting: [
      {
        question: "The tile does not open on a phone.",
        answer: "There is no hover on touch screens, so a tap follows the link straight away. Pick visible tabs when most visitors are on touch.",
      },
      TOKENS_MISSING,
    ],
  },
  "flip-button": {
    demo:
      "The live demo is a row of pill buttons, one per variant. Hover one and its label flips up as a copy rolls in from below, while the arrow in its badge slides out to the right as another slides in from the left, one frame behind the label.",
    whenToUse: [
      "Calls to action that should feel alive on hover without moving the layout, such as a hero, pricing or Explore all link.",
      "A set of buttons that need one shared look across several roles: primary, secondary, outline, glass, inverse and ghost.",
    ],
    whenNotToUse: [
      "Dense toolbars and table rows, where every hover would flip a label; use a plain button.",
      "Destructive actions such as deleting data. There is no destructive variant; use Delete Button, which asks for confirmation.",
    ],
    keyboard: [
      ["Tab", "Focuses the button and flips it like a hover; a 2px ring in the ring color is drawn outside it."],
      ["Enter / Space", "Activates it, like any native button (Enter only when asChild renders a link)."],
    ],
    accessibility: [
      "Renders a real <button type=\"button\">, or with asChild the element you pass, so the role is right and the label is the children.",
      "The rolling copy is aria-hidden, so screen readers read the label once. With flipped the two swap, so the name is whichever label is showing.",
      "A flipped label (Copied) changes the button's name but is not announced; pair it with a toast or a live region when the change matters.",
      "Badge icons and the spinner are aria-hidden. Give an icon-only button an aria-label.",
      "loading sets aria-busy and disables the button. With asChild, disabled and loading set aria-disabled and take the link out of the tab order.",
      REDUCED_MOTION + " With reduced motion the label and icon stay still, and flipped swaps the label without the roll.",
    ],
    theming: [
      "Every variant uses theme tokens (primary, secondary, foreground, background, surface, border, ring), so it follows light and dark on its own.",
      "The label and the disc's icon share one curve, cubic-bezier(0.175, 0.885, 0.32, 1.275) (a slight overshoot that settles), set inline so no theme variable is needed; the press scale and color changes use ease-out over 200ms.",
      "Set --flip-duration (450ms) to change the roll's length and --flip-stagger (16.67ms) to change how far the icon trails the label, from className or style.",
      "Sizes own the geometry and variants own color, so a className with bg-* or text-* recolors any size.",
    ],
    edgeCases: [
      "The label and flipLabel share one grid cell, so the button is as wide as the longer one and does not resize when it flips.",
      "Any label flips, rich content included: it is rendered twice, so avoid ids or interactive elements inside it.",
      "Passing flipped, even false, hands the flip to state: hover and focus stop flipping. Leave it undefined for hover.",
      "In right-to-left layouts the badge icon slides the other way.",
      "loading puts the spinner in the badge so the width holds; without a badge it takes the leading icon's place.",
      "fullWidth pins the badge to the trailing edge, so a long label can run under it; keep labels short on narrow widths.",
      "The disc's icon slides one 60Hz frame behind the label and turns two frames behind, in and out alike.",
    ],
    recipes: [
      {
        title: "Link with a turning plus",
        description: "A link styled as an outline pill whose plus turns on hover. Next's Link works the same way.",
        code: `import { IconAdd } from "@devigner-ui/icons";
import { FlipButton } from "@/components/ui/flip-button";

export function NewProject() {
  return (
    <FlipButton asChild variant="outline" iconRight={<IconAdd />} iconMotion="rotate">
      <a href="/projects/new">New project</a>
    </FlipButton>
  );
}`,
      },
      {
        title: "Copy button that confirms",
        description: "The label rolls to Copied for two seconds after a click. Hover does nothing while flipped is passed.",
        code: `import * as React from "react";
import { IconCopy } from "@devigner-ui/icons";
import { FlipButton } from "@/components/ui/flip-button";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <FlipButton
      variant="outline"
      iconRight={<IconCopy />}
      flipLabel="Copied"
      flipped={copied}
      onClick={async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      Copy link
    </FlipButton>
  );
}`,
      },
    ],
    troubleshooting: [
      {
        question: "The label does not flip on hover.",
        answer: "Check that flipped is not passed: any boolean, false included, hands the flip to state. Also check that reduced motion is off.",
      },
      {
        question: "The flipped label shows below the button.",
        answer: "The clip relies on the label being a single line. Keep the label short or give the button a width that fits it; whitespace-nowrap is already set.",
      },
      TOKENS_MISSING,
    ],
  },
  tabs: {
    demo:
      "The live demo is a group of three options, Playlist, History and Settings, in a hairline ring. Click one, or tab in and press an arrow key, and a soft pill slides behind it while its text brightens.",
    whenToUse: [
      "Picking one of two to six short values that change what is already on screen, such as a size, a view (grid or list) or a chart range.",
      "Settings panels and toolbars, where every option should stay visible and one press should switch.",
    ],
    whenNotToUse: [
      "Switching between different panels of content with their own headings; that is a tab list with tab panels, which this does not render.",
      "More than about six options or long labels. The row gets wide and cannot wrap; use a select.",
      "Turning one setting on or off; use a switch.",
    ],
    keyboard: [
      ["Tab", "Moves focus into the group, onto the selected option, and out again. A 2px ring in the ring color is drawn around the focused option."],
      ["Arrow keys", "Select and focus the previous or next option, wrapping at the ends and skipping disabled ones, as native radios do."],
      ["Space", "Selects the focused option when none is selected yet."],
    ],
    accessibility: [
      "Built on native radio inputs sharing one name inside a radiogroup named by label, so screen readers announce the group, each option and its position.",
      "Each option is a label wrapping its visually hidden radio, so the whole pill is the click target.",
      "Icons are aria-hidden. An icon-only option (label: null) takes its value as its accessible name, so make that value readable.",
      "The selected option is marked by the pill and by brighter text, not by color alone.",
      REDUCED_MOTION + " With reduced motion the pill jumps to the new option.",
    ],
    theming: [
      "The ring is border-border, the sliding pill bg-accent, unselected text text-muted-foreground (text-foreground/80 on hover) and selected text text-foreground, so it follows light and dark on its own.",
      "Options use the mono font. Pass font-sans (or any font) in classNames.option to change it.",
      "classNames.indicator restyles the pill, such as a brand fill with a light classNames.option text color.",
      "The pill glides on the shared layout spring and the text color changes over 150ms with ease-out.",
    ],
    edgeCases: [
      "The pill is placed from the selected option's offset inside the group, so a scrolling container or an animating parent (a panel resizing, a sheet sliding in) never sends it gliding; only a new value does. A resize, such as a late font load, moves it without a glide.",
      "With no enabled option and no value, nothing is selected and no pill is drawn.",
      "A value that matches no option leaves the group with no pill.",
      "Option values are the React keys, so they must be unique.",
      "Without name, each group gets its own generated one, so two groups on a page never share arrow keys.",
    ],
    recipes: [
      {
        title: "Controlled view switch",
        description: "Grid and list, icon only, driving a list's layout.",
        code: `import * as React from "react";
import { IconLayoutGrid, IconLayoutList } from "@devigner-ui/icons";
import { Tabs } from "@/components/ui/tabs";

export function ViewSwitch() {
  const [view, setView] = React.useState<"grid" | "list">("grid");
  return (
    <Tabs
      label="View"
      value={view}
      onValueChange={setView}
      options={[
        { value: "grid", label: null, icon: <IconLayoutGrid /> },
        { value: "list", label: null, icon: <IconLayoutList /> },
      ]}
    />
  );
}`,
      },
      {
        title: "Full-width plan picker in a form",
        description: "Submits the chosen plan with the form; one plan is not available.",
        code: `import { Tabs } from "@/components/ui/tabs";

export function PlanField() {
  return (
    <form action="/checkout">
      <Tabs
        label="Plan"
        name="plan"
        size="lg"
        fill
        defaultValue="pro"
        options={[
          "free",
          "pro",
          { value: "team", label: "team (soon)", disabled: true },
        ]}
      />
      <button type="submit">Continue</button>
    </form>
  );
}`,
      },
    ],
    troubleshooting: [
      {
        question: "The pill does not move when I click.",
        answer: "With value passed the group is controlled: update it in onValueChange. Otherwise check that option values are unique.",
      },
      {
        question: "Arrow keys move into another group.",
        answer: "Two groups were given the same name. Leave name out unless the group sits in a form, and give each form field its own name.",
      },
      TOKENS_MISSING,
    ],
  },
} satisfies Record<string, ComponentGuide>;
