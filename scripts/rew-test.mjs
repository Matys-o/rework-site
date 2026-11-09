// Les 8 conversations du brief, envoyées à /api/rew (local : npx wrangler pages dev dist --port 8788, clé dans .dev.vars).
// node scripts/rew-test.mjs [url]   → affiche texte + ids choisis et vérifie : ids existants, ≤ 2 par univers, liens issus de l'archive.
import fs from "node:fs";
const URL_API = process.argv[2] ?? "http://localhost:8788/api/rew";
const lire = (f) => JSON.parse(fs.readFileSync(new URL(`../src/data/${f}`, import.meta.url), "utf8"));
const ARCHIVE = new Map(
  [...lire("brands.json"), ...lire("films.json"), ...lire("musique/artistes.json"), ...lire("musique/sorties.json")].map((e) => [e.id, e]),
);
const liensArchive = (e) => [e.url, ...Object.values(e.liens ?? {})].filter(Boolean);

const CONVERSATIONS = [
  ["Je cherche un cadeau pour ma fille. Elle adore la mode, le rose, les ambiances années 2000, la musique vintage comme le rock and roll, et elle fait de la guitare électrique.", "Elle aime aussi Sofia Coppola."],
  ["Des artistes dans le style de Tyler, The Creator."],
  ["J'aime les objets minimalistes et le design japonais."],
  ["Des références pour une playlist techno industrielle."],
  ["Offrir quelque chose à quelqu'un qui adore le cinéma des années 90."],
  ["Je cherche quelque chose de cool pour mon appartement."],
  ["Une soirée à Paris : une marque à porter, un album à écouter avant de sortir et un film pour finir la nuit."],
  ["Des marques d'équipement d'équitation pour une cavalière de compétition."],
];

for (const [n, tours] of CONVERSATIONS.entries()) {
  const messages = [];
  let profil;
  console.log(`\n══ ${n + 1}. ${tours[0]}`);
  for (const texte of tours) {
    messages.push({ role: "user", content: texte });
    const debut = Date.now();
    const r = await fetch(URL_API, { method: "POST", headers: { "content-type": "application/json", origin: new URL(URL_API).origin }, body: JSON.stringify({ messages, profil }) });
    const c = await r.json();
    if (c.erreur) {
      console.log(`  ✗ erreur ${r.status} : ${c.erreur}`);
      break;
    }
    profil = c.profil;
    if (texte !== tours[0]) console.log(`  → suite : « ${texte} »`);
    console.log(`  (${((Date.now() - debut) / 1000).toFixed(1)} s) ${c.message}`);
    const problemes = [];
    for (const s of c.sections) {
      if (s.cartes.length > 2) problemes.push(`${s.univers} : ${s.cartes.length} cartes`);
      console.log(`  ${s.univers} :`);
      for (const k of s.cartes) {
        const e = ARCHIVE.get(k.id);
        if (!e) problemes.push(`id ${k.id} inexistant`);
        if (k.action && e && !liensArchive(e).includes(k.action.url)) problemes.push(`lien inventé ${k.action.url}`);
        console.log(`    R°${k.id} ${k.nom} — ${k.raison}${k.action ? ` [${k.action.label}]` : ""}`);
      }
    }
    if (c.conclusion || c.question) console.log(`  ${[c.conclusion, c.question].filter(Boolean).join(" ")}`);
    console.log(problemes.length ? `  ✗ ${problemes.join(" ; ")}` : "  ✓ ids, limites et liens conformes");
    messages.push({ role: "assistant", content: [c.message, c.sections.flatMap((s) => s.cartes.map((k) => k.nom)).join(", "), c.question].filter(Boolean).join(" ") });
  }
}
