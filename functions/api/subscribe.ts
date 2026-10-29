// Cloudflare Pages Function — POST /api/subscribe : inscription à la lettre avec double opt-in Brevo.
// La clé API reste côté serveur (variable d'environnement Cloudflare BREVO_API_KEY), jamais dans le code du navigateur.
// Brevo envoie l'email de confirmation (modèle BREVO_DOI_TEMPLATE_ID) ; le contact n'entre dans la liste qu'après le clic.
import { SITE_URL } from "../../src/lib/site";

type Env = {
  BREVO_API_KEY?: string;
  BREVO_LIST_ID?: string;
  BREVO_DOI_TEMPLATE_ID?: string;
};

type Contexte = { request: Request; env: Env };

const reponse = (statut: number, corps: { ok: boolean; code: string }) =>
  new Response(JSON.stringify(corps), {
    status: statut,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const onRequestPost = async ({ request, env }: Contexte) => {
  // Formulaire du site uniquement (le navigateur envoie toujours Origin sur un POST fetch)
  const origine = request.headers.get("origin");
  if (
    origine &&
    origine !== new URL(request.url).origin &&
    origine !== SITE_URL
  )
    return reponse(403, { ok: false, code: "origine" });

  if (!env.BREVO_API_KEY || !env.BREVO_LIST_ID || !env.BREVO_DOI_TEMPLATE_ID) {
    console.error("subscribe : variables Brevo manquantes");
    return reponse(503, { ok: false, code: "indisponible" });
  }

  let corps: { email?: unknown; site?: unknown };
  try {
    corps = await request.json();
  } catch {
    return reponse(400, { ok: false, code: "email" });
  }
  // Champ piège invisible : un robot le remplit, une personne non — on fait comme si tout allait bien
  if (typeof corps.site === "string" && corps.site)
    return reponse(200, { ok: true, code: "confirmation" });

  const email =
    typeof corps.email === "string" ? corps.email.trim().toLowerCase() : "";
  if (email.length > 254 || !EMAIL.test(email))
    return reponse(400, { ok: false, code: "email" });

  const brevo = await fetch(
    "https://api.brevo.com/v3/contacts/doubleOptinConfirmation",
    {
      method: "POST",
      headers: {
        "api-key": env.BREVO_API_KEY,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        email,
        includeListIds: [Number(env.BREVO_LIST_ID)],
        templateId: Number(env.BREVO_DOI_TEMPLATE_ID),
        redirectionUrl: `${SITE_URL}/inscription-confirmee`,
      }),
    },
  );
  if (brevo.ok) return reponse(200, { ok: true, code: "confirmation" });

  const erreur = await brevo.text();
  // Contact déjà présent : Brevo renvoie 400 « duplicate_parameter » — pas une erreur pour la personne
  if (brevo.status === 400 && /duplicate|already/i.test(erreur))
    return reponse(200, { ok: true, code: "deja" });
  console.error(`subscribe : Brevo ${brevo.status} ${erreur}`);
  return reponse(502, { ok: false, code: "brevo" });
};
