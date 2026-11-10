// L'archive entière, tous univers confondus : la source unique des chiffres, de la recherche globale
// et des rapprochements « Dans le même univers ».
// - Une référence = une entrée qui a son numéro R° et sa fiche : marque, film, artiste ou sortie (album, EP, single).
//   Les genres, labels et ambiances de la musique sont des classements, pas des références.
// - Les numéros R° sont uniques sur tout le site (vérifié au chargement : un doublon n'est compté qu'une fois).
import { DOMAINES, MARQUES, type DomaineId, type Marque } from "./brands";
import {
  ARTISTES,
  SORTIES,
  TYPES_SORTIE,
  UNIVERS_MUSIQUE,
  artiste,
  lienArtiste,
  lienSortie,
  nomGenre,
  nomLabel,
  nomMood,
  nomsArtistes,
  origineArtiste,
  sortie,
  type Artiste,
  type Sortie,
} from "./musique";
import PROCHES from "./proches.json";
import { lienMarque } from "../lib/liens";

export type Reference =
  | { type: "marque"; id: number; marque: Marque }
  | { type: "artiste"; id: number; artiste: Artiste }
  | { type: "sortie"; id: number; sortie: Sortie };

/** Les six univers de rework° : mode, design, tech, digital, film, musique */
export type UniversId = DomaineId | "musique";

const vues = new Set<number>();
const unique = <T extends { id: number }>(r: T) =>
  vues.has(r.id) ? false : (vues.add(r.id), true);

/** Toutes les références, sans doublon de numéro */
export const REFERENCES: Reference[] = [
  ...MARQUES.map((m): Reference => ({ type: "marque", id: m.id, marque: m })),
  ...ARTISTES.map((a): Reference => ({
    type: "artiste",
    id: a.id,
    artiste: a,
  })),
  ...SORTIES.map((s): Reference => ({ type: "sortie", id: s.id, sortie: s })),
].filter(unique);

const PAR_ID = new Map(REFERENCES.map((r) => [r.id, r]));
export const reference = (id: number) => PAR_ID.get(id);

export const universDe = (r: Reference): UniversId =>
  r.type === "marque" ? r.marque.domaine : "musique";
export const nomDe = (r: Reference) =>
  r.type === "marque"
    ? r.marque.nom
    : r.type === "artiste"
      ? r.artiste.nom
      : r.sortie.titre;
export const lienDe = (r: Reference) =>
  r.type === "marque"
    ? lienMarque(r.marque.slug)
    : r.type === "artiste"
      ? lienArtiste(r.artiste.slug)
      : lienSortie(r.sortie.slug);
/** Catégorie lisible d'un résultat : « Mode », « Film », « Musique · Artiste », « Musique · Album » */
export const categorieDe = (r: Reference) =>
  r.type === "marque"
    ? DOMAINES[r.marque.domaine].nom
    : `Musique · ${r.type === "artiste" ? "Artiste" : TYPES_SORTIE[r.sortie.type]}`;

// ── Statistiques : toujours calculées sur les données, jamais saisies à la main ──

const compter = (u: UniversId) =>
  REFERENCES.filter((r) => universDe(r) === u).length;
export const STATS = {
  /** Toutes les références de l'archive */
  total: REFERENCES.length,
  /** Marques des quatre univers mode, design, tech, digital (sans les films) */
  marques: REFERENCES.filter(
    (r) => r.type === "marque" && r.marque.domaine !== "film",
  ).length,
  films: compter("film"),
  /** Références musicales : artistes + sorties */
  musique: compter("musique"),
  artistes: REFERENCES.filter((r) => r.type === "artiste").length,
  sorties: REFERENCES.filter((r) => r.type === "sortie").length,
  parUnivers: {
    mode: compter("mode"),
    design: compter("design"),
    tech: compter("tech"),
    digital: compter("digital"),
    film: compter("film"),
    musique: compter("musique"),
  } as Record<UniversId, number>,
};

export type Univers = {
  id: UniversId;
  numero: string;
  nom: string;
  /** Titre de la tuile (« Films ») */
  titre: string;
  description: string;
  couleur: string;
  entrees: number;
  lien: string;
};

