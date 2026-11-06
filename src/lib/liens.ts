import type { DomaineId } from "../data/brands";

// Plan du site — une seule source pour tous les liens (nav, menu, footer, boutons, fiches).

/** Adresse de la rédaction : « Proposer une marque », « Écrire à la rédaction », Contact du footer */
export const EMAIL_REDACTION = "ouvrardmatys70@gmail.com";

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
  /** Invitation permanente au serveur Discord (arrive dans 👋・nouveaux-arrivants), créée par le bot REWORK */
  discord: "https://discord.gg/7Kau7UfDNZ",
  ecrire: `mailto:${EMAIL_REDACTION}?subject=${encodeURIComponent("Message à la rédaction rework°")}`,
} as const;

export const lienMarque = (slug: string) => `/marque/${slug}`;
export const lienDomaine = (id: DomaineId) => `/index?domaine=${id}`;
