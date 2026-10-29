import { motion, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import { useMemo, type CSSProperties, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { pointeurGlobal } from "../lib/mouvement";

type AuraProps = {
  couleur: string;
  /** Position et taille (classes Tailwind) */
  className?: string;
  /** Diffusion = halo large · douce = halo plus serré (cartes) */
  flou?: "diffusion" | "douce";
  /** Ampleur de la dérive (1 = ±60 px) — réduite dans les cartes */
  amplitude?: number;
  /** Sensibilité à la souris (0 → 1) ; tirée au hasard si absente = effet de profondeur */
  profondeur?: number;
  /** Décalage piloté de l'extérieur (curseur dans une carte) — remplace le suivi global */
  suivi?: { x: MotionValue<number>; y: MotionValue<number> };
};

const hasard = (min: number, max: number) => min + Math.random() * (max - min);
const signe = () => (Math.random() < 0.5 ? -1 : 1);

/**
 * Aura — halo de couleur en radial-gradient (bien plus léger qu'un filter: blur).
 * Trois couches, chacune n'anime que transform :
 *   1. décalage souris (lerp lent) · 2. dérive en boucle 18–30 s · 3. le dégradé.
 * Ne s'utilise jamais nue : toujours derrière du verre.
 */
export function Aura({ couleur, className, flou = "diffusion", amplitude = 1, profondeur, suivi }: AuraProps) {
  const reduit = useReducedMotion();

  // Souris : chaque aura a sa propre intensité (max 40 px) → profondeur
  const intensite = useMemo(() => profondeur ?? hasard(0.25, 1), [profondeur]);
  const { x: px, y: py } = pointeurGlobal();
  const cibleX = useTransform(px, (v) => (reduit ? 0 : v * 40 * intensite));
  const cibleY = useTransform(py, (v) => (reduit ? 0 : v * 40 * intensite));
  const lentX = useSpring(cibleX, { stiffness: 12, damping: 14, mass: 1.4 });
  const lentY = useSpring(cibleY, { stiffness: 12, damping: 14, mass: 1.4 });

  // Dérive : rythme, trajectoire et phase propres à chaque aura — jamais synchronisées.
  // Animation CSS (keyframes « derive » dans tokens.css) : tourne sur le compositeur, zéro JS par image.
  const derive = useMemo(() => {
    const duree = hasard(18, 30);
    const px = () => `${(signe() * hasard(25, 60) * amplitude).toFixed(1)}px`;
    return {
      "--d": `${duree.toFixed(1)}s`,
      "--retard": `${(-Math.random() * duree * 2).toFixed(1)}s`,
      "--x1": px(),
      "--y1": px(),
      "--s1": hasard(0.9, 1.15).toFixed(3),
      "--r1": `${(signe() * hasard(2, 8)).toFixed(1)}deg`,
      "--x2": px(),
      "--y2": px(),
      "--s2": hasard(0.9, 1.15).toFixed(3),
      "--r2": `${(signe() * hasard(2, 8)).toFixed(1)}deg`,
    } as CSSProperties;
  }, [amplitude]);

  return (
    <motion.span
      aria-hidden
      className={cn("aura", className)}
      style={suivi && !reduit ? { x: suivi.x, y: suivi.y } : { x: lentX, y: lentY }}
    >
      <span className="aura-derive absolute inset-0 block" style={derive}>
        <span
          className={cn("absolute block", flou === "douce" ? "-inset-[24%]" : "-inset-[30%]")}
          style={{ "--c": couleur } as CSSProperties}
          data-aura
        />
      </span>
    </motion.span>
  );
}

type AuraAnimeeProps = {
  className?: string;
  children?: ReactNode;
  /** Parallax vertical appliqué aux seules auras (le cadre reste en place) */
  parallaxY?: MotionValue<number>;
  /** Position de l'aura signal (classes Tailwind) ; la déplacer resserre aussi sa dérive et son suivi souris */
  signal?: string;
};

/** Aura animée — scène papier + 4 auras qui respirent, contenu posé sur du verre.
 *  Le positionnement (relative / absolute / fixed) est donné par `className`. */
export function AuraAnimee({ className, children, parallaxY, signal }: AuraAnimeeProps) {
  return (
    <div className={cn("isolate overflow-hidden bg-papier", className)}>
      <motion.div aria-hidden className="absolute inset-0 -z-10" style={parallaxY ? { y: parallaxY } : undefined}>
        <Aura couleur="var(--color-aura-mode)" profondeur={0.5} className="top-[20%] -left-[8%] aspect-square w-[70%] max-w-[1000px]" />
        <Aura couleur="var(--color-aura-digital)" profondeur={0.8} className="-top-[14%] left-[56%] aspect-[10/9] w-[70%] max-w-[1000px]" />
        <Aura couleur="var(--color-aura-design)" profondeur={0.35} className="top-[48%] left-[32%] aspect-[49/41] w-[68%] max-w-[980px]" />
        <Aura
          couleur="var(--color-signal)"
          flou="douce"
          amplitude={signal ? 0.5 : 1}
          profondeur={signal ? 0.4 : 1}
          className={signal ?? "top-[30%] left-[58%] aspect-square w-[25%] max-w-[360px]"}
        />
      </motion.div>
      {children}
    </div>
  );
}
