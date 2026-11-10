// Diagnostic REW (sans serveur) : appelle repondre() directement et journalise, pour chaque appel au modèle,
// la durée, stop_reason et les tokens de sortie. Clé lue dans ANTHROPIC_API_KEY (jamais affichée).
// npx esbuild scripts/rew-diagnostic.ts --bundle --platform=node --format=esm --outfile=<tmp>.mjs && node <tmp>.mjs "brief…"
import Anthropic from "@anthropic-ai/sdk";
import { repondre } from "../src/lib/rew/serveur";

const BRIEF =
  process.argv[2] ??
  "Je prépare un moodboard pour une marque de vêtements indépendante qui va lancer sa première collection à l'automne. On veut une ambiance brutaliste mais chaleureuse : béton brut, laine bouillie, tons terreux, quelque chose entre l'architecture japonaise des années 70 et la scène techno de Berlin. Les références qui nous parlent : Lemaire, Our Legacy, les meubles de Pierre Chapo, les pochettes d'albums ECM, le film Paris, Texas. Il nous faut des marques, des objets, de la musique et des films pour nourrir l'univers, avec une vraie cohérence.";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 0, timeout: 120_000 });
const create = client.messages.create.bind(client.messages);
(client.messages as any).create = async (p: any, o: any) => {
  const t = Date.now();
  try {
    const r: any = await create(p, o);
    console.log(`  appel ${p.max_tokens} max : ${((Date.now() - t) / 1000).toFixed(1)} s, stop=${r.stop_reason}, sortie=${r.usage.output_tokens} tokens`);
    return r;
  } catch (e: any) {
    console.log(`  appel en erreur après ${((Date.now() - t) / 1000).toFixed(1)} s : ${e?.constructor?.name} ${e?.status ?? ""}`);
    throw e;
  }
};
console.log(`brief : ${BRIEF.length} caractères`);
const t = Date.now();
try {
  const r = await repondre(client, [{ role: "user", content: BRIEF.slice(0, 2000) }]);
  console.log(`OK en ${((Date.now() - t) / 1000).toFixed(1)} s — ${r.sections.map((s) => `${s.univers}:${s.cartes.map((c) => c.nom).join("+")}`).join(" | ")}`);
  console.log(r.message);
} catch (e: any) {
  console.log(`ÉCHEC en ${((Date.now() - t) / 1000).toFixed(1)} s : ${e?.message}`);
}
