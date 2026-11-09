// Univers Musique : artistes, sorties (albums, EP, singles, mixtapes), genres, ambiances, labels.
// Données statiques dans src/data/musique/*.json (métadonnées Deezer + iTunes, textes de la rédaction).
// Les identifiants (R°) sont partagés avec les marques et les films : une entrée = un numéro unique.
import ARTISTES_BRUT from "./musique/artistes.json";
import GENRES_BRUT from "./musique/genres.json";
import LABELS_BRUT from "./musique/labels.json";
import MOODS_BRUT from "./musique/moods.json";
import SELECTION_BRUT from "./musique/selection.json";
import SORTIES_BRUT from "./musique/sorties.json";

export type Proche = { id: number; raison: string };
export type TypeSortie = "album" | "ep" | "single" | "mixtape";

export type Artiste = {
  id: number;
  cote: string;
  slug: string;
  nom: string;
  pays: string;
  ville: string | null;
  debut: number | null;
  genres: string[];
  moods: string[];
  labels: string[];
  description: string;
  image: string;
  liens: { deezer?: string; apple?: string; spotify?: string };
  proches: Proche[];
  sorties: number[];
  ajouteLe?: string;
};

export type Sortie = {
  id: number;
  cote: string;
  slug: string;
  titre: string;
  type: TypeSortie;
  artistes: number[];
  annee: number | null;
  label: string | null;
  genres: string[];
  moods: string[];
  description: string;
  cover: string;
  liens: { deezer?: string; apple?: string; spotify?: string };
  proches: Proche[];
  ajouteLe?: string;
};

export type Genre = {
  id: string;
  slug: string;
  nom: string;
  parent: string | null;
  description: string;
};

const cote = (id: number) => `R°${String(id).padStart(3, "0")}`;

export const ARTISTES: Artiste[] = ARTISTES_BRUT.map((a) => ({
  ...a,
  cote: cote(a.id),
  ajouteLe: a.addedAt,
}));
export const SORTIES: Sortie[] = SORTIES_BRUT.map((s) => ({
  ...s,
  type: s.type as TypeSortie,
  cote: cote(s.id),
  ajouteLe: s.addedAt,
}));
export const GENRES: Genre[] = GENRES_BRUT;
export const MOODS: { id: string; label: string }[] = MOODS_BRUT;
export const LABELS: { id: string; nom: string }[] = LABELS_BRUT;
export const SELECTION = SELECTION_BRUT;

/** L'univers, au même format que les domaines de l'archive (fiches, pastilles, auras) */
export const UNIVERS_MUSIQUE = {
  numero: "06",
  nom: "Musique",
  couleur: "var(--color-aura-musique)",
  description:
    "Artistes, albums et scènes : la musique qu'on écoute en regardant le reste de l'archive.",
};

const parIdArtiste = new Map(ARTISTES.map((a) => [a.id, a]));
const parIdSortie = new Map(SORTIES.map((s) => [s.id, s]));
const parIdGenre = new Map(GENRES.map((g) => [g.id, g]));
const parIdLabel = new Map(LABELS.map((l) => [l.id, l]));
const parIdMood = new Map(MOODS.map((m) => [m.id, m]));

export const artiste = (id: number) => parIdArtiste.get(id);
export const sortie = (id: number) => parIdSortie.get(id);
export const genre = (id: string) => parIdGenre.get(id);
export const nomLabel = (id: string | null) =>
  id ? parIdLabel.get(id)?.nom : undefined;
export const nomMood = (id: string) => parIdMood.get(id)?.label ?? id;
export const nomGenre = (id: string) => parIdGenre.get(id)?.nom ?? id;

export const trouverArtiste = (slug?: string) =>
  ARTISTES.find((a) => a.slug === slug);
export const trouverSortie = (slug?: string) =>
  SORTIES.find((s) => s.slug === slug);
export const trouverGenre = (slug?: string) =>
  GENRES.find((g) => g.slug === slug);

export const lienArtiste = (slug: string) => `/musique/artiste/${slug}`;
export const lienSortie = (slug: string) => `/musique/album/${slug}`;
export const lienGenre = (slug: string) => `/musique/genre/${slug}`;

