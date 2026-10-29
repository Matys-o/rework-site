// Couche de données unique : les 285 marques de l'archive, extraites de la sauvegarde Supabase (table public.brands),
// suivies des 50 films du top Letterboxd (films.json, même format + rank, director, originalTitle).
// Données statiques — aucune connexion à Supabase au runtime.
import BRUT from "./brands.json";
import FILMS from "./films.json";

export type DomaineId = "mode" | "design" | "tech" | "digital" | "film";

export type Domaine = {
  id: DomaineId;
  numero: string;
  nom: string;
  description: string;
  /** Nombre réel d'entrées du domaine */
  entrees: number;
  /** Variable CSS de l'aura du domaine */
  couleur: string;
};

export type Marque = {
  id: number;
  /** R°001… d'après l'id (ordre d'ajout) */
  cote: string;
  slug: string;
  nom: string;
  domaine: DomaineId;
  annee: number;
  origine: string;
  /** Étiquette affichée en pastille sur la couverture (colonne « cat ») */
  etiquette: string;
  description: string;
  /** Photo (ou vidéo) de couverture — « aura + initiale » en fond et en secours */
  image?: string;
  video: boolean;
  /** Site officiel — absent pour quelques marques disparues ; page Letterboxd pour un film */
  url?: string;
  /** Films : rang dans le top Letterboxd */
  rang?: number;
  /** Films : réalisateur·rice(s) */
  realisation?: string;
  /** Films : titre original (le nom est le titre français) */
  titreOriginal?: string;
};

type LigneBrute = {
  id: number;
  name: string;
  type: string;
  cat: string | null;
  origin: string | null;
  year: string | null;
  img: string | null;
  description: string | null;
  url: string | null;
  rank?: number;
  director?: string;
  originalTitle?: string;
};

/** Valeur « type » de la table → domaine du site */
const TYPE_VERS_DOMAINE: Record<string, DomaineId> = {
  fashion: "mode",
  design: "design",
  tech: "tech",
  digital: "digital",
  film: "film",
};

/** « &Tradition » → « tradition », « Comme des Garçons » → « comme-des-garcons » */
export function slugifier(nom: string) {
  return nom
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const propre = (v: string | null) => (v && v.trim() && v.trim() !== "#" ? v.trim() : undefined);

function construire(lignes: LigneBrute[]): Marque[] {
  const slugs = new Set<string>();
  return [...lignes]
    .sort((a, b) => a.id - b.id)
    .map((l) => {
      // Deux noms qui donnent le même slug : le second reçoit un suffixe
      const base = slugifier(l.name) || `marque-${l.id}`;
      let slug = base;
      for (let n = 2; slugs.has(slug); n++) slug = `${base}-${n}`;
      slugs.add(slug);

      const image = propre(l.img);
      return {
        id: l.id,
        cote: `R°${String(l.id).padStart(3, "0")}`,
        slug,
        nom: l.name.trim(),
        domaine: TYPE_VERS_DOMAINE[l.type] ?? "design",
        annee: Number(l.year) || 0,
        origine: propre(l.origin) ?? "",
        etiquette: propre(l.cat) ?? "",
        description: propre(l.description) ?? "",
        image,
        video: !!image && /\.(mp4|webm)(\?|$)/i.test(image),
        url: propre(l.url),
        rang: l.rank,
        realisation: l.director,
        titreOriginal: l.originalTitle,
      };
    });
}

/** Toutes les entrées (marques puis films), triées par id */
export const MARQUES: Marque[] = construire([...BRUT, ...FILMS] as LigneBrute[]);

export const TOTAL_ENTREES = MARQUES.length;

export const compterParDomaine = (id: DomaineId) => MARQUES.filter((m) => m.domaine === id).length;

export const DOMAINES: Record<DomaineId, Domaine> = {
  mode: {
    id: "mode",
    numero: "01",
    nom: "Mode",
    description: "Streetwear, techwear, maisons indépendantes.",
    entrees: compterParDomaine("mode"),
    couleur: "var(--color-aura-mode)",
  },
  design: {
    id: "design",
    numero: "02",
    nom: "Design",
    description: "Mobilier, objets, éditeurs historiques.",
    entrees: compterParDomaine("design"),
    couleur: "var(--color-aura-design)",
  },
  tech: {
    id: "tech",
    numero: "03",
    nom: "Tech",
    description: "Outils, machines, matériel de création.",
    entrees: compterParDomaine("tech"),
    couleur: "var(--color-aura-tech)",
  },
  digital: {
    id: "digital",
    numero: "04",
    nom: "Digital",
    description: "Logiciels, plateformes, culture en ligne.",
    entrees: compterParDomaine("digital"),
    couleur: "var(--color-aura-digital)",
  },
  film: {
    id: "film",
    numero: "05",
    nom: "Film",
    description: "Cinéma, les 50 qui comptent.",
    entrees: compterParDomaine("film"),
    couleur: "var(--color-aura-film)",
  },
};

const PAR_SLUG = new Map(MARQUES.map((m) => [m.slug, m]));
export const trouverMarque = (slug: string | undefined) => (slug ? PAR_SLUG.get(slug) : undefined);

/** Les n plus grands id = les dernières entrées */
export const nouvellesEntrees = (n = 3) => MARQUES.slice(-n).reverse();

/** Fiche précédente / suivante selon l'id (boucle aux extrémités) */
export function voisins(marque: Marque) {
  const i = MARQUES.indexOf(marque);
  return {
    precedent: MARQUES[(i - 1 + MARQUES.length) % MARQUES.length],
    suivant: MARQUES[(i + 1) % MARQUES.length],
  };
}

/** Méta des fiches : DOMAINE · ANNÉE · ORIGINE — FILM · ANNÉE · RÉALISATION pour un film (capitales via t-cote) */
export const metaMarque = (m: Marque) =>
  [DOMAINES[m.domaine].nom, m.annee || null, (m.domaine === "film" ? m.realisation : m.origine) || null].filter(Boolean).join(" · ");