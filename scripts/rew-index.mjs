// Index enrichi de REW : data/rew-index.json (lisible et corrigeable à la main).
//
//   node scripts/rew-index.mjs        → ajoute les NOUVELLES entrées (base calculée depuis les données, sans IA)
//   node scripts/rew-index.mjs --ia   → enrichit avec Claude les entrées pas encore enrichies (_ia absent)
//                                       Clé lue dans ANTHROPIC_API_KEY (variable d'environnement locale, jamais dans le repo)
//
// Une entrée marquée "_manuel": true n'est jamais réécrite : c'est ainsi qu'on protège une correction à la main.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lire = (f) => JSON.parse(fs.readFileSync(path.join(R, f), "utf8"));
const SORTIE = path.join(R, "data/rew-index.json");

const brands = lire("src/data/brands.json");
const films = lire("src/data/films.json");
const attributs = lire("src/data/attributs.json");
const couleurs = lire("src/data/couleurs.json");
const artistes = lire("src/data/musique/artistes.json");
const sorties = lire("src/data/musique/sorties.json");
const genres = Object.fromEntries(lire("src/data/musique/genres.json").map((g) => [g.id, g.nom]));
const moods = Object.fromEntries(lire("src/data/musique/moods.json").map((m) => [m.id, m.label]));

const UNIVERS = { fashion: "mode", design: "design", tech: "tech", digital: "digital", film: "cinema" };
const POSITION = { 1: "accessible", 2: "intermédiaire", 3: "premium", 4: "luxe" };
const decennie = (a) => (a ? (a < 1950 ? "avant 1950" : `années ${String(Math.floor(a / 10) * 10).slice(2)}`) : null);
const mots = (s) =>
  (s ?? "")
    .toLowerCase()
    .split(/[\s,/&·+-]+/)
    .filter((m) => m.length > 2);
const uniq = (l) => [...new Set(l.filter(Boolean))];

/** Entrées de base, calculées sans IA à partir des champs existants */
function base() {
  const liste = [];
  for (const b of [...brands, ...films]) {
    const univers = UNIVERS[b.type] ?? "design";
    const [famille, prix] = attributs[b.id] ?? [];
    const annee = Number(b.year) || null;
    liste.push({
      id: b.id,
      univers,
      esthetique: uniq([couleurs[b.id], univers === "cinema" ? decennie(annee) : null]),
      culture: uniq([famille, b.cat?.toLowerCase(), univers === "cinema" ? b.director : null]),
      ambiance: [],
      positionnement: univers === "cinema" ? (b.rank <= 50 ? "classique" : "") : (POSITION[prix] ?? ""),
      motsCles: uniq([...mots(b.cat), ...(b.origin ? [b.origin.toLowerCase()] : [])]),
      affinites: [],
    });
  }
  for (const a of artistes)
    liste.push({
      id: a.id,
      univers: "musique",
      esthetique: [],
      culture: uniq([...a.genres.map((g) => genres[g]?.toLowerCase()), a.ville?.toLowerCase(), a.pays?.toLowerCase()]),
      ambiance: a.moods.map((m) => moods[m]?.toLowerCase()).filter(Boolean),
      positionnement: "",
      motsCles: ["artiste", ...a.genres],
      affinites: a.proches.map((p) => p.id),
    });
  for (const s of sorties)
    liste.push({
      id: s.id,
      univers: "musique",
      esthetique: s.annee ? [decennie(s.annee)] : [],
      culture: uniq(s.genres.map((g) => genres[g]?.toLowerCase())),
      ambiance: s.moods.map((m) => moods[m]?.toLowerCase()).filter(Boolean),
      positionnement: "",
      motsCles: [s.type, ...s.genres],
      affinites: uniq([...s.proches.map((p) => p.id), ...s.artistes]),
    });

  // Affinités des marques : même famille et même pays, puis même famille (3 au plus)
  const parId = Object.fromEntries(brands.map((b) => [b.id, b]));
  for (const e of liste) {
    if (e.affinites.length || !parId[e.id] || !attributs[e.id]) continue;
    const [famille] = attributs[e.id];
    const memes = brands.filter((x) => x.id !== e.id && attributs[x.id]?.[0] === famille);
    e.affinites = [...memes.filter((x) => x.origin === parId[e.id].origin), ...memes].map((x) => x.id).filter((v, i, l) => l.indexOf(v) === i).slice(0, 3);
  }
  return liste;
}

