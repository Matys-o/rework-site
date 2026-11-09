// Génère filtres-a-relire.md : famille, gamme de prix estimée, pays, époque et couleur de chaque marque, par univers.
// Usage : node scripts/filtres-relecture.mjs — corriger ensuite src/data/attributs.json (famille, prix) si besoin.
import fs from "node:fs/promises";
import path from "node:path";

const R = path.resolve(import.meta.dirname, "..");
const lire = async (f) => JSON.parse(await fs.readFile(path.join(R, f), "utf8"));
const marques = await lire("src/data/brands.json");
const attributs = await lire("src/data/attributs.json");
const couleurs = await lire("src/data/couleurs.json");

const UNIVERS = { fashion: "Mode", design: "Design", tech: "Tech", digital: "Digital" };
const EUROS = ["", "€", "€€", "€€€", "€€€€"];

let md = `# Filtres : à relire\n\nGénéré par \`node scripts/filtres-relecture.mjs\`. Famille et prix se corrigent dans \`src/data/attributs.json\` (id → [famille, prix]).\nPrix = estimation éditoriale : € accessible · €€ milieu de gamme · €€€ premium · €€€€ luxe. Couleur = calculée depuis l'image (\`node scripts/couleurs.mjs\`), « — » = pas d'image exploitable.\n`;
for (const [type, nom] of Object.entries(UNIVERS)) {
  const liste = marques.filter((m) => m.type === type);
  const parFamille = {};
  for (const m of liste) (parFamille[attributs[m.id][0]] ??= []).push(m);
  md += `\n## ${nom} (${liste.length})\n`;
  for (const [famille, ms] of Object.entries(parFamille)) {
    md += `\n### ${famille} (${ms.length})\n\n| id | Marque | Prix | Origine | Année | Couleur |\n|---|---|---|---|---|---|\n`;
    for (const m of ms.sort((a, b) => attributs[a.id][1] - attributs[b.id][1] || a.name.localeCompare(b.name)))
      md += `| ${m.id} | ${m.name.trim()} | ${EUROS[attributs[m.id][1]]} | ${m.origin ?? ""} | ${m.year ?? ""} | ${couleurs[m.id] ?? "—"} |\n`;
  }
}
await fs.writeFile(path.join(R, "filtres-a-relire.md"), md);
console.log("filtres-a-relire.md écrit");
