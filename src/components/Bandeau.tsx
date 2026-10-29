import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { Fragment } from "react";
import { cn } from "../lib/cn";

const MOTS = ["culture", "design", "tech", "mode", "digital", "archive"];

type BandeauProps = {
  mots?: string[];
  /** Durée d'un tour complet à vitesse de base, en secondes */
  duree?: number;
  className?: string;
};

/** Ramène v dans [min, max[ (boucle sans couture) */
const boucler = (min: number, max: number, v: number) => {
  const plage = max - min;
  return ((((v - min) % plage) + plage) % plage) + min;
};

// Bandeau défilant — boucle infinie dont la vitesse suit la vélocité du scroll :
// accélère quand on scrolle vite, s'inverse quand on remonte, se penche (skew), puis revient à la vitesse de base.
// 74 px / 50 px en mobile, 124 px / 84 px en desktop.
export function Bandeau({ mots = MOTS, duree = 20, className }: BandeauProps) {
  const reduit = useReducedMotion();
  const position = useMotionValue(0); // en % de la piste
  const { scrollY } = useScroll();
  const vitesseScroll = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 300 });
  const facteur = useTransform(vitesseScroll, [-1000, 0, 1000], [-4, 0, 4], { clamp: false });
  const skew = useTransform(vitesseScroll, [-2500, 0, 2500], [7, 0, -7]);

  useAnimationFrame((_, delta) => {
    if (reduit) return;
    const base = -50 / duree; // %/s : une demi-piste = une série complète
    position.set(position.get() + base * (1 + facteur.get()) * (delta / 1000));
  });

  const x = useTransform(position, (v) => `${boucler(-50, 0, v)}%`);

  const serie = (
    <span className="flex shrink-0 items-center pr-[0.25em]">
      {mots.map((m) => (
        <Fragment key={m}>
          <span className="pl-[0.25em]">{m}</span>
          <span className="text-signal">°</span>
        </Fragment>
      ))}
    </span>
  );

  return (
    <div
      role="marquee"
      aria-label={mots.join(", ")}
      className={cn("flex h-[74px] items-center overflow-hidden bg-encre text-papier select-none md:h-[124px]", className)}
    >
      <motion.div
        aria-hidden
        style={reduit ? undefined : { x, skewX: skew }}
        className="flex w-max font-display text-[50px] leading-none font-extrabold tracking-[-0.04em] whitespace-nowrap will-change-transform [font-variation-settings:'opsz'_96] md:text-[84px]"
      >
        {serie}
        {serie}
        {serie}
        {serie}
      </motion.div>
    </div>
  );
}
