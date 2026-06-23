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
        "flex flex-col items-center justify-center py-[48px] text-center",
        className
      )}
    >
      <motion.h1
        variants={heroVariants}
        className="text-[48px] font-semibold leading-[56px] tracking-[-2.88px] text-foreground"
      >
        {title}
      </motion.h1>
      {description && (
        <motion.p
          variants={heroVariants}
          className="mt-[24px] max-w-2xl text-[16px] leading-[24px] text-text-secondary"
        >
          {description}
        </motion.p>
      )}
      {(primaryAction || secondaryAction) && (
        <motion.div variants={heroVariants} className="mt-[32px] flex gap-[16px]">
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
        "flex flex-col items-center justify-between gap-[48px] py-[48px] md:flex-row",
        className
      )}
    >
      <div className="flex-1 space-y-[24px]">
        <motion.h1
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-[48px] font-semibold leading-[56px] tracking-[-2.88px] text-foreground"
        >
          {title}
        </motion.h1>
        {description && (
          <motion.p
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-[16px] leading-[24px] text-text-secondary"
          >
            {description}
          </motion.p>
        )}
        {(primaryAction || secondaryAction) && (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex gap-[16px]"
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
    <section className={cn("py-[48px]", className)}>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-[32px] font-semibold leading-[48px] tracking-[-1.28px] text-foreground"
      >
        {title}
      </motion.h1>
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-[16px] max-w-xl text-[16px] leading-[24px] text-text-secondary"
        >
          {description}
        </motion.p>
      )}
      {(primaryAction || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-[24px] flex gap-[16px]"
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
