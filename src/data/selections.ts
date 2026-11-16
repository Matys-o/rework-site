// « Les sélections de la semaine » du Dressing : un fichier par semaine ISO (data/dressing/selections/2026-W47.json).
// Aucune IA au chargement : la page lit le fichier de la semaine en cours, sinon le dernier disponible.
import { produitDispo, type Produit } from "./dressing";
import { semaineIso } from "./trios";

type SelectionBrute = { semaine: string; theme: string; phrase: string; pieces: string[] };
export type Selection = SelectionBrute & { numero: number; annee: number; produits: Produit[] };

// Imports explicites (pas d'import.meta.glob : ce module est aussi chargé par les Pages Functions via meta.ts).
// Nouvelle semaine : créer data/dressing/selections/AAAA-Www.json puis l'ajouter ici.
import W47 from "../../data/dressing/selections/2026-W47.json";
import W48 from "../../data/dressing/selections/2026-W48.json";
import W49 from "../../data/dressing/selections/2026-W49.json";
const FICHIERS: SelectionBrute[] = [W47, W48, W49];

export const SELECTIONS: Selection[] = FICHIERS
  .map((s) => ({
    ...s,
    annee: Number(s.semaine.slice(0, 4)),
    numero: Number(s.semaine.slice(6)),
    // Une pièce indisponible ou inconnue est masquée
    produits: s.pieces.map((id) => produitDispo(id)).filter((p): p is Produit => !!p),
  }))
  .sort((a, b) => b.semaine.localeCompare(a.semaine));

/** Sélection de la semaine ISO en cours, sinon la dernière déjà commencée, sinon la plus ancienne */
export function selectionCourante(date = new Date()) {
  const s = semaineIso(date);
  return SELECTIONS.find((x) => x.semaine === s) ?? SELECTIONS.find((x) => x.semaine < s) ?? SELECTIONS[SELECTIONS.length - 1];
}
/** Sélections déjà publiées (semaine en cours comprise), la plus récente d'abord */
export const selectionsPubliees = (date = new Date()) => SELECTIONS.filter((x) => x.semaine <= semaineIso(date));
