import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-pill border px-2.5 py-0.5 text-xs/4 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-accent text-white hover:bg-accent-hover",
        secondary:
          "border-transparent bg-surface text-foreground hover:bg-surface-hover",
        outline:
          "border-border text-foreground",
        destructive:
          "border-transparent bg-destructive text-white hover:bg-destructive/90",
        success:
          "border-transparent bg-success text-white",
        warning:
          "border-transparent bg-warning text-white",
        link:
          "border-transparent bg-transparent text-accent hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
