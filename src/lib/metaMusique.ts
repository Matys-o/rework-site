// Métadonnées des pages Musique (même source que meta.ts : prérendu + useMeta)
import {
  ARTISTES,
  GENRES,
  SORTIES,
  TYPES_SORTIE,
  artistesDe,
  lienArtiste,
  lienGenre,
  lienSortie,
  nomGenre,
  nomLabel,
  nomsArtistes,
  origineArtiste,
  type Artiste,
  type Genre,
  type Sortie,
} from "../data/musique";
import { ajuster, base, type Meta } from "./meta";
import { NOM_SITE, absolue } from "./site";

export type OngletMusique = "accueil" | "artistes" | "albums" | "genres";

const CHEMINS: Record<OngletMusique, string> = {
  accueil: "/musique",
  artistes: "/musique/artistes",
  albums: "/musique/albums",
  genres: "/musique/genres",
};

export function metaMusique(onglet: OngletMusique = "accueil"): Meta {
  const titres: Record<OngletMusique, string> = {
    accueil: `Musique — artistes, albums et scènes | ${NOM_SITE}`,
    artistes: `${ARTISTES.length} artistes — Musique | ${NOM_SITE}`,
    albums: `${SORTIES.length} albums, EP et singles — Musique | ${NOM_SITE}`,
    genres: `${GENRES.length} genres musicaux — Musique | ${NOM_SITE}`,
  };
  const textes: Record<OngletMusique, string> = {
    accueil: `Rap, techno, électronique, indie : ${ARTISTES.length} artistes et ${SORTIES.length} sorties choisis par la rédaction, avec leurs proches et leur scène.`,
    artistes: `${ARTISTES.length} artistes à découvrir, de la hard techno de Cologne au rap français. Filtrez par genre, origine, période, ambiance ou label.`,
    albums: `${SORTIES.length} albums, EP et singles, des classiques aux sorties récentes. Filtrez par format, genre, période, ambiance ou label.`,
    genres: `${GENRES.length} genres et sous-genres, du rap à la techno industrielle, expliqués simplement avec leurs artistes et leurs albums.`,
  };
  return base({
    titre: titres[onglet],
    description: ajuster(textes[onglet]),
    chemin: CHEMINS[onglet],
    resume: textes[onglet],
  });
}

export function metaArtiste(a: Artiste): Meta {
  const genres = a.genres.map(nomGenre).join(", ");
  const contexte = `${a.nom} : ${[genres.toLowerCase(), origineArtiste(a)].filter(Boolean).join(", ")}.`;
  const url = absolue(lienArtiste(a.slug));
  return base({
    titre: `${a.nom} — Musique${a.pays ? `, ${a.pays}` : ""} | ${NOM_SITE}`,
    description: ajuster(
      a.description,
      contexte,
      `Fiche ${a.cote} sur Rework.`,
    ),
    chemin: lienArtiste(a.slug),
    type: "article",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "MusicGroup",
        name: a.nom,
        url,
        description: a.description,
        image: absolue(a.image),
        genre: a.genres.map(nomGenre),
        ...(a.pays && {
          foundingLocation: { "@type": "Place", name: origineArtiste(a) },
        }),
        sameAs: Object.values(a.liens).filter(Boolean),
      },
    ],
    resume: `${a.nom} — ${genres}. ${a.description}`,
  });
}

export function metaSortie(s: Sortie): Meta {
  const noms = nomsArtistes(s);
  const type = TYPES_SORTIE[s.type];
  const contexte = `${type} de ${noms}${s.annee ? `, sorti en ${s.annee}` : ""}${nomLabel(s.label) ? ` chez ${nomLabel(s.label)}` : ""}.`;
  return base({
    titre: `${s.titre} — ${noms}${s.annee ? `, ${s.annee}` : ""} | ${NOM_SITE}`,
    description: ajuster(
      s.description,
      contexte,
      `Fiche ${s.cote} sur Rework.`,
    ),
    chemin: lienSortie(s.slug),
    type: "article",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "MusicAlbum",
        name: s.titre,
        url: absolue(lienSortie(s.slug)),
        description: s.description,
        image: absolue(s.cover),
        byArtist: artistesDe(s).map((a) => ({
          "@type": "MusicGroup",
          name: a.nom,
          url: absolue(lienArtiste(a.slug)),
        })),
        ...(s.annee && { datePublished: String(s.annee) }),
        genre: s.genres.map(nomGenre),
        sameAs: Object.values(s.liens).filter(Boolean),
      },
    ],
    resume: `${s.titre} — ${contexte} ${s.description}`,
  });
}

export function metaGenre(g: Genre): Meta {
  return base({
    titre: `${g.nom} — genre musical | ${NOM_SITE}`,
    description: ajuster(
      g.description,
      `Artistes et albums ${g.nom.toLowerCase()} choisis par la rédaction.`,
    ),
    chemin: lienGenre(g.slug),
    resume: `${g.nom}. ${g.description}`,
  });
}
