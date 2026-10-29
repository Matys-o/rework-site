// Trio de la semaine : un film → une marque → une autre marque, reliés par un fil commun.
// Une entrée par semaine ISO dans trios.json. Le trio affiché est calculé à partir de la date du jour,
// côté navigateur : il change tout seul chaque lundi, sans redéploiement.
import BRUT from "./trios.json";
import { MARQUES, type Marque } from "./brands";

export type Trio = {
  /** Semaine ISO, ex. « 2026-W44 » */
  semaine: string;
  annee: number;
  /** Numéro de semaine (44) */
  numero: number;
  titre: string;
  intro: string;
  /** Film, marque, marque */
  items: [Marque, Marque, Marque];
  /** Phrases reliant 1→2 et 2→3 */
  liens: [string, string];
};

type TrioBrut = { semaine: string; titre: string; items: number[]; liens: string[]; intro: string };

const PAR_ID = new Map(MARQUES.map((m) => [m.id, m]));

/** Semaine ISO 8601 d'une date (la semaine commence le lundi ; la semaine 1 contient le premier jeudi de l'année) */
export function semaineIso(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const jour = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - jour); // jeudi de la même semaine
  const annee = d.getUTCFullYear();
  const numero = Math.ceil(((d.getTime() - Date.UTC(annee, 0, 1)) / 86400000 + 1) / 7);
  return `${annee}-W${String(numero).padStart(2, "0")}`;
}

function construire(t: TrioBrut): Trio | null {
  const items = t.items.map((id) => PAR_ID.get(id));
  if (items.length !== 3 || items.some((m) => !m) || t.liens.length !== 2) {
    console.error(`Trio ${t.semaine} ignoré : entrée introuvable ou liens incomplets`);
    return null;
  }
  const [annee, numero] = t.semaine.split("-W").map(Number);
  return { ...t, annee, numero, items: items as Trio["items"], liens: t.liens as Trio["liens"] };
}

/** Tous les trios, du plus ancien au plus récent (« 2026-W44 » < « 2027-W01 » en ordre alphabétique) */
export const TRIOS: Trio[] = (BRUT as TrioBrut[])
  .map(construire)
  .filter((t): t is Trio => t !== null)
  .sort((a, b) => a.semaine.localeCompare(b.semaine));

/** Trios déjà publiés (semaine en cours comprise), du plus récent au plus ancien */
export const triosPublies = (date = new Date()) => {
  const courante = semaineIso(date);
  return TRIOS.filter((t) => t.semaine <= courante).reverse();
};

/** Trio de la semaine en cours ; à défaut le dernier publié ; avant le tout premier, le premier */
export const trioDeLaSemaine = (date = new Date()) => triosPublies(date)[0] ?? TRIOS[0];

/** Nombre de trios déjà écrits pour les semaines à venir */
export const triosAVenir = (date = new Date()) => TRIOS.length - triosPublies(date).length;
