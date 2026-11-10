// Tests réels des retours utilisateur (2026-11-10), contre /api/rew (local : npx wrangler pages dev dist --port 8788, clé dans .dev.vars).
// node scripts/rew-test-retours.mjs [url]
import fs from "node:fs";
const URL_API = process.argv[2] ?? "http://localhost:8788/api/rew";
const lire = (f) => JSON.parse(fs.readFileSync(new URL(`../src/data/${f}`, import.meta.url), "utf8"));
const ATTRIBUTS = lire("attributs.json");
const PRIX = ["", "€", "€€", "€€€", "€€€€"];

const CAS = [
  { nom: "Rick Owens moins cher (pastille de l'accueil)", texte: "Des marques dans l'esprit de Rick Owens, moins chères", prixMax: 3 },
  { nom: "Rick Owens moins cher (formulation libre)", texte: "Je cherche des marques dans l'esprit de Rick Owens, mais moins chères.", prixMax: 3 },
  { nom: "Gamme explicite", texte: "Des marques de mobilier japonais accessibles, pas trop chères", prixMax: 2 },
  {
    nom: "Brief de moodboard long",
    texte:
      "Je prépare un moodboard pour une marque de vêtements indépendante qui lance sa première collection à l'automne. On veut une ambiance brutaliste mais chaleureuse : béton brut, laine bouillie, tons terreux, lumière rasante, quelque chose entre l'architecture japonaise des années 70 et la scène techno de Berlin. Les références qui nous parlent : Lemaire, Our Legacy, les meubles de Pierre Chapo, les pochettes ECM, le film Paris, Texas. Il nous faut des marques de mode, des objets et du mobilier, de la musique pour le défilé et un ou deux films pour nourrir l'univers, avec une vraie cohérence d'ensemble. Le public visé a entre 25 et 40 ans, sensible au design, plutôt urbain, qui achète moins mais mieux. On veut éviter le cliché minimaliste tout blanc et garder de la matière, du grain, de l'imperfection. Budget de la marque : milieu de gamme, autour de 150 à 300 euros la pièce.",
  },
];

let echecs = 0;
for (const c of CAS) {
  const debut = Date.now();
  const r = await fetch(URL_API, {
    method: "POST",
    headers: { "content-type": "application/json", origin: new URL(URL_API).origin },
    body: JSON.stringify({ messages: [{ role: "user", content: c.texte }] }),
  });
  const corps = await r.json();
  const duree = ((Date.now() - debut) / 1000).toFixed(1);
  console.log(`\n══ ${c.nom} (${c.texte.length} caractères) — HTTP ${r.status}, ${duree} s`);
  if (corps.erreur) {
    console.log(`  ✗ erreur : ${corps.erreur}`);
    echecs++;
    continue;
  }
  console.log(`  ${corps.message}`);
  for (const s of corps.sections)
    for (const k of s.cartes) {
      const p = ATTRIBUTS[k.id]?.[1];
      const hors = c.prixMax && s.univers !== "musique" && s.univers !== "cinema" && (!p || p > c.prixMax);
      if (hors) echecs++;
      console.log(`  ${hors ? "✗" : "·"} [${s.univers}] ${k.nom} ${p ? PRIX[p] : ""} — ${k.raison}`);
    }
  if (/pas d'information de prix|aucune information (sur les|de) prix/i.test(JSON.stringify(corps))) {
    console.log("  ✗ REW dit ne pas avoir d'information de prix");
    echecs++;
  }
  if (!corps.sections.length) echecs++;
  if (corps.conclusion || corps.question) console.log(`  → ${[corps.conclusion, corps.question].filter(Boolean).join(" ")}`);
}
console.log(echecs ? `\n${echecs} problème(s)` : "\nOK");
process.exit(echecs ? 1 : 0);
