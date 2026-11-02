// Heure de Paris, quel que soit le fuseau de la machine (les runners GitHub sont en UTC).
import { semaineIso } from "../../src/data/trios.ts";

export const HEURE_PUBLICATION = 9;

/** Date (AAAA-MM-JJ) et heure à Paris */
export function paris(d = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Paris",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return { date: `${p.year}-${p.month}-${p.day}`, heure: Number(p.hour) % 24 };
}

/** « 2026-11-03 » → « 3 novembre 2026 » */
export const dateLongue = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T12:00:00Z`),
  );

/** Semaine ISO d'une date AAAA-MM-JJ (même calcul que le site) */
export function semaineDe(iso: string) {
  const [a, m, j] = iso.split("-").map(Number);
  return semaineIso(new Date(a, m - 1, j));
}

/** Petit générateur pseudo-aléatoire reproductible à partir d'un texte (la date du jour) */
export function aleatoire(graine: string) {
  let h = 2166136261;
  for (const c of graine) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
