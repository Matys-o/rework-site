// generated/ids.json (IDs des salons/rôles créés) et state/posted.json (historique des publications).
// Aucun secret dans ces fichiers : ils sont commités.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { RACINE } from "./env.ts";

function lireJson<T>(chemin: string, defaut: T): T {
  if (!existsSync(chemin)) return defaut;
  return { ...defaut, ...JSON.parse(readFileSync(chemin, "utf8")) };
}
const ecrireJson = (chemin: string, data: unknown) => writeFileSync(chemin, `${JSON.stringify(data, null, 2)}\n`);

// ─── IDs ────────────────────────────────────────────────────────────────────

export type Ids = {
  roles: Record<string, string>;
  categories: Record<string, string>;
  channels: Record<string, string>;
  /** Message épinglé → salon (ou fil de forum) + message */
  messages: Record<string, { channel: string; message: string }>;
  automod: Record<string, string>;
};

const CHEMIN_IDS = `${RACINE}generated/ids.json`;
export const lireIds = (): Ids =>
  lireJson<Ids>(CHEMIN_IDS, { roles: {}, categories: {}, channels: {}, messages: {}, automod: {} });
export const ecrireIds = (ids: Ids) => ecrireJson(CHEMIN_IDS, ids);

// ─── Historique ─────────────────────────────────────────────────────────────

export type Publication = { id: number; slug: string; nom: string; date: string; message?: string };
export type Ignoree = { id: number; slug: string; date: string; raison: string };

export type Fil = {
  /** Numéro de la publication suivante − 1 (« marque n°N ») */
  total: number;
  /** Tour en cours (1, 2, …) : on repart dans un nouvel ordre quand toutes les entrées sont passées */
  cycle: number;
  /** Date de la première publication du tour (sert à repérer les entrées ajoutées depuis) */
  cycleDebut?: string;
  publiees: Publication[];
  /** Écartées pendant ce tour (image manquante…), retentées au tour suivant */
  ignorees: Ignoree[];
};

export type Etat = {
  marque: Fil;
  film: Fil;
  /** Semaine ISO → message publié */
  trio: Record<string, { date: string; message?: string }>;
};

const filVide = (): Fil => ({ total: 0, cycle: 1, publiees: [], ignorees: [] });
const CHEMIN_ETAT = `${RACINE}state/posted.json`;
export const lireEtat = (): Etat => lireJson<Etat>(CHEMIN_ETAT, { marque: filVide(), film: filVide(), trio: {} });
export const ecrireEtat = (etat: Etat) => ecrireJson(CHEMIN_ETAT, etat);

/** Transmet une valeur à l'étape suivante de la GitHub Action (message de commit) */
export function sortieGithub(nom: string, valeur: string) {
  const f = process.env.GITHUB_OUTPUT;
  if (f) writeFileSync(f, `${nom}=${valeur.replace(/[\r\n]/g, " ")}\n`, { flag: "a" });
}
