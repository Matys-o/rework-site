// REW, compréhension en code (sans IA) : noms mal orthographiés, synonymes, exclusions.
// Importé par serveur.ts uniquement. Le dictionnaire se corrige à la main : data/rew-synonymes.json.
import SYNONYMES from "../../../data/rew-synonymes.json";
import type { UniversRew } from "./types";
import type { Categorie } from "../../data/dressing";

export const normaliser = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const compact = (s: string) => normaliser(s).replace(/ /g, "");

/** Distance d'édition (Damerau, transpositions comprises), arrêtée dès qu'elle dépasse max */
export function distance(a: string, b: string, max = 3) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let mini = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cout = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cout,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      mini = Math.min(mini, d[i][j]);
    }
    if (mini > max) return max + 1;
  }
  return d[a.length][b.length];
}

/** Tolérance selon la longueur : les noms courts doivent être exacts (« Vans » ≠ « dans ») */
const tolerance = (n: number) => (n <= 5 ? 0 : n <= 8 ? 1 : n <= 12 ? 2 : 3);

// Noms qui sont aussi des mots courants : reconnus seulement écrits avec une majuscule ou entre guillemets
const MOTS_COURANTS = new Set(
  "air things runway seven mank the game zodiac roam nio supreme palace arena are na alien vans kenzo justice amazon apple notion linear figma loop muji home hay ferm tradition string normal design object things".split(
    " ",
  ),
);

export type Nom = { id: number; nom: string; alias: string[]; type: string };
export type Trouve = { id: number; nom: string; type: string; extrait: string };

/**
 * Cherche dans le message les noms de l'archive (marques, films, réalisateurs, artistes, albums),
 * malgré les fautes, les accents et les espaces : « rik ovens » → Rick Owens, « arcterix » → Arc'teryx.
 */
export function noms(message: string, liste: Nom[]): Trouve[] {
  const mots = normaliser(message).split(" ").filter(Boolean);
  const brut = message;
  const trouves = new Map<string, Trouve>();
  for (const e of liste) {
    for (const forme of [e.nom, ...e.alias]) {
      const cible = compact(forme);
      if (cible.length < 3) continue;
      const nbMots = Math.max(1, normaliser(forme).split(" ").length);
      const tol = tolerance(cible.length);
      let ok = "";
      for (const k of new Set([nbMots - 1, nbMots, nbMots + 1]))
        if (k >= 1)
          for (let i = 0; i + k <= mots.length && !ok; i++) {
            const fenetre = mots.slice(i, i + k).join("");
            if (Math.abs(fenetre.length - cible.length) > tol) continue;
            if (
              fenetre === cible ||
              (tol && distance(fenetre, cible, tol) <= tol)
            )
              ok = mots.slice(i, i + k).join(" ");
          }
      if (!ok) continue;
      // Mot courant : il faut une majuscule dans le message d'origine (« Air » le groupe, pas « un air de »)
      if (
        MOTS_COURANTS.has(normaliser(forme)) &&
        !new RegExp(
          `(^|[^\\p{L}])${forme.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
          "u",
        ).test(brut)
      )
        continue;
      if (!trouves.has(`${e.id}|${e.type}`))
        trouves.set(`${e.id}|${e.type}`, {
          id: e.id,
          nom: e.nom,
          type: e.type,
          extrait: ok,
        });
      break;
    }
  }
  // Un nom trouvé à l'intérieur d'un nom plus long déjà trouvé (« Air » dans « Air Max ») est écarté
  const tous = [...trouves.values()];
  return tous.filter(
    (t) =>
      !tous.some(
        (u) =>
          u !== t &&
          u.extrait.length > t.extrait.length &&
          ` ${u.extrait} `.includes(` ${t.extrait} `) &&
          compact(u.nom) !== compact(t.nom),
      ),
  );
}

type Terme = {
  mots: string[];
  ajoute: string[];
  univers?: string[];
  categorie?: string;
  references?: string[];
  tenue?: boolean;
};
type Exclusion = {
  mots: string[];
  tags?: string[];
  familles?: string[];
  origines?: string[];
  prixMax?: number;
};
const TERMES = (SYNONYMES.termes as Terme[]).map((t) => ({
  ...t,
  mots: t.mots.map(normaliser),
}));
const EXCLUSIONS = (SYNONYMES.exclusions as Exclusion[]).map((x) => ({
  ...x,
  mots: x.mots.map(normaliser),
}));
const contient = (texte: string, mot: string) =>
  ` ${texte} `.includes(` ${mot} `);

export type Lecture = {
  recherche: string[];
  univers: UniversRew[];
  categorie?: Categorie;
  references: string[];
  tenue: boolean;
};

/** Applique le dictionnaire de synonymes au message (« sape » → vêtements, « doudoune » → manteau…) */
export function synonymes(message: string): Lecture {
  const t = normaliser(message);
  const l: Lecture = {
    recherche: [],
    univers: [],
    references: [],
    tenue: false,
  };
  for (const s of TERMES) {
    if (!s.mots.some((m) => contient(t, m))) continue;
    l.recherche.push(...s.ajoute);
    for (const u of s.univers ?? [])
      if (!l.univers.includes(u as UniversRew)) l.univers.push(u as UniversRew);
    if (s.categorie && !l.categorie) l.categorie = s.categorie as Categorie;
    l.references.push(...(s.references ?? []));
    if (s.tenue) l.tenue = true;
  }
  l.recherche = [...new Set(l.recherche)];
  return l;
}

export type Filtre = {
  tags: string[];
  familles: string[];
  origines: string[];
  prixMax: number;
  libres: string[];
};

/** Traduit les exclusions (« pas de noir », « pas japonais », « pas de luxe ») en filtres concrets sur l'archive */
export function filtresExclusion(exclusions: string[]): Filtre {
  const f: Filtre = {
    tags: [],
    familles: [],
    origines: [],
    prixMax: 0,
    libres: [],
  };
  for (const brut of exclusions) {
    const x = normaliser(brut);
    if (!x) continue;
    const regle = EXCLUSIONS.find((r) => r.mots.some((m) => contient(x, m)));
    if (!regle) {
      f.libres.push(x);
      continue;
    }
    f.tags.push(...(regle.tags ?? []).map(normaliser));
    f.familles.push(...(regle.familles ?? []));
    f.origines.push(...(regle.origines ?? []).map(normaliser));
    if (regle.prixMax)
      f.prixMax = f.prixMax
        ? Math.min(f.prixMax, regle.prixMax)
        : regle.prixMax;
  }
  return f;
}
