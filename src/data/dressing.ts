// Dressing : tenues de référence (Pinterest, Cosmos) recomposées avec de vraies pièces, un budget au choix par pièce.
// Données : data/dressing/outfits.json et products.json — sourcées à la main (docs/dressing-recherche.md), aucun prix inventé.
// Importé par les pages ET par REW (functions/api/rew.ts) : pas d'import.meta.glob ici (voir selections.ts).
import OUTFITS from "../../data/dressing/outfits.json";
import PRODUCTS from "../../data/dressing/products.json";

export const NIVEAUX_BUDGET = ["eco", "mid", "premium"] as const;
export type NiveauBudget = (typeof NIVEAUX_BUDGET)[number];
export const SIGNES: Record<NiveauBudget, string> = { eco: "€", mid: "€€", premium: "€€€" };

export type Categorie = "top" | "chemise" | "bas" | "veste" | "chaussures" | "accessoire";

export type Produit = {
  id: string;
  /** Id de l'entité rework° (marque de l'archive) — null pour une marque hors archive */
  brandId: number | null;
  brandName: string;
  name: string;
  category: Categorie;
  color: string;
  genre: "homme" | "femme" | "mixte";
  price: number;
  currency: "EUR";
  /** Page produit officielle, sans paramètre de suivi */
  url: string;
  /** Image produit convertie en .webp (public/) — absente si le téléchargement a échoué */
  img?: string;
  imgSource?: string;
  /** Revendeur officiel quand la marque ne vend pas elle-même en ligne */
  retailer?: string;
  /** AAAA-MM-JJ */
  checkedAt: string;
  /** false : masquée et niveau désactivé jusqu'à remplacement (npm run dressing:check) */
  dispo?: boolean;
  horsArchive?: boolean;
};

export type Piece = {
  role: string;
  description: string;
  /** Pistes de marques du Figma (point de départ) */
  piste?: string;
  options: Record<NiveauBudget, string | null>;
};

export type Tenue = {
  id: string;
  slug: string;
  genre: "homme" | "femme";
  style: string;
  saison: string;
  phrase: string;
  /** /images/dressing/<slug>.webp — absente si l'image n'a pas pu être récupérée */
  image?: string;
  /** Pin Pinterest ou élément Cosmos d'origine */
  imageSource: string;
  credit: string;
  pieces: Piece[];
};

export const PRODUITS = PRODUCTS as unknown as Produit[];
export const TENUES = OUTFITS as unknown as Tenue[];
export const PRODUIT_PAR_ID = new Map(PRODUITS.map((p) => [p.id, p]));
export const TENUE_PAR_SLUG = new Map(TENUES.map((t) => [t.slug, t]));

/** Produit d'une option, seulement s'il est encore disponible */
export const produitDispo = (id: string | null | undefined) => {
  const p = id ? PRODUIT_PAR_ID.get(id) : undefined;
  return p && p.dispo !== false ? p : undefined;
};

/** Niveaux de la pièce qui ont un produit disponible */
export const niveauxDispo = (p: Piece) => NIVEAUX_BUDGET.filter((n) => produitDispo(p.options[n]));

/** Fourchette « de X € à Y € » : la pièce la moins chère et la plus chère de chaque rôle */
export function fourchette(t: Tenue) {
  let min = 0;
  let max = 0;
  for (const p of t.pieces) {
    const prix = niveauxDispo(p).map((n) => produitDispo(p.options[n])!.price);
    if (!prix.length) continue;
    min += Math.min(...prix);
    max += Math.max(...prix);
  }
  return { min: Math.round(min), max: Math.round(max) };
}

/** Grille du brief : bornes € / €€ / €€€ par type de pièce */
export const SEUILS: Record<Categorie, [number, number]> = {
  top: [50, 120],
  chemise: [90, 250],
  bas: [100, 280],
  veste: [180, 500],
  chaussures: [120, 300],
  accessoire: [60, 200],
};
export const niveauDe = (c: Categorie, prix: number): NiveauBudget =>
  prix < SEUILS[c][0] ? "eco" : prix <= SEUILS[c][1] ? "mid" : "premium";

export const lienTenue = (slug: string) => `/dressing/${slug}`;
export const formatPrix = (n: number) =>
  `${n.toLocaleString("fr-FR", { maximumFractionDigits: n % 1 ? 2 : 0, minimumFractionDigits: n % 1 ? 2 : 0 })} €`;
/** « 2026-11-16 » → « 16/11 » */
export const dateCourte = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

/** Tenues affichées : au moins une pièce disponible (les autres attendent leur recherche) */
export const TENUES_PUBLIEES = TENUES.filter((t) => t.pieces.some((p) => niveauxDispo(p).length));

export type Choix = (NiveauBudget | null)[];

/** Niveau le plus proche disponible pour une pièce (« Tout en €€ » quand la pièce n'a pas de €€) */
export function niveauProche(p: Piece, voulu: NiveauBudget): NiveauBudget | null {
  const dispo = niveauxDispo(p);
  if (!dispo.length) return null;
  if (dispo.includes(voulu)) return voulu;
  const i = NIVEAUX_BUDGET.indexOf(voulu);
  return [...dispo].sort((a, b) => Math.abs(NIVEAUX_BUDGET.indexOf(a) - i) - Math.abs(NIVEAUX_BUDGET.indexOf(b) - i) || NIVEAUX_BUDGET.indexOf(a) - NIVEAUX_BUDGET.indexOf(b))[0];
}

/** Choix par défaut : le niveau le moins cher disponible de chaque pièce */
export const choixParDefaut = (t: Tenue): Choix => t.pieces.map((p) => niveauxDispo(p)[0] ?? null);

/** ?b=1-2-2-3 ↔ choix (1 = €, 2 = €€, 3 = €€€, 0 = aucun) ; un niveau indisponible retombe sur le plus proche */
export function choixDepuisUrl(t: Tenue, b: string | null): Choix {
  const defaut = choixParDefaut(t);
  if (!b) return defaut;
  const parts = b.split("-");
  return t.pieces.map((p, i) => {
    const n = Number(parts[i]);
    if (!(n >= 1 && n <= 3)) return defaut[i];
    return niveauProche(p, NIVEAUX_BUDGET[n - 1]);
  });
}
export const choixVersUrl = (c: Choix) => c.map((n) => (n ? NIVEAUX_BUDGET.indexOf(n) + 1 : 0)).join("-");

export const totalChoix = (t: Tenue, c: Choix) =>
  Math.round(t.pieces.reduce((s, p, i) => s + (produitDispo(c[i] ? p.options[c[i]!] : null)?.price ?? 0), 0) * 100) / 100;

/** Tenues proches : même style d'abord, puis marques en commun */
export function tenuesProches(t: Tenue, n = 3) {
  const marques = (x: Tenue) =>
    new Set(x.pieces.flatMap((p) => NIVEAUX_BUDGET.map((k) => produitDispo(p.options[k])?.brandName).filter(Boolean)));
  const m = marques(t);
  const motsStyle = new Set(t.style.toLowerCase().split(/\s+/));
  return TENUES_PUBLIEES.filter((x) => x.slug !== t.slug)
    .map((x) => {
      let s = [...marques(x)].filter((b) => m.has(b)).length;
      if (x.style.toLowerCase().split(/\s+/).some((w) => motsStyle.has(w))) s += 3;
      if (x.genre === t.genre) s += 1;
      return { x, s };
    })
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((v) => v.x);
}

/** Familles de style pour les filtres (chips) */
export const STYLES = [...new Set(TENUES_PUBLIEES.map((t) => t.style))];
