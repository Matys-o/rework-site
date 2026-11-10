// « Dans le même univers » : pour chaque entrée de l'archive (marque, film, artiste, sortie), les entrées les plus proches.
// Sortie : src/data/proches.json  { "<id>": [id, id, …] }  (6 au plus, triées par proximité). Lancé par `npm run build`.
//
// Proximité, uniquement à partir de données déjà présentes dans l'archive (rien d'inventé) :
//   - relation déclarée : affinités de l'index REW, « proches » de la musique             +10
//   - relation éditoriale : deux entrées voisines dans un trio (film → marque → marque)    +6
//   - tags communs de l'index REW (esthétique, culture, ambiance, mots-clés), pondérés par leur rareté (un tag
//     porté par la moitié de l'archive ne rapproche presque rien, un tag rare rapproche beaucoup)
//   - même famille (attributs.json, ex. « Avant-garde & créateurs »)                       +1,5
// Seuil minimal : sans vraie proximité, une entrée n'a pas de section (pas de remplissage artificiel).
// Diversité : au plus 4 entrées du même univers ; une sortie n'est jamais proposée sur la fiche de son artiste (et inversement),
// le lien y est déjà.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lire = (f) => JSON.parse(fs.readFileSync(path.join(R, f), "utf8"));
const SORTIE = path.join(R, "src/data/proches.json");

const index = lire("data/rew-index.json").entrees;
const attributs = lire("src/data/attributs.json");
const trios = lire("src/data/trios.json");
const artistes = lire("src/data/musique/artistes.json");
const sorties = lire("src/data/musique/sorties.json");
const brands = lire("src/data/brands.json");
const films = lire("src/data/films.json");

const MAX = 6;
const MAX_PAR_UNIVERS = 4;
const SEUIL = 5;

// Entrées réellement publiées (l'index peut garder la trace d'une entrée retirée) + univers de chacune
const univers = new Map();
for (const b of brands) univers.set(b.id, { fashion: "mode", film: "cinema" }[b.type] ?? b.type);
for (const f of films) univers.set(f.id, "cinema");
for (const a of artistes) univers.set(a.id, "musique");
for (const s of sorties) univers.set(s.id, "musique");

const normaliser = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
// Mots qui ne rapprochent pas deux entrées : prix, types, et couleurs dominantes des photos (couleurs.json : la couleur
// d'une image de couverture n'est pas une esthétique)
const VIDES = new Set([
  "", "luxe", "premium", "accessible", "intermediaire", "artiste", "album", "ep", "single", "mixtape", "classique",
  "noir", "gris", "blanc", "beige", "rouge", "rose", "orange", "jaune", "vert", "bleu", "violet",
]);
// Un pays ou une ville rapproche peu à lui seul : poids divisé par deux
const LIEUX = new Set(
  [...brands.map((b) => b.origin), ...films.map((f) => f.origin), ...artistes.flatMap((a) => [a.pays, a.ville])]
    .filter(Boolean)
    .flatMap((o) => String(o).split(/[/,]/))
    .map(normaliser),
);

const entrees = index.filter((e) => univers.has(e.id));
const nomDe = new Map([
  ...[...brands, ...films].map((b) => [b.id, normaliser(b.name)]),
  ...artistes.map((a) => [a.id, normaliser(a.nom)]),
  ...sorties.map((s) => [s.id, normaliser(s.titre)]),
]);
const tags = new Map(
  entrees.map((e) => [
    e.id,
    new Set(
      [...e.esthetique, ...e.culture, ...e.ambiance, ...e.motsCles]
        .map(normaliser)
        .filter((t) => t.length > 2 && !VIDES.has(t) && t !== nomDe.get(e.id)),
    ),
  ]),
);
// Rareté : idf = log(N / nb d'entrées qui portent le tag) ; un tag unique ne rapproche personne
const df = new Map();
for (const t of tags.values()) for (const x of t) df.set(x, (df.get(x) ?? 0) + 1);
const N = entrees.length;
const poids = (t) => {
  const n = df.get(t) ?? 0;
  return n < 2 ? 0 : Math.log(N / n) * (LIEUX.has(t) ? 0.5 : 1);
};

// Relations déclarées (symétriques)
const relations = new Map();
const relier = (a, b, p) => {
  if (a === b || !univers.has(a) || !univers.has(b)) return;
  for (const [x, y] of [[a, b], [b, a]]) {
    const m = relations.get(x) ?? new Map();
    m.set(y, Math.max(m.get(y) ?? 0, p));
    relations.set(x, m);
  }
};
for (const e of entrees) for (const a of e.affinites ?? []) relier(e.id, a, 10);
for (const a of artistes) for (const p of a.proches ?? []) relier(a.id, p.id, 10);
for (const s of sorties) for (const p of s.proches ?? []) relier(s.id, p.id, 10);
for (const t of trios) {
  relier(t.items[0], t.items[1], 6);
  relier(t.items[1], t.items[2], 6);
}
// Artiste ↔ ses sorties : lien déjà présent sur les fiches, exclu ici
const exclus = new Map();
for (const s of sorties)
  for (const a of s.artistes) {
    exclus.set(s.id, new Set([...(exclus.get(s.id) ?? []), a]));
    exclus.set(a, new Set([...(exclus.get(a) ?? []), s.id]));
  }

const famille = (id) => attributs[id]?.[0];
const resultat = {};
let avec = 0;
for (const e of entrees) {
  const mesTags = tags.get(e.id);
  const scores = [];
  for (const o of entrees) {
    if (o.id === e.id || exclus.get(e.id)?.has(o.id)) continue;
    const relation = relations.get(e.id)?.get(o.id) ?? 0;
    let s = relation;
    let communs = 0;
    for (const t of tags.get(o.id))
      if (mesTags.has(t) && poids(t) > 0) {
        s += poids(t);
        communs++;
      }
    if (famille(e.id) && famille(e.id) === famille(o.id)) {
      s += 1.5;
      communs++;
    }
    // Sans relation déclarée, il faut au moins deux points communs
    if (s >= SEUIL && (relation || communs >= 2)) scores.push([o.id, s]);
  }
  scores.sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  const choix = [];
  const parUnivers = {};
  for (const [id] of scores) {
    const u = univers.get(id);
    if ((parUnivers[u] ?? 0) >= MAX_PAR_UNIVERS) continue;
    parUnivers[u] = (parUnivers[u] ?? 0) + 1;
    choix.push(id);
    if (choix.length === MAX) break;
  }
  if (choix.length) {
    resultat[e.id] = choix;
    avec++;
  }
}

fs.writeFileSync(
  SORTIE,
  JSON.stringify({ _note: "Généré par scripts/proches.mjs (npm run build) — ne pas éditer à la main.", ...resultat }) + "\n",
);
const croises = Object.entries(resultat).filter(([id, l]) => l.some((x) => univers.get(x) !== univers.get(Number(id)))).length;
console.log(`proches : ${avec}/${entrees.length} entrées ont des voisins (${croises} avec au moins un autre univers)`);
