// La lettre de rework° — rendu et Brevo.
//
//   node scripts/lettre.mjs apercu [--semaine 2026-W44] [--sortie dossier]   écrit lettre.html + lettre.txt (aucun envoi)
//   node scripts/lettre.mjs test --a adresse@exemple.com [--semaine …]        envoi de TEST (email transactionnel Brevo)
//   node scripts/lettre.mjs brouillon [--a adresse@exemple.com]               campagne Brevo en BROUILLON + test à l'adresse
//
// Jamais d'envoi à une liste : la campagne reste en brouillon, l'envoi se fait à la main depuis Brevo après relecture.
// Variables (.env en local, secrets GitHub dans l'Action) : BREVO_API_KEY, BREVO_LIST_ID, BREVO_SENDER_EMAIL.
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { createServer } from "vite";

const racine = path.resolve(import.meta.dirname, "..");
if (existsSync(path.join(racine, ".env"))) process.loadEnvFile(path.join(racine, ".env"));

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { semaine: { type: "string" }, a: { type: "string" }, sortie: { type: "string" } },
});
const commande = positionals[0];
if (!["apercu", "test", "brouillon"].includes(commande)) {
  console.error("Usage : node scripts/lettre.mjs apercu | test --a email | brouillon [--a email]");
  process.exit(1);
}

const NOM_EXPEDITEUR = "rework°";

async function brevo(methode, chemin, corps) {
  const cle = process.env.BREVO_API_KEY;
  if (!cle) throw new Error("BREVO_API_KEY manquante (.env en local, secret GitHub dans l'Action)");
  const reponse = await fetch(`https://api.brevo.com/v3${chemin}`, {
    method: methode,
    headers: { "api-key": cle, accept: "application/json", "content-type": "application/json" },
    body: corps ? JSON.stringify(corps) : undefined,
  });
  const texte = await reponse.text();
  const donnees = texte ? JSON.parse(texte) : {};
  if (!reponse.ok) throw Object.assign(new Error(`Brevo ${methode} ${chemin} → ${reponse.status} ${texte}`), { donnees, statut: reponse.status });
  return donnees;
}

function expediteur() {
  const email = process.env.BREVO_SENDER_EMAIL;
  if (!email) throw new Error("BREVO_SENDER_EMAIL manquante : l'adresse d'expédition vérifiée dans Brevo");
  return { name: NOM_EXPEDITEUR, email };
}

const vite = await createServer({
  root: racine,
  logLevel: "error",
  server: { middlewareMode: true },
  appType: "custom",
  optimizeDeps: { noDiscovery: true, entries: [] },
});
try {
  const { LETTRES, lettreDeLaSemaine } = await vite.ssrLoadModule("/src/lettre/lettre.ts");
  const { rendreLettre, DESINSCRIPTION_BREVO } = await vite.ssrLoadModule("/src/lettre/rendu.tsx");

  const lettre = values.semaine ? LETTRES.find((l) => l.trio.semaine === values.semaine) : lettreDeLaSemaine();
  if (!lettre) throw new Error(`Aucune lettre pour la semaine ${values.semaine}`);
  console.log(`Lettre n°${lettre.numero} — ${lettre.trio.semaine} — « ${lettre.sujet} » — ${lettre.entrees.length} entrée(s) de la semaine`);

  if (commande === "apercu") {
    const sortie = path.resolve(values.sortie ?? path.join(racine, "dist-lettre"));
    await mkdir(sortie, { recursive: true });
    const { html, texte } = await rendreLettre(lettre);
    await writeFile(path.join(sortie, "lettre.html"), html);
    await writeFile(path.join(sortie, "lettre.txt"), texte);
    console.log(`Aperçu : ${path.join(sortie, "lettre.html")} (${Math.round(html.length / 1024)} Ko)`);
  }

  /** Envoi transactionnel : une seule adresse, aucune liste. Le lien de désinscription pointe vers /confidentialite. */
  async function envoyerTest(destinataire) {
    const { html, texte } = await rendreLettre(lettre);
    const { messageId } = await brevo("POST", "/smtp/email", {
      sender: expediteur(),
      to: [{ email: destinataire }],
      subject: `[TEST] ${lettre.sujet}`,
      htmlContent: html,
      textContent: texte,
      tags: ["lettre-test"],
    });
    console.log(`Test envoyé à ${destinataire} (message ${messageId})`);
  }

  if (commande === "test") {
    if (!values.a) throw new Error("--a adresse@exemple.com requis");
    await envoyerTest(values.a);
  }

  if (commande === "brouillon") {
    const listId = Number(process.env.BREVO_LIST_ID);
    if (!listId) throw new Error("BREVO_LIST_ID manquante : l'identifiant de la liste des abonné·es");
    const nom = `Lettre n°${lettre.numero} — ${lettre.trio.semaine}`;

    // Une seule campagne par lettre : si le brouillon existe déjà (relance de l'Action), il est mis à jour
    const { campaigns = [] } = await brevo("GET", "/emailCampaigns?status=draft&limit=100&sort=desc");
    const existante = campaigns.find((c) => c.name === nom);
    const { html } = await rendreLettre(lettre, DESINSCRIPTION_BREVO);
    const campagne = {
      name: nom,
      subject: lettre.sujet,
      previewText: lettre.apercu,
      sender: expediteur(),
      htmlContent: html,
      recipients: { listIds: [listId] },
      // Pas de scheduledAt : la campagne reste un brouillon
    };
    // Brevo refuse une liste sans contact : le brouillon est alors créé sans destinataires (liste à choisir à l'envoi)
    const enregistrer = async (corps) => {
      if (existante) {
        await brevo("PUT", `/emailCampaigns/${existante.id}`, corps);
        return existante.id;
      }
      return (await brevo("POST", "/emailCampaigns", corps)).id;
    };
    let id;
    try {
      id = await enregistrer(campagne);
    } catch (e) {
      if (!/no contacts/i.test(e.donnees?.message ?? "")) throw e;
      const { recipients, ...sansListe } = campagne;
      id = await enregistrer(sansListe);
      console.log("La liste est encore vide : brouillon créé sans destinataires, choisis la liste dans Brevo au moment d'envoyer.");
    }
    console.log(`Brouillon ${existante ? "mis à jour" : "créé"} : campagne ${id} « ${nom} »`);

    if (values.a) {
      try {
        await brevo("POST", `/emailCampaigns/${id}/sendTest`, { emailTo: [values.a] });
        console.log(`Test de la campagne envoyé à ${values.a}`);
      } catch (e) {
        // Brevo n'accepte que les adresses de la liste de test : on retombe sur un envoi transactionnel du même contenu
        console.log(`Test de campagne refusé (${e.donnees?.message ?? e.message}) → envoi transactionnel`);
        await envoyerTest(values.a);
      }
    }
    console.log(`À relire puis envoyer depuis Brevo : https://app.brevo.com/marketing-campaign/edit/${id}`);
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await vite.close();
  // Le serveur Vite peut garder des poignées ouvertes : on sort explicitement
  process.exit(process.exitCode ?? 0);
}
