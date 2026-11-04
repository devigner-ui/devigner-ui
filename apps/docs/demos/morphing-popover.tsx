"use client";

import { useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MorphingPopover } from "devignerui";
import { SPRING_SWAP } from "devignerui/motion";
import { IconAddCircle } from "@devigner-ui/icons";
import { cn } from "@/lib/utils";
import backdrop from "../assets/liquid-glass/backdrop.jpg";

/** What the docs Settings panel drives; the gallery demo uses the defaults. */
export const POPOVER_DEFAULTS = {
  transparency: 0.05,
  icon: true,
  disabled: false,
  /** Draw the glass with the WebGL shader over a photo. */
  shader: false,
  blur: 4,
};
export type PopoverConfig = typeof POPOVER_DEFAULTS;

export default function MorphingPopoverDemo(props: Partial<PopoverConfig>) {
  const { transparency, icon, disabled, shader, blur } = {
    ...POPOVER_DEFAULTS,
    ...props,
  };
  const [saved, setSaved] = useState(0);
  const fieldId = useId();
  const area = useRef<HTMLImageElement>(null);
  return (
    // With the shader, a night photo fills the stage for it to bend, dark in
    // both themes like the Liquid Glass preview.
    <div
      className={cn(
        "flex flex-col items-center gap-4",
        shader &&
          "dark relative h-120 w-full max-w-3xl justify-center overflow-hidden rounded-2xl",
      )}
    >
      {shader && (
        <img
          ref={area}
          src={backdrop.src}
          alt=""
          className="absolute inset-0 size-full object-cover"
          draggable={false}
        />
      )}
      <MorphingPopover
        backdrop={shader ? { src: backdrop.src, area } : undefined}
        blur={blur}
        label="Add note"
        icon={icon ? <IconAddCircle strokeWidth={2} /> : undefined}
        transparency={transparency}
        disabled={disabled}
      >
        {(close) => (
          <form
            className="flex w-64 flex-col gap-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              setSaved((n) => n + 1);
              e.currentTarget.reset();
              close();
            }}
          >
            <label htmlFor={fieldId} className="text-[13px] font-semibold">
              Note for this frame
            </label>
            <textarea
              id={fieldId}
              rows={3}
              placeholder="Tighten the gap under the title"
              className="resize-none rounded-2xl bg-background/60 px-3 py-2 text-[14px] text-foreground outline-none! ring-1 ring-foreground/10 backdrop-blur-md placeholder:text-text-secondary/70 focus:ring-foreground/25"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="h-9 cursor-pointer rounded-full px-4 text-[13px] font-medium text-text-secondary hover:bg-foreground/6 hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 cursor-pointer rounded-full bg-foreground px-4 text-[13px] font-medium text-background hover:bg-foreground/85"
              >
                Save note
              </button>
            </div>
          </form>
        )}
      </MorphingPopover>
      <p className="relative h-5 text-[13px] text-success" aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          {saved > 0 && (
            <motion.span
              key={saved}
              initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
              transition={SPRING_SWAP}
              className="block"
            >
              Note saved
            </motion.span>
          )}
        </AnimatePresence>
      </p>
    </div>
  );
}
