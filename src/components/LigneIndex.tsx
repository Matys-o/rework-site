import { categorieDe, lienDe, nomDe, type Reference } from "../data/archive";
import { DOMAINES, type Marque } from "../data/brands";
import { UNIVERS_MUSIQUE, origineArtiste, nomsArtistes } from "../data/musique";
import { cn } from "../lib/cn";
import { lienMarque } from "../lib/liens";
import { Aura } from "./Aura";
import { FlecheSurvol } from "./Icone";

/** Colonnes de la vue liste — partagées avec l'en-tête (N°, Nom, Domaine, Origine, Année).
 *  Mobile : carte empilée (cote · domaine · année / nom), flèche à droite. */
export const COLONNES_INDEX =
  "grid-cols-[1fr_44px] gap-x-3 gap-y-1 px-3 md:grid-cols-[112px_1fr_180px_44px] md:gap-6 md:px-6 xl:grid-cols-[112px_minmax(0,376px)_200px_240px_1fr_44px]";

export function EnTeteIndex() {
  return (
    <div className={cn("t-cote-s hidden text-graphite md:grid", COLONNES_INDEX)}>
      <span>N°</span>
      <span>Nom</span>
      <span className="hidden pl-5 md:block">Domaine</span>
      <span className="hidden xl:block">Origine</span>
      <span className="hidden xl:block">Année</span>
    </div>
  );
}

type DonneesLigne = {
  href: string;
  cote: string;
  nom: string;
  /** Domaine ou catégorie (« Mode », « Musique · Album ») et sa couleur d'aura */
  domaine: { nom: string; couleur: string };
  origine: string;
  annee: number;
  /** Le nom est un nom propre : la traduction du navigateur n'y touche pas */
  nomPropre: boolean;
};

// Ligne index — vue liste. Survol : fond blanc, aura du domaine, flèche ↗ sur rouge
function Ligne({ href, cote, nom, domaine, origine, annee, nomPropre }: DonneesLigne) {
  const t = "duration-240 ease-rw";
  return (
    <a
      href={href}
      className={cn(
        "group relative isolate grid min-h-[76px] items-center overflow-hidden rounded-[18px] py-3.5 transition-colors md:h-[88px] md:py-0",
        COLONNES_INDEX,
        t,
        "hover:bg-blanc",
      )}
    >
      <Aura
        couleur={domaine.couleur}
        flou="douce"
        className={cn("-top-20 -left-[60px] h-[240px] w-[320px] opacity-0 transition-opacity", t, "group-hover:opacity-100")}
      />
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-encre" />

      <span className="t-cote-s md:t-cote-m max-md:col-start-1 max-md:row-start-1 text-graphite">
        {cote}
        <span className="md:hidden">
          {" · "}
          {domaine.nom}
          {annee > 0 && ` · ${annee}`}
        </span>
      </span>
      <span
        className={cn(
          // Deux lignes au plus (la ligne fait 88 px en desktop) plutôt qu'une ellipse sur une seule
          "t-titre-m line-clamp-2 pb-[0.06em] transition-[translate] max-md:col-start-1 max-md:row-start-2 md:leading-[1]",
          t,
          "group-hover:translate-x-4",
        )}
        translate={nomPropre ? "no" : undefined}
      >
        {nom}
      </span>
      <span className="hidden items-center gap-2.5 md:flex">
        <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: domaine.couleur }} />
        <span className="t-cote-m truncate">{domaine.nom}</span>
      </span>
      <span className="t-texte-s hidden text-carbone xl:block">{origine}</span>
      <span className="t-cote-m hidden xl:block">{annee || "—"}</span>
      <span className={cn("grid size-11 place-items-center max-md:col-start-2 max-md:row-span-2 max-md:row-start-1 rounded-pill text-encre transition-colors", t, "group-hover:bg-signal group-hover:text-blanc")}>
        <FlecheSurvol />
      </span>
    </a>
  );
}

export function LigneIndex({ marque }: { marque: Marque }) {
  const domaine = DOMAINES[marque.domaine];
  return (
    <Ligne
      href={lienMarque(marque.slug)}
      cote={marque.cote}
      nom={marque.nom}
      domaine={domaine}
      origine={marque.origine}
      annee={marque.annee}
      nomPropre={marque.domaine !== "film"}
    />
  );
}

/** Ligne de n'importe quelle référence (résultats de la recherche globale) */
export function LigneReference({ reference: r }: { reference: Reference }) {
  if (r.type === "marque") return <LigneIndex marque={r.marque} />;
  return (
    <Ligne
      href={lienDe(r)}
      cote={r.type === "artiste" ? r.artiste.cote : r.sortie.cote}
      nom={nomDe(r)}
      domaine={{ nom: categorieDe(r), couleur: UNIVERS_MUSIQUE.couleur }}
      origine={r.type === "artiste" ? origineArtiste(r.artiste) : nomsArtistes(r.sortie)}
      annee={(r.type === "artiste" ? r.artiste.debut : r.sortie.annee) ?? 0}
      nomPropre
    />
  );
}
