// Types partagés entre la Pages Function /api/rew et l'interface REW.

/** Longueur maximale d'un message : assez pour un brief de moodboard détaillé (≈ 250 mots) */
export const LONGUEUR_MAX = 1500;

export const UNIVERS_REW = [
  "mode",
  "design",
  "tech",
  "digital",
  "musique",
  "cinema",
] as const;
export type UniversRew = (typeof UNIVERS_REW)[number];

export const NOMS_UNIVERS: Record<UniversRew, string> = {
  mode: "Mode",
  design: "Design",
  tech: "Tech",
  digital: "Digital",
  musique: "Musique",
  cinema: "Cinéma",
};

/** Ce que REW a compris de la personne, gardé dans la session du navigateur (jamais côté serveur) */
export type ProfilRew = {
  intention: string;
  destinataire: string;
  interets: string[];
  esthetiques: string[];
  genres: string[];
  references: string[];
};

export const PROFIL_VIDE: ProfilRew = {
  intention: "",
  destinataire: "",
  interets: [],
  esthetiques: [],
  genres: [],
  references: [],
};

export type MessageRew = { role: "user" | "assistant"; content: string };

export type CarteRew = {
  id: number;
  nom: string;
  univers: UniversRew;
  /** « Japon · 1962 », « Cologne, Allemagne · Artiste » */
  info: string;
  description: string;
  image?: string;
  video?: boolean;
  carre?: boolean;
  /** Fiche rework° */
  fiche: string;
  /** Lien officiel (site, Letterboxd, plateforme d'écoute) — absent si l'archive n'en a pas */
  action?: { label: string; url: string };
  raison: string;
};

/** Ce que REW a compris de la demande, en clair (renvoyé pour l'affichage et l'éval) */
export type ContraintesRew = {
  genre: "" | "homme" | "femme" | "mixte";
  /** En euros, 0 = pas de borne */
  budget: { min: number; max: number };
  couleurs: string[];
  exclusions: string[];
  saison: string;
  occasion: string;
  univers: UniversRew[];
  /** Entrées de l'archive citées, noms corrigés (« rik ovens » → Rick Owens) */
  references: string[];
  langue: string;
  categorie: string;
};

/** Une tenue du Dressing proposée par REW */
export type TenueRew = {
  slug: string;
  style: string;
  genre: string;
  phrase: string;
  image?: string;
  fiche: string;
  fourchette: { min: number; max: number };
  raison: string;
};

/** Une pièce précise (données produits du Dressing) */
export type ProduitRew = {
  id: string;
  brandName: string;
  /** Fiche rework° de la marque, absente pour une marque hors archive */
  brandFiche?: string;
  name: string;
  color: string;
  price: number;
  checkedAt: string;
  url: string;
  img?: string;
  raison: string;
};

export type ReponseRew = {
  message: string;
  sections: { univers: UniversRew; cartes: CarteRew[] }[];
  conclusion: string;
  question: string;
  profil: ProfilRew;
  reformulation?: string;
  contraintes?: ContraintesRew;
  tenues?: TenueRew[];
  produits?: ProduitRew[];
};

export type ErreurRew = {
  erreur:
    | "limite"
    | "trop-long"
    | "invalide"
    | "indisponible"
    | "refus"
    // Temporaires (le navigateur retente une fois tout seul) : délai du modèle, fournisseur saturé, réponse illisible, autre
    | "delai"
    | "surcharge"
    | "generation"
    | "erreur";
};

/** Codes d'erreur qui valent une nouvelle tentative automatique ; les autres sont définitifs */
export const ERREURS_TEMPORAIRES: ErreurRew["erreur"][] = [
  "delai",
  "surcharge",
  "generation",
  "erreur",
];
