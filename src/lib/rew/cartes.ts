// Cartes REW construites dans le navigateur à partir de l'archive (box de l'accueil : aucun appel IA).
import { MARQUES } from "../../data/brands";
import {
  TYPES_SORTIE,
  artiste,
  lienArtiste,
  lienSortie,
  nomsArtistes,
  origineArtiste,
  sortie,
} from "../../data/musique";
import { lienMarque } from "../liens";
import type { CarteRew, UniversRew } from "./types";

const ecoute = (l: { spotify?: string; deezer?: string; apple?: string }) =>
  l.spotify
    ? { label: "Écouter sur Spotify ↗", url: l.spotify }
    : l.deezer
      ? { label: "Écouter sur Deezer ↗", url: l.deezer }
      : l.apple
        ? { label: "Écouter sur Apple Music ↗", url: l.apple }
        : undefined;

export function carteParId(id: number, raison: string): CarteRew | undefined {
  const a = artiste(id);
  if (a)
    return {
      id,
      nom: a.nom,
      univers: "musique",
      info: origineArtiste(a),
      description: a.description,
      image: a.image,
      fiche: lienArtiste(a.slug),
      action: ecoute(a.liens),
      raison,
    };
  const s = sortie(id);
  if (s)
    return {
      id,
      nom: s.titre,
      univers: "musique",
      info: [nomsArtistes(s), TYPES_SORTIE[s.type], s.annee]
        .filter(Boolean)
        .join(" · "),
      description: s.description,
      image: s.cover,
      carre: true,
      fiche: lienSortie(s.slug),
      action: ecoute(s.liens),
      raison,
    };
  const m = MARQUES.find((x) => x.id === id);
  if (!m) return undefined;
  const univers: UniversRew = m.domaine === "film" ? "cinema" : m.domaine;
  const film = univers === "cinema";
  return {
    id,
    nom: m.nom,
    univers,
    info: [m.annee || null, m.origine].filter(Boolean).join(" · "),
    description: m.description,
    image: m.image,
    video: m.video,
    fiche: lienMarque(m.slug),
    action: m.url
      ? {
          label: film
            ? "Voir sur Letterboxd ↗"
            : univers === "digital"
              ? "Explorer le projet ↗"
              : "Découvrir la marque ↗",
          url: m.url,
        }
      : undefined,
    raison,
  };
}
