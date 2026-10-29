// Configuration Brevo, à relancer sans risque (idempotent) — lit BREVO_API_KEY dans .env, n'affiche jamais la clé.
//   node scripts/brevo-config.mjs
// 1. vérifie le compte et l'expéditeur (adresse vérifiée, nom « rework° ») ;
// 2. crée (ou retrouve) la liste « rework° — la lettre » ;
// 3. crée (ou met à jour) le modèle de confirmation double opt-in (tag « optin », lien {{ doubleoptin }}) ;
// 4. écrit BREVO_LIST_ID, BREVO_DOI_TEMPLATE_ID et BREVO_SENDER_EMAIL dans .env (valeurs non secrètes).
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";

const racine = path.resolve(import.meta.dirname, "..");
const fichierEnv = path.join(racine, ".env");
process.loadEnvFile(fichierEnv);
const cle = process.env.BREVO_API_KEY;
if (!cle || cle.startsWith("colle")) throw new Error("BREVO_API_KEY absente de .env");

const NOM_LISTE = "rework° — la lettre";
const NOM_MODELE = "rework° — confirmation d'inscription";
const NOM_EXPEDITEUR = "rework°";

async function brevo(methode, chemin, corps) {
  const r = await fetch(`https://api.brevo.com/v3${chemin}`, {
    method: methode,
    headers: { "api-key": cle, accept: "application/json", "content-type": "application/json" },
    body: corps ? JSON.stringify(corps) : undefined,
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`Brevo ${methode} ${chemin} → ${r.status} ${t}`);
  return t ? JSON.parse(t) : {};
}

async function ecrireEnv(valeurs) {
  let env = await readFile(fichierEnv, "utf8");
  for (const [k, v] of Object.entries(valeurs)) {
    const ligne = `${k}=${v}`;
    env = new RegExp(`^${k}=.*$`, "m").test(env) ? env.replace(new RegExp(`^${k}=.*$`, "m"), ligne) : `${env.trimEnd()}\n${ligne}\n`;
  }
  await writeFile(fichierEnv, env);
}

const vite = await createServer({ root: racine, logLevel: "error", server: { middlewareMode: true }, appType: "custom", optimizeDeps: { noDiscovery: true, entries: [] } });
try {
  const compte = await brevo("GET", "/account");
  console.log(`Compte Brevo : ${compte.companyName || compte.email} (${compte.plan?.map((p) => p.type).join(", ")})`);

  // ── Expéditeur : une adresse déjà vérifiée dans Brevo ; on lui donne le nom « rework° » ──
  const { senders = [] } = await brevo("GET", "/senders");
  const voulu = process.env.BREVO_SENDER_EMAIL || compte.email;
  const expediteur = senders.find((s) => s.email.toLowerCase() === voulu.toLowerCase());
  if (!expediteur) {
    const s = await brevo("POST", "/senders", { name: NOM_EXPEDITEUR, email: voulu });
    console.log(`Expéditeur créé (${voulu}, id ${s.id}) : Brevo envoie un email de validation à cette adresse — clique le lien puis relance.`);
  } else {
    if (expediteur.name !== NOM_EXPEDITEUR) await brevo("PUT", `/senders/${expediteur.id}`, { name: NOM_EXPEDITEUR });
    console.log(`Expéditeur : ${NOM_EXPEDITEUR} <${expediteur.email}> — ${expediteur.active ? "actif" : "PAS ENCORE VALIDÉ (clique le lien reçu par email)"}`);
  }

  // ── Liste ──
  const { lists = [] } = await brevo("GET", "/contacts/lists?limit=50");
  let liste = lists.find((l) => l.name === NOM_LISTE);
  if (!liste) {
    const { folders = [] } = await brevo("GET", "/contacts/folders?limit=50");
    const dossier = folders[0] ?? (await brevo("POST", "/contacts/folders", { name: "rework°" }));
    liste = await brevo("POST", "/contacts/lists", { name: NOM_LISTE, folderId: dossier.id });
    console.log(`Liste créée : « ${NOM_LISTE} » (id ${liste.id})`);
  } else {
    console.log(`Liste : « ${NOM_LISTE} » (id ${liste.id}, ${liste.uniqueSubscribers ?? liste.totalSubscribers ?? 0} contact(s))`);
  }

  // ── Modèle de confirmation double opt-in ──
  const { rendreConfirmation } = await vite.ssrLoadModule("/src/lettre/ConfirmationEmail.tsx");
  const modele = {
    templateName: NOM_MODELE,
    subject: "Confirme ton inscription à la lettre de rework°",
    sender: { name: NOM_EXPEDITEUR, email: voulu },
    htmlContent: await rendreConfirmation(),
    tag: "optin",
    isActive: true,
  };
  const { templates = [] } = await brevo("GET", "/smtp/templates?limit=100");
  const existant = templates.find((t) => t.name === NOM_MODELE);
  let idModele = existant?.id;
  if (idModele) {
    await brevo("PUT", `/smtp/templates/${idModele}`, modele);
    console.log(`Modèle de confirmation mis à jour (id ${idModele})`);
  } else {
    ({ id: idModele } = await brevo("POST", "/smtp/templates", modele));
    console.log(`Modèle de confirmation créé (id ${idModele})`);
  }
  const verif = await brevo("GET", `/smtp/templates/${idModele}`);
  console.log(`  reconnu comme double opt-in par Brevo : ${verif.doiTemplate ? "oui" : "NON"}`);

  await ecrireEnv({ BREVO_LIST_ID: liste.id, BREVO_DOI_TEMPLATE_ID: idModele, BREVO_SENDER_EMAIL: voulu });
  console.log("IDs écrits dans .env (BREVO_LIST_ID, BREVO_DOI_TEMPLATE_ID, BREVO_SENDER_EMAIL).");
} finally {
  await vite.close();
  // Le serveur Vite peut garder des poignées ouvertes : on sort explicitement
  process.exit(process.exitCode ?? 0);
}
