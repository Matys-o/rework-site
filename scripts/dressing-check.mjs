// npm run dressing:check — vérifie chaque pièce du Dressing sur sa page officielle, lentement et poliment :
// une requête toutes les 4 s, robots.txt respecté. Sort la liste des pièces à revérifier (page morte, produit absent,
// prix changé, rupture). Avec --appliquer : marque `dispo: false` les pièces introuvables ou en rupture
// (elles sont alors masquées et leur niveau de budget désactivé jusqu'à remplacement). Rien n'est supprimé.
import fs from "node:fs";
import { lireFiche, pause } from "./dressing-fiche.mjs";

const fichier = new URL("../data/dressing/products.json", import.meta.url);
const produits = JSON.parse(fs.readFileSync(fichier, "utf8"));
const APPLIQUER = process.argv.includes("--appliquer");
const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const aRevoir = [];

for (const [i, p] of produits.entries()) {
  if (i) await pause(4000);
  const f = await lireFiche(p.url);
  const problemes = [];
  if (f.statut === "robots") problemes.push("page interdite par robots.txt : vérifier à la main");
  else if (f.statut !== 200) problemes.push(`page en ${f.statut}`);
  else {
    // Le produit est-il toujours là ? Le nom de la page doit contenir les mots principaux du nom enregistré
    const mots = norm(p.name).split(" ").filter((m) => m.length > 3);
    const nomPage = norm(f.nom);
    if (mots.length && !mots.some((m) => nomPage.includes(m))) problemes.push(`nom de la page différent : « ${f.nom} »`);
    if (f.prix != null && Math.abs(f.prix - p.price) > 0.01) problemes.push(`prix ${f.prix} ${f.devise} (enregistré : ${p.price} €)`);
    if (f.dispo === false) problemes.push("en rupture");
  }
  const etat = problemes.length ? `✗ ${problemes.join(" ; ")}` : "✓";
  console.log(`${p.id.padEnd(44)} ${etat}`);
  if (problemes.length) {
    aRevoir.push(`- ${p.id} (${p.brandName}) : ${problemes.join(" ; ")} — ${p.url}`);
    const perdu = f.statut === 404 || f.statut === 410 || f.dispo === false;
    if (APPLIQUER && perdu) p.dispo = false;
  }
}

if (APPLIQUER) fs.writeFileSync(fichier, JSON.stringify(produits, null, 1) + "\n");
console.log(aRevoir.length ? `\nÀ revérifier (${aRevoir.length}) :\n${aRevoir.join("\n")}` : "\nToutes les pièces répondent, au bon nom et au bon prix.");
