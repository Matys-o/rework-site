import type { DomaineId } from "../data/brands";

// Plan du site — une seule source pour tous les liens (nav, menu, footer, boutons, fiches).

/** Adresse de la rédaction — à renseigner (laissée vide, le client mail s'ouvre sans destinataire) */
export const EMAIL_REDACTION = "";

export const LIENS = {
  accueil: "/",
  index: "/index",
  recherche: "/index#recherche",
  domaines: "/#domaines",
  nouvelles: "/#nouvelles",
  manifeste: "/manifeste",
  contact: "#contact",
  hasard: "/hasard",
  trio: "/#trio",
  trios: "/trios",
  /** Bloc d'inscription du footer, présent sur toutes les pages */
  lettre: "#lettre",
  confidentialite: "/confidentialite",
  desinscription: "/confidentialite#desinscription",
  inscriptionConfirmee: "/inscription-confirmee",
  proposer: `mailto:${EMAIL_REDACTION}?subject=${encodeURIComponent("Proposer une marque à rework°")}`,
  ecrire: `mailto:${EMAIL_REDACTION}?subject=${encodeURIComponent("Message à la rédaction rework°")}`,
} as const;

export const lienMarque = (slug: string) => `/marque/${slug}`;
export const lienDomaine = (id: DomaineId) => `/index?domaine=${id}`;
