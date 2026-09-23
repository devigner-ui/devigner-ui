export const descriptors = [
  {
    slug: "magnetic-button",
    name: "Magnetic Button",
    description: "A cursor-responsive button with an optional link form.",
    category: "animation",
    variants: ["Default", "Outline", "As link", "Disabled"],
    sourceFile: "packages/ui/src/components/magnetic-button.tsx",
    dependencies: ["cn", "gsap", "react", "@devignerui/ui"],
    transformations: ["Uses @devignerui/ui/motion for shared motion tokens."],
    props: [
      ["children", "ReactNode", "-", "Button content."], ["href", "string", "-", "Renders a link."], ["strength", "number", "3", "Cursor pull strength."], ["labelStrength", "number", "6", "Label parallax strength."], ["field", "number", "40", "Magnetic field radius."], ["tilt", "number", "15", "Label tilt."], ["className", "string", "-", "Button classes."], ["disabled", "boolean", "false", "Disables interaction."],
    ],
    examples: { standard: '<MagneticButton>Continue</MagneticButton>', custom: '<MagneticButton className="rounded-none">Continue</MagneticButton>' },
  },
  {
    slug: "chart-card", name: "Chart Card", description: "An interactive chart summary.", category: "data", variants: ["Default", "Custom composition"], sourceFile: "packages/ui/src/components/chart-card.tsx", dependencies: ["cn", "motion", "react", "@devigner-ui/icons", "@devignerui/ui"], transformations: ["Rewrites ../lib/easing to @devignerui/ui/motion.", "Rewrites controllable-state to @devignerui/ui/hooks."],
    props: [["data", "ChartCardPoint[]", "-", "Chart data."], ["activeId", "ChartCardActiveId", "-", "Controlled point."], ["defaultActiveId", "ChartCardActiveId", "-", "Initial point."], ["onActiveChange", "function", "-", "Active point callback."], ["actions", "ChartCardAction[]", "-", "Actionable header actions."], ["renderPoint", "function", "-", "Point slot."], ["renderTooltip", "function", "-", "Tooltip slot."], ["renderActions", "function", "-", "Actions slot."], ["classNames", "ChartCardClassNames", "-", "Slot classes."], ["slotProps", "ChartCardSlotProps", "-", "Slot attributes."]],
    examples: { standard: '<ChartCard data={sales} />', custom: '<ChartCard data={sales} renderTooltip={({ point }) => <strong>{point.value}</strong>} />' },
  },
  {
    slug: "delete-button", name: "Delete Button", description: "A confirmation control with async states.", category: "primitives", variants: ["Default", "Async", "Custom composition"], sourceFile: "packages/ui/src/components/delete-button.tsx", dependencies: ["cn", "motion", "react", "@devigner-ui/icons", "@devignerui/ui"], transformations: ["Rewrites ../lib/easing to @devignerui/ui/motion.", "Rewrites controllable-state to @devignerui/ui/hooks."],
    props: [["onConfirm", "function", "-", "Confirmation handler."], ["status", "DeleteButtonStatus", "-", "Controlled status."], ["defaultStatus", "DeleteButtonStatus", "idle", "Initial status."], ["onStatusChange", "function", "-", "Status callback."], ["renderConfirmation", "function", "-", "Confirmation slot."], ["classNames", "DeleteButtonClassNames", "-", "Slot classes."], ["slotProps", "DeleteButtonSlotProps", "-", "Slot attributes."], ["disabled", "boolean", "false", "Disables interaction."]],
    examples: { standard: '<DeleteButton onConfirm={remove} />', custom: '<DeleteButton onConfirm={remove} renderConfirmation={({ status }) => <span>{status}</span>} />' },
  },
  {
    slug: "timeline", name: "Timeline", description: "An interactive vertical timeline.", category: "data", variants: ["Default", "Custom composition"], sourceFile: "packages/ui/src/components/timeline.tsx", dependencies: ["cn", "motion", "react", "@devignerui/ui"], transformations: ["Rewrites ../lib/easing to @devignerui/ui/motion.", "Rewrites controllable-state to @devignerui/ui/hooks."],
    props: [["steps", "TimelineStep[]", "-", "Timeline steps."], ["activeId", "TimelineActiveId", "-", "Controlled step."], ["defaultActiveId", "TimelineActiveId", "-", "Initial step."], ["onActiveChange", "function", "-", "Step callback."], ["renderStep", "function", "-", "Step slot."], ["classNames", "TimelineClassNames", "-", "Slot classes."], ["slotProps", "TimelineSlotProps", "-", "Slot attributes."]],
    examples: { standard: '<Timeline steps={steps} />', custom: '<Timeline steps={steps} renderStep={({ step }) => <strong>{step.title}</strong>} />' },
  },
  {
    slug: "menu-dock", name: "Menu Dock", description: "A keyboard-navigable dock and menu.", category: "navigation", variants: ["Default", "Nested", "Custom composition"], sourceFile: "packages/ui/src/components/menu-dock.tsx", dependencies: ["cn", "motion", "react", "@devigner-ui/icons", "@devignerui/ui"], transformations: ["Rewrites ../lib/easing to @devignerui/ui/motion.", "Rewrites menu-path to @devignerui/ui/menu-path."],
    props: [["items", "MenuDockItem[]", "-", "Dock items."], ["active", "string", "-", "Active item ID."], ["path", "number[]", "-", "Controlled path."], ["onNavigate", "function", "-", "Path callback."], ["renderIcon", "function", "-", "Icon slot."], ["classNames", "MenuDockClassNames", "-", "Slot classes."], ["slotProps", "MenuDockSlotProps", "-", "Slot attributes."]],
    examples: { standard: '<MenuDock items={items} />', custom: '<MenuDock items={items} renderIcon={({ defaultIcon }) => <span>{defaultIcon}</span>} />' },
  },
  {
    slug: "date-range-picker", name: "Date Range Picker", description: "A calendar range picker with hover preview and presets.", category: "forms", variants: ["Default", "Presets", "Custom composition"], sourceFile: "packages/ui/src/components/date-range-picker.tsx", dependencies: ["cn", "motion", "react", "@devigner-ui/icons", "@devignerui/ui"], transformations: ["Rewrites ../lib/easing to @devignerui/ui/motion.", "Rewrites controllable-state and hover-capable hooks to @devignerui/ui/hooks.", "Rewrites ../lib/date-range to @devignerui/ui/date-range."],
    props: [["value", "DateRange | null", "-", "Controlled range."], ["defaultValue", "DateRange | null", "null", "Initial range."], ["onValueChange", "function", "-", "Range callback."], ["month", "Date", "-", "Controlled visible month."], ["defaultMonth", "Date", "-", "Initial visible month."], ["onMonthChange", "function", "-", "Month callback."], ["minDate", "Date", "-", "Earliest selectable day."], ["maxDate", "Date", "-", "Latest selectable day."], ["isDateDisabled", "function", "-", "Marks individual days unavailable."], ["title", "ReactNode", "Trip Dates", "Card title."], ["presets", "DateRangePreset[]", "Weekend, 3 nights, 1 week, 2 weeks", "Quick-select ranges; a preset lights up when the range matches it."], ["startLabel", "string", "Check-in", "Start field label."], ["endLabel", "string", "Check-out", "End field label."], ["renderBadge", "function", "-", "Replaces the badge text."], ["onClear", "function", "-", "Fires when Clear is pressed."], ["classNames", "DateRangePickerClassNames", "-", "Slot classes."], ["slotProps", "DateRangePickerSlotProps", "-", "Slot attributes."]],
    examples: { standard: '<DateRangePicker onValueChange={setRange} />', custom: '<DateRangePicker title="Stay" presets={presets} renderBadge={(range) => (range ? "Booked" : "Add dates")} />' },
  },
] as const;
