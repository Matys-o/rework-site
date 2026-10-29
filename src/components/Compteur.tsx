import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { EASE_REVELE } from "../lib/mouvement";

type CompteurProps = {
  valeur: number;
  /** Nombre de chiffres (072 → 3) */
  chiffres?: number;
  className?: string;
};

/** Compteur qui défile de 0 à sa valeur quand il entre à l'écran (une seule fois) */
export function Compteur({ valeur, chiffres = 0, className }: CompteurProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { once: true, amount: 0.6 });
  const reduit = useReducedMotion();
  const courant = useMotionValue(reduit ? valeur : 0);
  const texte = useTransform(courant, (v) => String(Math.round(v)).padStart(chiffres, "0"));

  useEffect(() => {
    if (!visible || reduit) return;
    const controles = animate(courant, valeur, { duration: 1.4, ease: EASE_REVELE });
    return () => controles.stop();
  }, [visible, reduit, valeur, courant]);

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{String(valeur).padStart(chiffres, "0")}</span>
      <motion.span aria-hidden className="tabular-nums">
        {texte}
      </motion.span>
    </span>
  );
}
