import type { ReactNode } from "react";
import { FicheDossier } from "./Fiche";
import { Filtre } from "./Filtre";
import {
  ARTISTES,
  SORTIES,
  GENRES,
  TYPES_SORTIE,
  UNIVERS_MUSIQUE,
  lienArtiste,
  lienSortie,
  nomGenre,
  nomsArtistes,
  origineArtiste,
  type Artiste,
  type Sortie,
} from "../data/musique";
import { cn } from "../lib/cn";

// Briques communes de l'univers Musique : fiches artiste / sortie, onglets, bulle « pourquoi », liens d'écoute.

/** Fiche artiste : même dossier à onglet que les marques, photo 352 × 300 */
export function CarteArtiste({
  artiste,
  className,
}: {
  artiste: Artiste;
  className?: string;
}) {
  return (
    <FicheDossier
      href={lienArtiste(artiste.slug)}
      onglet={artiste.cote}
      domaine={UNIVERS_MUSIQUE}
      meta={[origineArtiste(artiste), nomGenre(artiste.genres[0])]
        .filter(Boolean)
        .join(" · ")}
      titre={artiste.nom}
      description={artiste.description}
      image={artiste.image}
      pastille="Artiste"
      nomPropre
      className={className}
    />
  );
}

/** Fiche album / EP / single : pochette carrée */
export function CarteSortie({
  sortie,
  className,
}: {
  sortie: Sortie;
  className?: string;
}) {
  return (
    <FicheDossier
      href={lienSortie(sortie.slug)}
      onglet={sortie.cote}
      domaine={UNIVERS_MUSIQUE}
      meta={[nomsArtistes(sortie), sortie.annee].filter(Boolean).join(" · ")}
      titre={sortie.titre}
      description={sortie.description}
      image={sortie.cover}
      pastille={TYPES_SORTIE[sortie.type]}
      carre
      nomPropre
      className={className}
    />
  );
}

/** Onglets de l'univers : Accueil · Artistes · Albums · Genres */
export function OngletsMusique({
  actif,
}: {
  actif: "accueil" | "artistes" | "albums" | "genres";
}) {
  const onglets = [
    { id: "accueil", label: "Musique", href: "/musique" },
    {
      id: "artistes",
      label: "Artistes",
      href: "/musique/artistes",
      compte: ARTISTES.length,
    },
    {
      id: "albums",
      label: "Albums",
      href: "/musique/albums",
      compte: SORTIES.length,
    },
    {
      id: "genres",
      label: "Genres",
      href: "/musique/genres",
      compte: GENRES.length,
    },
  ] as const;
  return (
    <nav aria-label="Univers Musique">
      <ul className="flex flex-wrap gap-2 md:gap-3">
        {onglets.map((o) => (
          <li key={o.id} className="shrink-0">
            <Filtre
              label={o.label}
              compte={"compte" in o ? o.compte : undefined}
              couleur={
                o.id === "accueil"
                  ? UNIVERS_MUSIQUE.couleur
                  : "var(--color-signal)"
              }
              ton="blanc"
              actif={actif === o.id}
              href={o.href}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** La phrase qui justifie un rapprochement, posée au-dessus de la fiche (même bulle que les trios) */
export function AvecRaison({
  raison,
  children,
  className,
}: {
  raison: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full max-w-[400px] flex-col gap-3", className)}>
      <p className="verre rounded-[18px] bg-papier/70 px-4 py-3">
        <span className="t-cote-s block text-signal">Pourquoi</span>
        <span className="t-texte-s mt-1 block text-carbone">{raison}</span>
      </p>
      {children}
    </div>
  );
}

/** Boutons d'écoute externes (aucun lecteur intégré) — seulement les liens connus */
export function LiensEcoute({
  liens,
  className,
}: {
  liens: { deezer?: string; apple?: string; spotify?: string };
  className?: string;
}) {
  const liste = [
    { nom: "Spotify", url: liens.spotify },
    { nom: "Deezer", url: liens.deezer },
    { nom: "Apple Music", url: liens.apple },
  ].filter((l): l is { nom: string; url: string } => !!l.url);
  if (!liste.length) return null;
  return (
    <ul className={cn("flex flex-wrap gap-2.5", className)}>
      {liste.map((l, i) => (
        <li key={l.nom}>
          <a
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "t-cote-m inline-flex min-h-[54px] items-center gap-2 rounded-pill px-6 transition-colors duration-240 ease-rw md:min-h-[62px]",
              i === 0
                ? "bg-encre text-papier hover:bg-signal hover:text-blanc"
                : "verre-pill text-encre hover:bg-blanc",
            )}
          >
            Écouter sur {l.nom} <span aria-hidden>↗</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Titre de section « / À la une » + éventuel lien « Tout voir » */
export function TitreSectionMusique({
  titre,
  lien,
  children,
}: {
  titre: string;
  lien?: { href: string; label: string };
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="t-cote-s md:t-cote-m text-signal">/ {titre}</p>
        {children}
      </div>
      {lien && (
        <a
          href={lien.href}
          className="t-cote-m -my-3 py-3 transition-colors duration-240 ease-rw hover:text-signal"
        >
          {lien.label} →
        </a>
      )}
    </div>
  );
}

/** Grille de fiches commune (1 → 2 → 3 colonnes) */
export function GrilleFiches({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "grid justify-items-center gap-y-[30px] md:grid-cols-2 md:gap-x-10 md:gap-y-[52px] xl:grid-cols-3",
        className,
      )}
    >
      {children}
    </ul>
  );
}
