// Lecture des marques : exactement les mêmes données et la même logique que le site
// (src/data/brands.ts lit src/data/brands.json + films.json : slugs, domaines, champs identiques).
// Supabase n'est plus utilisé : le site lui-même n'en dépend plus.
import { MARQUES, DOMAINES, type Marque } from "../../src/data/brands.ts";
import { SITE } from "../config/server.ts";
import { aleatoire, type paris } from "./temps.ts";
import type { Fil } from "./fichiers.ts";

export { DOMAINES, type Marque };

export type Pool = "marque" | "film";

export const entrees = (pool: Pool) =>
  MARQUES.filter((m) => (pool === "film" ? m.domaine === "film" : m.domaine !== "film"));

/** Image en HTTPS absolu, ou undefined (vidéo, absente, http) */
export function imageHttps(m: Marque): string | undefined {
  if (!m.image || m.video) return undefined;
  const url = m.image.startsWith("/") ? `${SITE}${m.image}` : m.image;
  return url.startsWith("https://") ? url : undefined;
}

export const urlFiche = (m: Marque, medium: string) =>
  `${SITE}/marque/${m.slug}?utm_source=discord&utm_medium=${medium}`;

/** Vérifie que l'image répond vraiment (pas de vignette cassée dans le salon public) */
export async function imageAccessible(url: string): Promise<boolean> {
  const essai = async (method: "HEAD" | "GET") => {
    const r = await fetch(url, {
      method,
      redirect: "follow",
      headers: method === "GET" ? { Range: "bytes=0-1023" } : {},
      signal: AbortSignal.timeout(10_000),
    });
    return r.ok && (r.headers.get("content-type") ?? "").startsWith("image/");
  };
  try {
    return (await essai("HEAD")) || (await essai("GET"));
  } catch {
    try {
      return await essai("GET");
    } catch {
      return false;
    }
  }
}

/**
 * Ordre de passage du jour parmi les entrées pas encore publiées ce tour-ci :
 *  1. les entrées ajoutées au site depuis le début du tour (les plus récentes d'abord) ;
 *  2. puis les autres, mélangées avec la date du jour comme graine (relancer le même jour = même résultat).
 */
export function ordreDuJour(pool: Pool, fil: Fil, jour: ReturnType<typeof paris>["date"]) {
  const exclues = new Set([...fil.publiees.map((p) => p.id), ...fil.ignorees.map((p) => p.id)]);
  const restantes = entrees(pool).filter((m) => !exclues.has(m.id));

  const debut = fil.cycleDebut ?? jour;
  const recentes = restantes
    .filter((m) => m.ajouteLe && m.ajouteLe >= debut)
    .sort((a, b) => b.ajouteLe!.localeCompare(a.ajouteLe!) || b.id - a.id);

  const autres = restantes.filter((m) => !recentes.includes(m)).sort((a, b) => a.id - b.id);
  const rnd = aleatoire(`${pool}-${fil.cycle}-${jour}`);
  for (let i = autres.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [autres[i], autres[j]] = [autres[j], autres[i]];
  }
  return [...recentes, ...autres];
}

/** Pourquoi une entrée ne peut pas être publiée (undefined = tout va bien) */
export async function probleme(m: Marque): Promise<string | undefined> {
  if (!m.description) return "description manquante";
  const img = imageHttps(m);
  if (!img) return m.video ? "visuel vidéo (pas d'image fixe)" : "pas d'image en HTTPS";
  if (!(await imageAccessible(img))) return `image inaccessible (${img})`;
  return undefined;
}
