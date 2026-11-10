import { useEffect, useState } from "react";
import { prochesDe, type Reference } from "../data/archive";
import { raisonPour, type RaisonRew } from "../lib/rew/client";
import { Apparition } from "./Apparition";
import { Fiche } from "./Fiche";
import { Conteneur } from "./Grille";
import { CarteArtiste, CarteSortie } from "./Musique";
import { Orbe } from "./Rew/CarteRew";

/** Fiche (dossier à onglet) de n'importe quelle référence : marque, film, artiste ou sortie */
export function FicheReference({
  reference,
  className,
}: {
  reference: Reference;
  className?: string;
}) {
  if (reference.type === "marque")
    return <Fiche marque={reference.marque} className={className} />;
  if (reference.type === "artiste")
    return <CarteArtiste artiste={reference.artiste} className={className} />;
  return <CarteSortie sortie={reference.sortie} className={className} />;
}

/** Rangée de fiches : défile horizontalement en mobile / tablette, grille de 3 en desktop (même rangée que l'accueil) */
const RANGEE =
  "-mx-(--marge) mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-(--marge) px-(--marge) pb-4 [scrollbar-width:none] md:mt-[23px] xl:mx-0 xl:grid xl:grid-cols-3 xl:justify-items-center xl:gap-x-10 xl:gap-y-[52px] xl:overflow-visible xl:px-0";
const CELLULE =
  "w-[78vw] max-w-[360px] shrink-0 snap-start xl:w-full xl:max-w-[400px]";

/**
 * « Dans le même univers » : références proches dans toute l'archive (univers, tags, affinités, trios).
 * Rien d'assez proche → la section n'existe pas.
 */
export function MemeUnivers({
  id,
  exclure = [],
}: {
  id: number;
  exclure?: number[];
}) {
  const proches = prochesDe(id, exclure);
  if (!proches.length) return null;
  return (
    <section className="pt-16 md:pt-20" aria-labelledby={`meme-univers-${id}`}>
      <Conteneur>
        <p
          id={`meme-univers-${id}`}
          className="t-cote-s md:t-cote-m text-signal"
        >
          / Dans le même univers
        </p>
        <ul className={RANGEE}>
          {proches.map((r, i) => (
            <Apparition as="li" rang={i % 3} key={r.id} className={CELLULE}>
              <FicheReference reference={r} />
            </Apparition>
          ))}
        </ul>
      </Conteneur>
    </section>
  );
}

/** Le « Pourquoi » de REW, quand on arrive sur la fiche depuis une de ses recommandations (session du navigateur) */
export function usePourquoiRew(chemin: string) {
  const [raison, setRaison] = useState<RaisonRew>();
  useEffect(() => setRaison(raisonPour(chemin)), [chemin]);
  return raison;
}

/**
 * Bloc « Pourquoi · selon REW » : l'explication contextuelle de la recommandation, distincte du texte éditorial de la fiche.
 */
export function PourquoiRew({
  raison,
  className,
}: {
  raison?: RaisonRew;
  className?: string;
}) {
  if (!raison) return null;
  return (
    <aside
      className={`verre w-full rounded-[24px] px-5 py-4 md:px-6 md:py-5 ${className ?? ""}`}
      aria-label="Pourquoi REW recommande cette référence"
    >
      <p className="t-cote-s flex items-center gap-2 text-signal">
        <Orbe taille={14} />
        Pourquoi · selon REW
      </p>
      <p className="mt-2 font-serif text-[20px] leading-[1.25] text-carbone italic md:text-[22px]">
        {raison.raison.charAt(0).toUpperCase() + raison.raison.slice(1)}
      </p>
      {raison.demande && (
        <p className="t-texte-s mt-2 text-graphite">
          En réponse à : «{" "}
          {raison.demande.length >= 160
            ? `${raison.demande.slice(0, 157)}…`
            : raison.demande}{" "}
          »
        </p>
      )}
    </aside>
  );
}
