// Types partagés entre la Pages Function /api/rew et l'interface REW.

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

export type ReponseRew = {
  message: string;
  sections: { univers: UniversRew; cartes: CarteRew[] }[];
  conclusion: string;
  question: string;
  profil: ProfilRew;
};

export type ErreurRew = {
  erreur:
    | "limite"
    | "trop-long"
    | "invalide"
    | "indisponible"
    | "refus"
    | "delai"
    | "erreur";
};
