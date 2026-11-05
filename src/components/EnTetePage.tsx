import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { AuraAnimee } from "./Aura";
import { Conteneur } from "./Grille";

// Éléments de titre communs à toutes les pages, repris de l'accueil (maquette 1135:902) :
// pastille « point rouge », titre Display ExtraBold, phrase simple en gris.

/** Titre de section de l'accueil (« 5 univers », « Ajoutées cette semaine ») */
export const TITRE_SECTION =
  "font-display text-[28px] leading-[1.1] font-bold tracking-[-0.02em] [font-variation-settings:'opsz'_14]";

/** Grand titre Display ExtraBold (titre du trio, titres de page) */
export const TITRE_PAGE =
  "font-display text-[clamp(40px,6vw,84px)] leading-[0.95] font-extrabold tracking-[-0.05em] [font-variation-settings:'opsz'_96]";

/** Pastille blanche avec point rouge — « Mis à jour chaque semaine » */
export function Pastille({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "t-cote-s inline-flex items-center gap-2 rounded-pill bg-blanc px-3.5 py-2 text-encre",
        className,
      )}
    >
      <span aria-hidden className="size-2.5 rounded-full bg-signal" />
      {children}
    </p>
  );
}

type EnTetePageProps = {
  pastille?: ReactNode;
  titre: ReactNode;
  texte?: ReactNode;
  /** Au-dessus de la pastille (lien retour) */
  avant?: ReactNode;
  /** Sous le texte (recherche, filtres, boutons) */
  children?: ReactNode;
  className?: string;
};

/** En-tête de page : auras qui respirent, pastille, titre, phrase simple */
export function EnTetePage({
  pastille,
  titre,
  texte,
  avant,
  children,
  className,
}: EnTetePageProps) {
  return (
    <section className={cn("relative isolate", className)}>
      <AuraAnimee className="absolute inset-x-0 -top-[300px] -z-10 h-[680px] md:-top-[420px] md:h-[900px]">
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[300px] bg-gradient-to-b from-papier/0 to-papier"
        />
      </AuraAnimee>
      <Conteneur className="pt-[100px] md:pt-[140px]">
        {avant && <div className="mb-7 md:mb-10">{avant}</div>}
        {pastille && <Pastille>{pastille}</Pastille>}
        <h1 className={cn(TITRE_PAGE, !!pastille && "mt-4 md:mt-5", "md:-ml-1")}>
          {titre}
        </h1>
        {texte && (
          <p className="mt-4 max-w-[720px] text-[17px] leading-[1.5] text-graphite md:mt-5 md:text-[20px]">
            {texte}
          </p>
        )}
        {children}
      </Conteneur>
    </section>
  );
}
