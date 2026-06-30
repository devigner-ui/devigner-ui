import * as React from "react";
import { motion, type Variants } from "motion/react";
import { cn } from "../lib/utils";

const heroVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const staggerChildren: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export interface HeroSectionProps {
  className?: string;
  variant?: "centered" | "split" | "minimal";
  title: string;
  description?: string;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}

function HeroSectionCentered({
  className,
  title,
  description,
  primaryAction,
  secondaryAction,
}: HeroSectionProps) {
  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={staggerChildren}
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      <motion.h1
        variants={heroVariants}
        className="text-5xl/14 font-semibold tracking-[-2.88px] text-foreground"
      >
        {title}
      </motion.h1>
      {description && (
        <motion.p
          variants={heroVariants}
          className="mt-6 max-w-2xl text-base/6 text-text-secondary"
        >
          {description}
        </motion.p>
      )}
      {(primaryAction || secondaryAction) && (
        <motion.div variants={heroVariants} className="mt-8 flex gap-4">
          {primaryAction}
          {secondaryAction}
        </motion.div>
      )}
    </motion.section>
  );
}

function HeroSectionSplit({
  className,
  title,
  description,
  primaryAction,
  secondaryAction,
}: HeroSectionProps) {
  return (
    <section
      className={cn(
        "flex flex-col items-center justify-between gap-12 py-12 md:flex-row",
        className
      )}
    >
      <div className="flex-1 space-y-6">
        <motion.h1
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl/14 font-semibold tracking-[-2.88px] text-foreground"
        >
          {title}
        </motion.h1>
        {description && (
          <motion.p
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-base/6 text-text-secondary"
          >
            {description}
          </motion.p>
        )}
        {(primaryAction || secondaryAction) && (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex gap-4"
          >
            {primaryAction}
            {secondaryAction}
          </motion.div>
        )}
      </div>
      <div className="flex-1" />
    </section>
  );
}

function HeroSectionMinimal({
  className,
  title,
  description,
  primaryAction,
  secondaryAction,
}: HeroSectionProps) {
  return (
    <section className={cn("py-12", className)}>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-[32px]/12 font-semibold tracking-[-1.28px] text-foreground"
      >
        {title}
      </motion.h1>
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 max-w-xl text-base/6 text-text-secondary"
        >
          {description}
        </motion.p>
      )}
      {(primaryAction || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 flex gap-4"
        >
          {primaryAction}
          {secondaryAction}
        </motion.div>
      )}
    </section>
  );
}

function HeroSection(props: HeroSectionProps) {
  const { variant = "centered", ...rest } = props;
  switch (variant) {
    case "split":
      return <HeroSectionSplit {...rest} />;
    case "minimal":
      return <HeroSectionMinimal {...rest} />;
    default:
      return <HeroSectionCentered {...rest} />;
  }
}

export { HeroSection };