const existant = fs.existsSync(SORTIE) ? JSON.parse(fs.readFileSync(SORTIE, "utf8")).entrees : [];
const parIdExistant = new Map(existant.map((e) => [e.id, e]));
const entrees = base().map((e) => parIdExistant.get(e.id) ?? e);
const nouvelles = entrees.filter((e) => !parIdExistant.has(e.id)).length;

if (process.argv.includes("--ia")) await enrichir(entrees);

fs.mkdirSync(path.dirname(SORTIE), { recursive: true });
fs.writeFileSync(
  SORTIE,
  JSON.stringify(
    {
      _note:
        "Index de REW. esthetique/culture/ambiance/positionnement/motsCles/affinites servent au rapprochement. Corrigeable à la main : ajoute \"_manuel\": true pour qu'une entrée ne soit jamais réécrite. Régénérer : node scripts/rew-index.mjs [--ia]",
      entrees: entrees.sort((a, b) => a.id - b.id),
    },
    null,
    1,
  ) + "\n",
);
console.log(`rew-index : ${entrees.length} entrées (${nouvelles} nouvelles), ${entrees.filter((e) => e._ia).length} enrichies par IA`);

/** Enrichissement par Claude Haiku 5.5, par lots de 20, seulement pour les entrées sans _ia ni _manuel */
async function enrichir(liste) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("--ia : ANTHROPIC_API_KEY absente de l'environnement, enrichissement ignoré.");
    return;
  }
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();
  const fiches = new Map([
    ...[...brands, ...films].map((b) => [b.id, `${b.name} (${b.type}, ${b.cat ?? ""}, ${b.origin ?? ""}, ${b.year ?? ""}) : ${b.description ?? ""}`]),
    ...artistes.map((a) => [a.id, `${a.nom} (artiste, ${a.genres.join(", ")}, ${a.ville ?? ""} ${a.pays}) : ${a.description}`]),
    ...sorties.map((s) => [s.id, `${s.titre} (${s.type}, ${s.annee ?? ""}) : ${s.description}`]),
  ]);
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["entrees"],
    properties: {
      entrees: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "esthetique", "culture", "ambiance", "positionnement", "motsCles"],
          properties: {
            id: { type: "integer" },
            esthetique: { type: "array", items: { type: "string" } },
            culture: { type: "array", items: { type: "string" } },
            ambiance: { type: "array", items: { type: "string" } },
            positionnement: { type: "string" },
            motsCles: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
  };
  const aFaire = liste.filter((e) => !e._ia && !e._manuel);
  for (let i = 0; i < aFaire.length; i += 20) {
    const lot = aFaire.slice(i, i + 20);
    const reponse = await client.messages.create({
      model: "claude-haiku-5-5",
      max_tokens: 8000,
      output_config: { effort: "low", format: { type: "json_schema", schema } },
      system:
        "Tu enrichis les fiches d'une archive culturelle (mode, design, tech, digital, cinéma, musique) pour un moteur de recommandation. Pour chaque entrée, en français, 2 à 5 termes courts par liste : esthetique (couleurs, époque, style visuel), culture (influences, mouvements, scènes), ambiance (énergie, tonalité), positionnement (un mot : accessible, pointu, luxe, culte, émergent…), motsCles (termes qu'un visiteur pourrait taper, y compris en anglais). N'invente rien d'incertain : en cas de doute, laisse la liste plus courte.",
      messages: [{ role: "user", content: lot.map((e) => `id ${e.id} : ${fiches.get(e.id)}`).join("\n") }],
    });
    const texte = reponse.content.find((b) => b.type === "text")?.text;
    try {
      for (const r of JSON.parse(texte).entrees) {
        const e = lot.find((x) => x.id === r.id);
        if (!e) continue;
        for (const k of ["esthetique", "culture", "ambiance", "motsCles"]) e[k] = uniq([...e[k], ...r[k].map((v) => v.toLowerCase())]).slice(0, 10);
        if (r.positionnement && !e.positionnement) e.positionnement = r.positionnement.toLowerCase();
        e._ia = true;
      }
      console.log(`  lot ${i / 20 + 1}/${Math.ceil(aFaire.length / 20)} enrichi`);
    } catch {
      console.error(`  lot ${i / 20 + 1} : réponse illisible, ignoré (relancer --ia pour réessayer)`);
    }
  }
}
