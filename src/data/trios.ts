// Trios : un film → une marque → une autre marque, reliés par un fil commun.
// Trois par semaine ISO dans trios.json — lundi, jeudi, samedi (champ « jour », lundi par défaut).
// Le trio affiché est calculé à partir de la date du jour, côté navigateur : il change tout seul, sans redéploiement.
import BRUT from "./trios.json";
import { MARQUES, type Marque } from "./brands";

export type JourTrio = "lundi" | "jeudi" | "samedi";

export type Trio = {
  /** Identifiant d'URL : « 2026-W44 » (lundi), « 2026-W45-jeudi », « 2026-W45-samedi » */
  id: string;
  /** Semaine ISO, ex. « 2026-W44 » */
  semaine: string;
  jour: JourTrio;
  /** Date de publication (AAAA-MM-JJ) */
  date: string;
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

type TrioBrut = { semaine: string; jour?: JourTrio; titre: string; items: number[]; liens: string[]; intro: string };

const DECALAGE: Record<JourTrio, number> = { lundi: 0, jeudi: 3, samedi: 5 };

/** Date (AAAA-MM-JJ) d'un jour d'une semaine ISO — le 4 janvier est toujours en semaine 1 */
function dateIso(annee: number, numero: number, jour: JourTrio) {
  const quatre = new Date(Date.UTC(annee, 0, 4));
  const d = new Date(Date.UTC(annee, 0, 4 - ((quatre.getUTCDay() || 7) - 1) + (numero - 1) * 7 + DECALAGE[jour]));
  return d.toISOString().slice(0, 10);
}

/** Date du jour (AAAA-MM-JJ) à l'heure locale */
export function aujourdhui(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

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
  const jour = t.jour ?? "lundi";
  return {
    ...t,
    id: jour === "lundi" ? t.semaine : `${t.semaine}-${jour}`,
    jour,
    date: dateIso(annee, numero, jour),
    annee,
    numero,
    items: items as Trio["items"],
    liens: t.liens as Trio["liens"],
  };
}

/** Tous les trios, du plus ancien au plus récent (par date de publication) */
export const TRIOS: Trio[] = (BRUT as TrioBrut[])
  .map(construire)
  .filter((t): t is Trio => t !== null)
  .sort((a, b) => a.date.localeCompare(b.date));

/** Trios déjà publiés (celui du jour compris), du plus récent au plus ancien */
export const triosPublies = (date = new Date()) => {
  const jour = aujourdhui(date);
  return TRIOS.filter((t) => t.date <= jour).reverse();
};

/** Trio en cours (le dernier publié : lundi, jeudi ou samedi) ; avant le tout premier, le premier */
export const trioDeLaSemaine = (date = new Date()) => triosPublies(date)[0] ?? TRIOS[0];

/** Nombre de trios déjà écrits pour les semaines à venir */
export const triosAVenir = (date = new Date()) => TRIOS.length - triosPublies(date).length;
