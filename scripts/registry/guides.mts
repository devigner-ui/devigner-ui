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
      "Focus moves to Keep when the confirmation opens, so an accidental Enter does not delete.",
      "The tile has aria-expanded and aria-controls pointing at the confirmation, and aria-busy while a promise runs.",
      "Pending and done states are announced through a polite live region using pendingLabel and doneLabel (\"Deleting\", \"Deleted\" by default).",
      "Focus is moved back to the tile when the confirmation closes, so it never drops to the page body.",
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
} satisfies Record<string, ComponentGuide>;
