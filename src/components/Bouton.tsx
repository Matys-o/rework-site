import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import type { PointerEvent, ReactNode } from "react";
import { cn } from "../lib/cn";
import { useEstMobile } from "../lib/mouvement";
import { FlecheSurvol } from "./Icone";

type BoutonType = "encre" | "signal" | "verre";

type BoutonProps = {
  type?: BoutonType;
  href?: string;
  /** Lien vers un autre site : nouvel onglet */
  externe?: boolean;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
};

const STYLES: Record<BoutonType, string> = {
  encre: "bg-encre text-papier hover:bg-signal hover:text-blanc",
  signal: "bg-signal text-encre hover:bg-encre hover:text-blanc",
  verre: "verre-pill text-encre hover:bg-blanc",
};

const ATTRACTION_MAX = 8; // px

// Bouton — Encre · Signal · Verre. Survol : inversion, ombre Levée, flèche ↗,
// et effet magnétique : le bouton se laisse attirer par le curseur (max 8 px).
export function Bouton({ type = "encre", href, externe = false, onClick, className, children }: BoutonProps) {
  const reduit = useReducedMotion();
  const mobile = useEstMobile();
  const actif = !reduit && !mobile;
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 15, mass: 0.4 });
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 15, mass: 0.4 });

  const borner = (v: number) => Math.max(-ATTRACTION_MAX, Math.min(ATTRACTION_MAX, v));
  const magnetisme = actif
    ? {
        onPointerMove: (e: PointerEvent<HTMLElement>) => {
          if (e.pointerType !== "mouse") return;
          const r = e.currentTarget.getBoundingClientRect();
          x.set(borner((e.clientX - (r.left + r.width / 2)) * 0.3));
          y.set(borner((e.clientY - (r.top + r.height / 2)) * 0.3));
        },
        onPointerLeave: () => {
          x.set(0);
          y.set(0);
        },
      }
    : {};

  const classes = cn(
    "group relative inline-flex items-center gap-2.5 rounded-pill py-[15px] pr-5 pl-6 text-[15px] leading-[1.5] font-semibold whitespace-nowrap",
    "transition-[background-color,color] duration-240 ease-rw",
    // Ombre Levée en pseudo-élément : seule son opacité varie
    type !== "verre" &&
      "after:pointer-events-none after:absolute after:inset-0 after:rounded-pill after:opacity-0 after:shadow-levee after:transition-opacity after:duration-240 hover:after:opacity-100",
    STYLES[type],
    className,
  );
  const contenu = (
    <>
      {children}
      <FlecheSurvol />
    </>
  );

  return href ? (
    <motion.a href={href} {...(externe && { target: "_blank", rel: "noreferrer" })} className={classes} style={{ x, y }} {...magnetisme}>
      {contenu}
    </motion.a>
  ) : (
    <motion.button type="button" onClick={onClick} className={cn(classes, "cursor-pointer")} style={{ x, y }} {...magnetisme}>
      {contenu}
    </motion.button>
  );
}
