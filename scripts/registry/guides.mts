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
} satisfies Record<string, ComponentGuide>;