export const TYPES_SORTIE: Record<TypeSortie, string> = {
  album: "Album",
  ep: "EP",
  single: "Single",
  mixtape: "Mixtape",
};

/** Artistes d'une sortie, dans l'ordre des crédits */
export const artistesDe = (s: Sortie) =>
  s.artistes.map(artiste).filter((a): a is Artiste => !!a);
/** « Tyler, The Creator » ou « Justice & … » */
export const nomsArtistes = (s: Sortie) =>
  artistesDe(s)
    .map((a) => a.nom)
    .join(" & ");
export const sortiesDe = (a: Artiste) =>
  a.sorties.map(sortie).filter((s): s is Sortie => !!s);

/** Un genre et tous ses sous-genres (Techno → Hard techno, Techno industrielle) */
export function genreEtEnfants(id: string): string[] {
  return [
    id,
    ...GENRES.filter((g) => g.parent === id).flatMap((g) =>
      genreEtEnfants(g.id),
    ),
  ];
}
export const sousGenres = (id: string) => GENRES.filter((g) => g.parent === id);
export const genresRacines = () => GENRES.filter((g) => !g.parent);

/** « Cologne, Allemagne » */
export const origineArtiste = (a: Artiste) =>
  [a.ville, a.pays].filter(Boolean).join(", ");
/** Première année connue : début d'activité, sinon la plus ancienne sortie de l'archive */
export function anneeArtiste(a: Artiste) {
  if (a.debut) return a.debut;
  const annees = sortiesDe(a)
    .map((s) => s.annee)
    .filter((x): x is number => !!x);
  return annees.length ? Math.min(...annees) : null;
}

/** Recherche insensible à la casse, aux accents et à la ponctuation (« hard-techno » = « hard techno ») */
export const normaliser = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const texteArtiste = (a: Artiste) =>
  normaliser(
    [
      a.nom,
      a.ville,
      a.pays,
      ...a.genres.map(nomGenre),
      ...a.labels.map((l) => nomLabel(l)),
      ...a.moods.map(nomMood),
    ].join(" "),
  );
const texteSortie = (s: Sortie) =>
  normaliser(
    [
      s.titre,
      nomsArtistes(s),
      nomLabel(s.label),
      TYPES_SORTIE[s.type],
      s.annee,
      ...s.genres.map(nomGenre),
      ...s.moods.map(nomMood),
    ].join(" "),
  );
const INDEX_ARTISTES = new Map(ARTISTES.map((a) => [a.id, texteArtiste(a)]));
const INDEX_SORTIES = new Map(SORTIES.map((s) => [s.id, texteSortie(s)]));

/**
 * Score de pertinence : 0 = ne correspond pas. Nom exact > début du nom > nom contenant la requête > autres champs.
 * Tous les mots de la requête doivent se trouver quelque part (« hard techno cologne »).
 */
function score(nom: string, texte: string, q: string) {
  if (!q) return 1;
  const n = normaliser(nom);
  const nCompact = n.replace(/ /g, "");
  const qCompact = q.replace(/ /g, "");
  if (n === q || nCompact === qCompact) return 100;
  if (n.startsWith(q) || nCompact.startsWith(qCompact)) return 80;
  if (n.includes(q)) return 60;
  const mots = q.split(" ");
  if (
    mots.every((m) => texte.includes(m) || texte.replace(/ /g, "").includes(m))
  )
    return 20 + (mots.some((m) => n.includes(m)) ? 10 : 0);
  return 0;
}
export const scoreArtiste = (a: Artiste, q: string) =>
  score(a.nom, INDEX_ARTISTES.get(a.id) ?? "", q);
export const scoreSortie = (s: Sortie, q: string) =>
  score(s.titre, INDEX_SORTIES.get(s.id) ?? "", q);

