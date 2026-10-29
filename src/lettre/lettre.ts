// La lettre de rework° : une par trio de la semaine, numérotée dans l'ordre des trios (n°1 = premier trio).
// Tout le contenu vient des données : le trio (trios.json) et les entrées ajoutées pendant sa semaine (addedAt).
import { DOMAINES, entreesAjoutees, type Marque } from "../data/brands";
import { semaineIso, TRIOS, type Trio } from "../data/trios";
import { SITE_URL } from "../lib/site";

export type Lettre = {
  numero: number;
  trio: Trio;
  /** Lundi de la semaine ISO du trio (AAAA-MM-JJ) */
  lundi: string;
  /** « 26 oct. 2026 » */
  semaineDu: string;
  /** Entrées ajoutées du lundi au dimanche de cette semaine */
  entrees: Marque[];
  sujet: string;
  /** Texte de prévisualisation (affiché après l'objet dans la boîte de réception) */
  apercu: string;
  /** Version web : /lettre/1 */
  chemin: string;
};

/** Lundi d'une semaine ISO (le 4 janvier est toujours en semaine 1) */
export function lundiIso(annee: number, numero: number) {
  const quatre = new Date(Date.UTC(annee, 0, 4));
  const lundi = new Date(quatre);
  lundi.setUTCDate(
    quatre.getUTCDate() - ((quatre.getUTCDay() || 7) - 1) + (numero - 1) * 7,
  );
  return lundi;
}

const jour = (d: Date) => d.toISOString().slice(0, 10);

const DATE_COURTE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function construire(trio: Trio, i: number): Lettre {
  const lundi = lundiIso(trio.annee, trio.numero);
  const dimanche = new Date(lundi);
  dimanche.setUTCDate(lundi.getUTCDate() + 6);
  const entrees = entreesAjoutees(jour(lundi), jour(dimanche));
  const [film, a, b] = trio.items;
  return {
    numero: i + 1,
    trio,
    lundi: jour(lundi),
    semaineDu: DATE_COURTE.format(lundi),
    entrees,
    sujet: `${trio.titre} — ${film.nom}, ${a.nom}, ${b.nom}`,
    apercu: `${trio.intro}${entrees.length ? ` Et ${entrees.length} ${entrees.length > 1 ? "nouvelles entrées" : "nouvelle entrée"} dans l'archive.` : ""}`,
    chemin: `/lettre/${i + 1}`,
  };
}

/** Toutes les lettres, de la n°1 à la dernière écrite */
export const LETTRES: Lettre[] = TRIOS.map(construire);

/** Lettres dont la semaine a commencé (semaine en cours comprise), de la plus ancienne à la plus récente */
export const lettresPubliees = (date = new Date()) =>
  LETTRES.filter((l) => l.trio.semaine <= semaineIso(date));

/** Lettre de la semaine en cours (à défaut la dernière publiée) */
export const lettreDeLaSemaine = (date = new Date()) =>
  lettresPubliees(date).at(-1) ?? LETTRES[0];

export const trouverLettre = (numero: number) =>
  LETTRES.find((l) => l.numero === numero);

/** Méta d'une entrée dans la lettre : « 01 — FILM · 1979 » */
export const metaEntree = (m: Marque, rang: number) =>
  `${String(rang).padStart(2, "0")} — ${[DOMAINES[m.domaine].nom, m.annee || null].filter(Boolean).join(" · ")}`;

/** Texte d'une entrée : un film commence par sa réalisation, sauf si la description la cite déjà */
export const texteEntree = (m: Marque) =>
  m.domaine === "film" &&
  m.realisation &&
  !m.description.includes(m.realisation)
    ? `${m.realisation}. ${m.description}`
    : m.description;

/** Image de l'entrée dans la lettre : JPEG 1120 × 600 généré au build (photo, ou aura du domaine sans photo exploitable) */
export const imageLettre = (m: Marque) => `${SITE_URL}/email/${m.slug}.jpg`;

export const urlFiche = (m: Marque) => `${SITE_URL}/marque/${m.slug}`;
