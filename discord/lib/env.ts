// Variables d'environnement : discord/.env en local, secrets GitHub en CI.
// Règle : le token n'est JAMAIS affiché. Toute sortie d'erreur passe par `masquer()`.
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const RACINE = fileURLToPath(new URL("..", import.meta.url));

const FICHIER_ENV = `${RACINE}.env`;
if (existsSync(FICHIER_ENV)) process.loadEnvFile(FICHIER_ENV);

export function exiger(nom: "DISCORD_TOKEN" | "DISCORD_GUILD_ID"): string {
  const v = process.env[nom]?.trim();
  if (!v) throw new Error(`Variable ${nom} manquante : remplis discord/.env (en local) ou le secret GitHub du même nom.`);
  return v;
}

/** Retire le token de n'importe quel texte avant affichage */
export function masquer(texte: string): string {
  const token = process.env.DISCORD_TOKEN?.trim();
  return token ? texte.split(token).join("[token masqué]") : texte;
}

/** Arguments de ligne de commande : --dry-run, --prune, --now, --force, --date=AAAA-MM-JJ, --pool=film */
export function args() {
  const brut = process.argv.slice(2);
  const valeur = (nom: string) => brut.find((a) => a.startsWith(`--${nom}=`))?.split("=")[1];
  return {
    dryRun: brut.includes("--dry-run"),
    prune: brut.includes("--prune"),
    now: brut.includes("--now"),
    force: brut.includes("--force"),
    date: valeur("date"),
    pool: valeur("pool"),
  };
}

/** Point d'entrée commun : affiche une erreur lisible (sans secret) et sort en code 1 */
export async function lancer(main: () => Promise<void>) {
  try {
    await main();
  } catch (e) {
    const texte = e instanceof Error ? (e.stack ?? e.message) : String(e);
    console.error(`\n✖ ${masquer(texte)}`);
    process.exitCode = 1;
  }
}
