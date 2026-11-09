// Cloudflare Pages Function — POST /api/rew : REW, le curateur culturel.
// La clé ANTHROPIC_API_KEY reste côté serveur (secret Cloudflare), jamais dans le code du navigateur ni dans le repo.
// Rien n'est stocké ni journalisé : la conversation et le profil vivent dans la session du navigateur.
import Anthropic from "@anthropic-ai/sdk";
import { SITE_URL } from "../../src/lib/site";
import {
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
const DELAI_MS = 25_000;

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

export const onRequestPost = async ({ request, env }: Contexte) => {
  const origine = request.headers.get("origin");
  if (
    origine &&
    origine !== new URL(request.url).origin &&
    origine !== SITE_URL
  )
    return erreur(403, "invalide");
  if (!env.ANTHROPIC_API_KEY) return erreur(503, "indisponible");

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

  if (
    depasse(await empreinte(request.headers.get("cf-connecting-ip") ?? "local"))
  )
    return erreur(429, "limite");

  const client = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    timeout: DELAI_MS,
    maxRetries: 1,
  });
  try {
    return json(
      200,
      await repondre(client, messages, profilPropre(corps.profil)),
    );
  } catch (e) {
    if (e instanceof RefusRew) return erreur(200, "refus");
    if (e instanceof Anthropic.APIConnectionTimeoutError)
      return erreur(504, "delai");
    if (e instanceof Anthropic.RateLimitError) return erreur(429, "limite");
    // Aucun contenu de conversation dans les journaux : seulement le type d'erreur
    console.error(
      "rew :",
      e instanceof Anthropic.APIError
        ? `API ${e.status}`
        : e instanceof Error
          ? e.message
          : "inconnue",
    );
    return erreur(502, "erreur");
  }
};
