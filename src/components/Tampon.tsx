import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useId, type ReactNode } from "react";
import { cn } from "../lib/cn";

type TamponProps = {
  /** Texte qui court sur le cercle — finir par « · » pour boucler proprement */
  texte: string;
  /** Monogramme au centre */
  centre?: ReactNode;
  /** Diamètre en px */
  taille?: number;
  className?: string;
};

// Tampon — sceau circulaire : la preuve qu'une marque est entrée dans l'archive (DA 07).
// L'anneau tourne avec le scroll (1 tour / 1500 px). Couleur = currentColor.
export function Tampon({ texte, centre, taille = 176, className }: TamponProps) {
  const id = useId();
  const reduit = useReducedMotion();
  const { scrollY } = useScroll();
  const rotate = useTransform(scrollY, (v) => (reduit ? 0 : (v / 1500) * 360));
  return (
    <span
      aria-hidden
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: taille, height: taille }}
    >
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute inset-0 size-full overflow-visible will-change-transform"
        fill="none"
        stroke="currentColor"
        style={{ rotate }}
      >
        <defs>
          <path id={id} d="M50 11a39 39 0 1 1 0 78a39 39 0 1 1 0-78" />
        </defs>
        <circle cx="50" cy="50" r="47.3" strokeWidth="1.15" />
        <circle cx="50" cy="50" r="32.3" strokeWidth="0.6" />
        <text fill="currentColor" stroke="none" className="font-mono font-medium uppercase" fontSize="6.8">
          <textPath href={`#${id}`} textLength="240" lengthAdjust="spacing">
            {texte}
          </textPath>
        </text>
      </motion.svg>
      {centre && (
        <span
          className="relative font-display leading-none font-extrabold tracking-[-0.06em] [font-variation-settings:'opsz'_96]"
          style={{ fontSize: taille * 0.255 }}
        >
          {centre}
        </span>
      )}
    </span>
  );
}
