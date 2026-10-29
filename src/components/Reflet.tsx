import { motion, type MotionStyle } from "motion/react";
import { cn } from "../lib/cn";

/** Reflet lumineux qui suit la souris sur le verre — un disque flou déplacé en transform */
export function Reflet({ style, className }: { style: MotionStyle; className?: string }) {
  return (
    <motion.span
      aria-hidden
      style={style}
      className={cn(
        "pointer-events-none absolute top-0 left-0 size-[360px] rounded-full mix-blend-soft-light will-change-transform",
        "bg-[radial-gradient(closest-side,rgb(255_255_255/0.85),rgb(255_255_255/0.25)_45%,transparent)]",
        className,
      )}
    />
  );
}