/** Les six univers, dans l'ordre de leurs numéros (Musique = 06) */
export const UNIVERS: Univers[] = [
  ...Object.values(DOMAINES).map((d) => ({
    id: d.id as UniversId,
    numero: d.numero,
    nom: d.nom,
    titre: d.id === "film" ? "Films" : d.nom,
    description: d.description,
    couleur: d.couleur,
    entrees: STATS.parUnivers[d.id],
    lien: `/index?domaine=${d.id}`,
  })),
  {
    id: "musique",
    numero: UNIVERS_MUSIQUE.numero,
    nom: UNIVERS_MUSIQUE.nom,
    titre: UNIVERS_MUSIQUE.nom,
    description: "Artistes, albums et scènes.",
    couleur: UNIVERS_MUSIQUE.couleur,
    entrees: STATS.musique,
    lien: "/musique",
  },
];
export const NB_UNIVERS = UNIVERS.length;
/** « mode, design, tech, digital, film et musique » */
export const LISTE_UNIVERS = (() => {
  const noms = UNIVERS.map((u) => u.nom.toLowerCase());
  return `${noms.slice(0, -1).join(", ")} et ${noms.at(-1)}`;
})();

// ── Recherche globale ──

/** Insensible aux accents, à la casse et à la ponctuation : « tyler the creator » = « Tyler, The Creator » */
export const normaliser = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/&/g, " et ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function champs(r: Reference): { nom: string; autres: string } {
  if (r.type === "marque") {
    const m = r.marque;
    return {
      nom: [m.nom, m.titreOriginal].filter(Boolean).join(" "),
      autres: [
        m.origine,
        m.etiquette,
        m.realisation,
        m.annee || "",
        DOMAINES[m.domaine].nom,
        m.description,
      ].join(" "),
    };
  }
  if (r.type === "artiste") {
    const a = r.artiste;
    return {
      nom: a.nom,
      autres: [
        origineArtiste(a),
        ...a.genres.map(nomGenre),
        ...a.moods.map(nomMood),
        ...a.labels.map((l) => nomLabel(l) ?? ""),
        "artiste musique",
        a.description,
      ].join(" "),
    };
  }
  const s = r.sortie;
  return {
    nom: s.titre,
    autres: [
      nomsArtistes(s),
      TYPES_SORTIE[s.type],
      s.annee ?? "",
      nomLabel(s.label) ?? "",
      ...s.genres.map(nomGenre),
      ...s.moods.map(nomMood),
      "musique",
      s.description,
    ].join(" "),
  };
}
const INDEX_RECHERCHE = REFERENCES.map((r) => {
  const c = champs(r);
  const nom = normaliser(c.nom);
  return {
    r,
    nom,
    compact: nom.replace(/ /g, ""),
    texte: ` ${nom} ${normaliser(c.autres)} `,
  };
});

/**
 * Pertinence (0 = absent) : nom exact > début du nom > nom contenant la requête > tous les mots trouvés ailleurs
 * (description, ville, genre, réalisateur…). Chaque mot peut n'être qu'un début de mot (« whip » → Whiplash).
 */
function pertinence(
  e: (typeof INDEX_RECHERCHE)[number],
  q: string,
  mots: string[],
) {
  const qc = q.replace(/ /g, "");
  if (e.nom === q || e.compact === qc) return 100;
  if (e.nom.startsWith(q) || e.compact.startsWith(qc)) return 80;
  if (e.nom.includes(q) || (qc.length > 3 && e.compact.includes(qc))) return 60;
  if (
    !mots.every(
      (m) => e.texte.includes(` ${m}`) || (m.length > 3 && e.texte.includes(m)),
    )
  )
    return 0;
  return 20 + (mots.some((m) => ` ${e.nom} `.includes(` ${m}`)) ? 15 : 0);
}

/** Cherche dans toute l'archive ; résultats triés par pertinence puis par numéro */
export function chercher(requete: string): Reference[] {
  const q = normaliser(requete);
  if (!q) return [];
  const mots = q.split(" ");
  return INDEX_RECHERCHE.map((e) => [e.r, pertinence(e, q, mots)] as const)
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1] || a[0].id - b[0].id)
    .map(([r]) => r);
}

// ── « Dans le même univers » (calculé par scripts/proches.mjs) ──

const LISTES = PROCHES as unknown as Record<string, number[]>;
/** Références proches d'une entrée, toutes catégories, sans remplissage : liste vide si rien n'est assez proche */
export const prochesDe = (id: number, exclure: number[] = []) =>
  (LISTES[id] ?? [])
    .filter((x) => !exclure.includes(x))
    .map(reference)
    .filter((r): r is Reference => !!r);

// Accès directs utiles aux fiches musique
export { artiste, sortie };
