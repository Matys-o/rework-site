// Cloudflare Pages Function — POST /api/rew : REW, le curateur culturel.
// La clé ANTHROPIC_API_KEY reste côté serveur (secret Cloudflare), jamais dans le code du navigateur ni dans le repo.
// Rien n'est stocké ni journalisé : la conversation et le profil vivent dans la session du navigateur.
// Les journaux ne contiennent que des durées, des longueurs et des codes d'erreur.
import Anthropic from "@anthropic-ai/sdk";
import { SITE_URL } from "../../src/lib/site";
import {
  BUDGET_MS,
  EchecRew,
  LONGUEUR_MAX,
  RefusRew,
  historiquePropre,
  profilPropre,
  repondre,
} from "../../src/lib/rew/serveur";
import type { ErreurRew } from "../../src/lib/rew/types";

type Env = { ANTHROPIC_API_KEY?: string };
type Contexte = { request: Request; env: Env };

const LIMITE_HEURE = 20;

const json = (statut: number, corps: unknown) =>
  new Response(JSON.stringify(corps), {
    status: statut,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
const erreur = (statut: number, code: ErreurRew["erreur"]) =>
  json(statut, { erreur: code } satisfies ErreurRew);

// Limite simple : 20 messages par heure et par visiteur, en mémoire de l'instance (empreinte de l'IP, jamais l'IP en clair).
// Approximatif (chaque instance Cloudflare a son compteur) ; une limite stricte demanderait KV ou les Rate Limiting Rules.
const compteurs = new Map<string, number[]>();
async function empreinte(ip: string) {
  const h = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`rew:${ip}`),
  );
  return [...new Uint8Array(h).slice(0, 8)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
function depasse(cle: string) {
  const maintenant = Date.now();
  const recents = (compteurs.get(cle) ?? []).filter(
    (t) => maintenant - t < 3_600_000,
  );
  if (recents.length >= LIMITE_HEURE) {
    compteurs.set(cle, recents);
    return true;
  }
  recents.push(maintenant);
  compteurs.set(cle, recents);
  if (compteurs.size > 5000) compteurs.delete(compteurs.keys().next().value!);
  return false;
}
/** Une demande qui échoue de notre côté ne compte pas : la nouvelle tentative automatique ne coûte rien au visiteur */
function rembourser(cle: string) {
  compteurs.get(cle)?.pop();
}

export const onRequestPost = async ({ request, env }: Contexte) => {
  const origine = request.headers.get("origin");
  if (
    origine &&
    origine !== new URL(request.url).origin &&
    origine !== SITE_URL
  )
    return erreur(403, "invalide");

  let corps: { messages?: unknown; profil?: unknown };
  try {
    corps = await request.json();
  } catch {
    return erreur(400, "invalide");
  }
  const brut = Array.isArray(corps.messages) ? corps.messages : [];
  const dernier = brut[brut.length - 1] as { content?: unknown } | undefined;
  if (
    typeof dernier?.content === "string" &&
    dernier.content.length > LONGUEUR_MAX
  )
    return erreur(413, "trop-long");
  const messages = historiquePropre(brut);
  if (!messages || !messages[messages.length - 1].content.trim())
    return erreur(400, "invalide");
  if (!env.ANTHROPIC_API_KEY) return erreur(503, "indisponible");

  const cle = await empreinte(
    request.headers.get("cf-connecting-ip") ?? "local",
  );
  if (depasse(cle)) return erreur(429, "limite");

  // Délais et nouvelle tentative gérés appel par appel dans repondre() : le SDK ne retente pas tout seul
  // (avant : timeout 25 s × 2 essais en silence, sans distinction des erreurs)
  const client = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    maxRetries: 0,
  });
  const debut = Date.now();
  try {
    const reponse = await repondre(
      client,
      messages,
      profilPropre(corps.profil),
      debut + BUDGET_MS,
    );
    console.log(
      `rew ok : ${Date.now() - debut} ms, message de ${messages[messages.length - 1].content.length} caractères`,
    );
    return json(200, reponse);
  } catch (e) {
    if (e instanceof RefusRew) return erreur(200, "refus");
    rembourser(cle);
    const code = e instanceof EchecRew ? e.code : "inconnue";
    console.error(
      `rew échec : ${code} après ${Date.now() - debut} ms`,
      e instanceof EchecRew ? "" : e instanceof Error ? e.message : "",
    );
    if (code === "config") return erreur(503, "indisponible");
    if (code === "delai") return erreur(504, "delai");
    if (code === "surcharge") return erreur(503, "surcharge");
    if (code === "generation") return erreur(502, "generation");
    return erreur(502, "erreur");
  }
};
