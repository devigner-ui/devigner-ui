"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { DateRangePicker, type DateRange } from "devignerui";
import { SPRING_PRESS, SPRING_RETRACT } from "devignerui/motion";
import { IconCalendar } from "@devigner-ui/icons";

export default function DateRangePickerDemo() {
  const [today] = useState(() => new Date());
  return <DateRangePicker minDate={today} />;
}

const formatDay = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** The picker behind a button: it plays its opening each time it opens and
 *  shrinks back toward the button on close. */
export function DateRangePickerTrigger() {
  const [today] = useState(() => new Date());
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative flex flex-col items-center">
      <motion.button
        ref={button}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        whileTap={{ scale: 0.97 }}
        transition={SPRING_PRESS}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-4 text-[13px] font-medium text-foreground smooth-shadow-ring-sm transition-colors duration-200 ease-out outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-ring"
      >
        <IconCalendar className="size-4 text-muted-foreground" strokeWidth={2} />
        {range
          ? `${formatDay(range.start)} - ${formatDay(range.end)}`
          : "Add dates"}
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Trip dates"
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={SPRING_RETRACT}
            className="absolute top-12 origin-top"
          >
            <DateRangePicker
              minDate={today}
              value={range}
              onValueChange={setRange}
              appear
              className="origin-top"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
