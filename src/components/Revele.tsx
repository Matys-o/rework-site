import { motion, useReducedMotion } from "motion/react";
import { Fragment, useEffect, useState } from "react";
import { cn } from "../lib/cn";
import { EASE_REVELE } from "../lib/mouvement";

const CASCADE = 0.03; // 30 ms entre deux lettres
const DUREE = 0.9;

/** Durée totale de la cascade d'un texte, pour caler ce qui suit */
export const dureeCascade = (texte: string) => texte.replace(/\s/g, "").length * CASCADE;

type TitreReveleProps = {
  texte: string;
  className?: string;
  /** Délai avant la première lettre, en secondes */
  delai?: number;
  /** false pour un nom propre (marque) : la traduction du navigateur ne le touche pas */
  traduire?: boolean;
};

/**
 * Lettres qui montent d'un masque, en cascade (30 ms, 900 ms, ease [0.22, 1, 0.36, 1]).
 * Un masque par mot pour garder les retours à la ligne naturels.
 * Le texte complet reste lisible par les lecteurs d'écran.
 */
export function TitreRevele({ texte, className, delai = 0, traduire = true }: TitreReveleProps) {
  const reduit = useReducedMotion();
  // Cascade terminée → le titre redevient un seul nœud texte : la traduction du navigateur traduit la phrase,
  // pas des lettres isolées (et le copier-coller, la recherche dans la page retrouvent le mot entier).
  const [fini, setFini] = useState(false);
  useEffect(() => {
    if (reduit) return;
    const minuteur = window.setTimeout(() => setFini(true), (delai + dureeCascade(texte) + DUREE) * 1000 + 100);
    return () => clearTimeout(minuteur);
  }, [reduit, delai, texte]);

  const langue = traduire ? undefined : "no";
  if (reduit || fini)
    return (
      <span className={className} translate={langue}>
        {texte}
      </span>
    );

  let rang = 0;
  const mots = texte.split(" ");
  return (
    // translate="no" pendant la cascade : inutile de traduire des lettres une à une, la version finale le sera
    <span className={className} aria-label={texte} role="text" translate="no">
      {mots.map((mot, i) => (
        <Fragment key={i}>
          {/* Masque élargi par du padding, compensé par une marge négative (mise en page inchangée) :
              le letter-spacing négatif réduit la boîte de la dernière lettre sous son dessin (~0.05em),
              et un overflow: hidden à ras la rognerait. En bas, 0.08em : assez pour cacher les lettres au départ. */}
          <span aria-hidden className="masque-lettres inline-flex overflow-hidden align-bottom">
            {[...mot].map((lettre, j) => (
              <motion.span
                key={j}
                className="inline-block will-change-transform"
                initial={{ y: "110%" }}
                animate={{ y: "0%" }}
                transition={{ duration: DUREE, ease: EASE_REVELE, delay: delai + rang++ * CASCADE }}
              >
                {lettre}
              </motion.span>
            ))}
          </span>
          {i < mots.length - 1 && " "}
        </Fragment>
      ))}
    </span>
  );
}

/** Le mot en Instrument Serif : arrive après le titre, d'un léger flou au net */
export function SerifRevele({ texte, className, delai = 0.2, traduire = true }: TitreReveleProps) {
  const reduit = useReducedMotion();
  const langue = traduire ? undefined : "no";
  if (reduit)
    return (
      <span className={className} translate={langue}>
        {texte}
      </span>
    );
  return (
    <motion.span
      translate={langue}
      className={cn("will-change-[opacity,transform,filter]", className)}
      initial={{ opacity: 0, y: "0.12em", filter: "blur(10px)" }}
      animate={{ opacity: 1, y: "0em", filter: "blur(0px)" }}
      transition={{ duration: DUREE, ease: EASE_REVELE, delay: delai }}
    >
      {texte}
    </motion.span>
  );
}
