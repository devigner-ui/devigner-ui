# DateRangePicker design

## Context

The user recorded a 39-second demo of a "Trip Dates" date-range picker card (title,
nights-count badge, CHECK-IN/CHECK-OUT labels, single-month calendar with pill-shaped
range highlighting and hover preview, four quick-select presets each with their own
accent color, and a Clear action) and asked for it to become a component in the
`devignerui` package. No calendar/date-range primitive or date library exists in
the package today.

Decided during brainstorming: build a general-purpose `DateRangePicker` rather than a
literal `TripDates` card, since the demo's specific labels/presets/colors are just one
configuration of a reusable primitive.

## Component

Single component, `DateRangePicker`, in `packages/ui/src/components/date-range-picker.tsx`,
following the package's existing conventions (see `timeline.tsx`): controllable state via
`useControllableState`, a `classNames` object per styleable part, `slotProps` for native
HTML attributes per part, `renderX` escape hatches for custom content, `useReducedMotion`
accommodation.

Calendar grid, header (labels + optional badge), and presets/clear footer all live in
this one component rather than being split into a headless-primitive + composed-card
pair, matching how `Timeline`/`ChartCard`/`MenuDock` stay single-file with slots.

## Props API

```ts
export interface DateRange {
  start: Date;
  end: Date;
}

export interface DateRangePreset {
  id: string;
  label: string;
  getRange: (anchor: Date) => DateRange;
}

export interface DateRangePickerClassNames {
  root?: string;
  header?: string;
  badge?: string;
  label?: string;
  grid?: string;
  day?: string;
  presets?: string;
  presetButton?: string;
  clearButton?: string;
}

export interface DateRangePickerSlotProps {
  root?: React.HTMLAttributes<HTMLDivElement>;
}

export interface DateRangePickerProps {
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  onValueChange?: (range: DateRange | null) => void;

  month?: Date;
  defaultMonth?: Date;
  onMonthChange?: (month: Date) => void;

  minDate?: Date;
  maxDate?: Date;
  isDateDisabled?: (date: Date) => boolean;

  presets?: DateRangePreset[];        // omit -> no presets row
  startLabel?: string;                // default "Check-in"
  endLabel?: string;                  // default "Check-out"
  renderBadge?: (range: DateRange | null) => React.ReactNode; // omit -> no badge
  onClear?: () => void;               // presence -> shows Clear action

  classNames?: DateRangePickerClassNames;
  slotProps?: DateRangePickerSlotProps;
}
```

Value type is native `Date` (no new dependency; the package has no date library
today). The component normalizes to local-midnight internally to avoid
time-of-day/timezone footguns when comparing dates.

Presets are consumer-defined data (`getRange(anchor)`), not baked into the component.
There is a single accent color for the whole component (existing design tokens), not a
per-preset color mapping, the video's per-preset hues are out of scope for v1.

## Selection behavior

State machine, independent of the controlled `value`:

- No `start` yet → click a day → becomes `start`; `end` stays empty.
- `start` set, no `end` → hovering a later day shows a preview: a pill-shaped fill
  between `start` and the hovered day. If a disabled date falls inside that span, the
  preview clamps at the day just before it.
- Click a second day → commits `{ start, end }` (swapped if the clicked day is before
  `start`) → fires `onValueChange`.
- Both set, click any day → starts a new range from that day.
- `Clear` (shown when `onClear` is passed) resets to `null`.

Calendar grid: weeks as rows, leading/trailing days from adjacent months rendered
dimmed and non-interactive. A small dot renders under today's date when it's in the
visible month. Month navigation (prev/next) is a required control, not optional. The
demo only shows one month, but a picker that can't change months isn't usable for a
real booking flow.

`minDate`/`maxDate`/`isDateDisabled` gate which days are selectable, hoverable-for-preview,
and keyboard-focusable.

## Animation

Mapped to existing tokens in `packages/ui/src/lib/easing.ts`, no new curves needed:

- Range pill fill (hover preview growing/shrinking, commit snapping to final shape) →
  `SPRING_LAYOUT`.
- Nights-count badge text swap, month label swap on navigation → `SPRING_SWAP`.
- Active preset chip's highlight background (shared `layoutId` sliding between preset
  buttons) → `SPRING_LAYOUT`.
- Day-cell and preset-button press feedback → `SPRING_PRESS`.
- `useReducedMotion()` accommodation, same pattern as `Timeline`: pill fill and badge
  swap become instant under reduced motion; color/shape state still updates.

## Accessibility

- Grid uses `role="grid"`, day cells `role="gridcell"`, weeks `role="row"`.
  `aria-selected` on start/end/in-range days, `aria-disabled` on padding/disabled days.
- Roving tabindex across day cells: arrow keys move focus day-to-day, `Home`/`End` jump
  to week start/end, `PageUp`/`PageDown` step months, `Enter`/`Space` selects.
- Live region announces the committed range and nights count on change.
- Preset buttons and Clear are plain `<button>`s.

## Testing

Vitest + Testing Library, matching the existing `controllable-state.test.tsx` pattern:

- Controlled vs uncontrolled `value`/`defaultValue`/`onValueChange`.
- Range state machine: start → hover-preview → commit, re-picking after a full range,
  disabled-date clamping.
- `minDate`/`maxDate`/`isDateDisabled` block selection and keyboard nav.
- A preset's `getRange` result becomes the committed value on click.
- Keyboard navigation (arrow/Home/End/PageUp/PageDown/Enter) moves focus and selects
  correctly.

## Out of scope for v1

- Per-preset accent colors (video shows this; deferred, single accent color only).
- Multi-month display.
- Literal `TripDates` fixed-config wrapper (can be built later as a thin consumer of
  `DateRangePicker` if wanted).
