import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { EASE_REVELE } from "../lib/mouvement";

type ApparitionProps = {
  children: ReactNode;
  className?: string;
  /** Rang dans une série de cartes → décalage (stagger) de 80 ms */
  rang?: number;
  as?: "div" | "li" | "p" | "section" | "header";
};

const balises = { div: motion.div, li: motion.li, p: motion.p, section: motion.section, header: motion.header };

/** Apparition au scroll : y 40 px → 0, opacité 0 → 1, une seule fois */
export function Apparition({ children, className, rang = 0, as = "div" }: ApparitionProps) {
  const reduit = useReducedMotion();
  const Balise = balises[as];
  if (reduit) return <Balise className={className}>{children}</Balise>;
  return (
    <Balise
      className={className}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.8, ease: EASE_REVELE, delay: rang * 0.08 }}
    >
      {children}
    </Balise>
  );
}
