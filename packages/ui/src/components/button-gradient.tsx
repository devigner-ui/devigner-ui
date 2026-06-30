"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonGradientProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
}

const ButtonGradient = React.forwardRef<HTMLButtonElement, ButtonGradientProps>(
  ({ className, size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "group relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium text-white transition-all duration-300",
          "bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-size-[200%_auto] bg-left hover:bg-right",
          "shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30",
          "disabled:pointer-events-none disabled:opacity-50",
          size === "sm" && "h-9 px-4 text-sm",
          size === "md" && "h-11 px-6 text-sm",
          size === "lg" && "h-12 px-8 text-base",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
ButtonGradient.displayName = "ButtonGradient";

export { ButtonGradient };