/** Recherche groupée par type : artistes, albums, genres, labels */
export function chercherMusique(requete: string) {
  const q = normaliser(requete);
  if (!q) return { artistes: [], sorties: [], genres: [], labels: [] };
  const tri = <T>(liste: T[], f: (x: T) => number) =>
    liste
      .map((x) => [x, f(x)] as const)
      .filter(([, s]) => s > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([x]) => x);
  return {
    artistes: tri(ARTISTES, (a) => scoreArtiste(a, q)),
    sorties: tri(SORTIES, (s) => scoreSortie(s, q)),
    genres: tri(GENRES, (g) => score(g.nom, normaliser(`${g.nom} ${g.id}`), q)),
    labels: tri(LABELS, (l) => score(l.nom, normaliser(l.nom), q)).map((l) => ({
      ...l,
      sorties: SORTIES.filter((s) => s.label === l.id),
      artistes: ARTISTES.filter((a) => a.labels.includes(l.id)),
    })),
  };
}

// ── Filtres (dans l'URL : ?genre=techno,rap&origine=France&periode=2010&mood=dark&label=krach&type=ep) ──

export const CLES_FILTRES_MUSIQUE = [
  "type",
  "genre",
  "origine",
  "periode",
  "mood",
  "label",
] as const;
export type CleFiltreMusique = (typeof CLES_FILTRES_MUSIQUE)[number];
export type SelectionMusique = Record<CleFiltreMusique, string[]>;

export const TITRES_FILTRES_MUSIQUE: Record<CleFiltreMusique, string> = {
  type: "Format",
  genre: "Genre",
  origine: "Origine",
  periode: "Période",
  mood: "Ambiance",
  label: "Label",
};

export const PERIODES = [
  { id: "avant-1990", label: "Avant 1990", de: 0, a: 1989 },
  { id: "1990", label: "Années 90", de: 1990, a: 1999 },
  { id: "2000", label: "Années 2000", de: 2000, a: 2009 },
  { id: "2010", label: "Années 2010", de: 2010, a: 2019 },
  { id: "2020", label: "Depuis 2020", de: 2020, a: 9999 },
];
const periodeDe = (annee: number | null) =>
  annee ? PERIODES.find((p) => annee >= p.de && annee <= p.a)?.id : undefined;

/** Valeurs filtrables d'une entrée (plusieurs genres, ambiances, labels possibles) */
export type AttributsMusique = Record<CleFiltreMusique, string[]>;

export function attributsArtiste(a: Artiste): AttributsMusique {
  return {
    type: [],
    genre: a.genres,
    origine: a.pays ? [a.pays] : [],
    periode: [periodeDe(anneeArtiste(a))].filter((x): x is string => !!x),
    mood: a.moods,
    label: a.labels,
  };
}
export function attributsSortie(s: Sortie): AttributsMusique {
  const pays = [
    ...new Set(
      artistesDe(s)
        .map((a) => a.pays)
        .filter(Boolean),
    ),
  ];
  return {
    type: [s.type],
    genre: s.genres,
    origine: pays,
    periode: [periodeDe(s.annee)].filter((x): x is string => !!x),
    mood: s.moods,
    label: s.label ? [s.label] : [],
  };
}

/** OU à l'intérieur d'un filtre, ET entre les filtres. Un genre choisi inclut ses sous-genres. `sauf` : filtre ignoré (compteurs) */
export function correspondMusique(
  a: AttributsMusique,
  sel: SelectionMusique,
  sauf?: CleFiltreMusique,
) {
  return CLES_FILTRES_MUSIQUE.every((k) => {
    if (k === sauf || !sel[k].length) return true;
    const voulues = k === "genre" ? sel[k].flatMap(genreEtEnfants) : sel[k];
    return a[k].some((v) => voulues.includes(v));
  });
}

export function libelleMusique(cle: CleFiltreMusique, v: string) {
  if (cle === "type") return TYPES_SORTIE[v as TypeSortie] ?? v;
  if (cle === "genre") return nomGenre(v);
  if (cle === "periode") return PERIODES.find((p) => p.id === v)?.label ?? v;
  if (cle === "mood") return nomMood(v);
  if (cle === "label") return nomLabel(v) ?? v;
  return v;
}
