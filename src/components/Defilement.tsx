import Lenis from "lenis";
import { cancelFrame, frame, useReducedMotion } from "motion/react";
import { useEffect } from "react";
import { lenis } from "../lib/mouvement";

// Scroll fluide Lenis sur tout le site, synchronisé sur la boucle d'animation de Motion
// (une seule requestAnimationFrame pour le scroll, les parallax et les animations).
// Coupé si prefers-reduced-motion.
export function Defilement() {
  const reduit = useReducedMotion();

  useEffect(() => {
    if (reduit) return;
    const instance = new Lenis({ autoRaf: false, anchors: { offset: -100 }, lerp: 0.1 });
    lenis.definir(instance);

    const tic = ({ timestamp }: { timestamp: number }) => instance.raf(timestamp);
    frame.update(tic, true);

    return () => {
      cancelFrame(tic);
      instance.destroy();
      lenis.definir(null);
    };
  }, [reduit]);

  return null;
}
