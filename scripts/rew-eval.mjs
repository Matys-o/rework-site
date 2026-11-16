// Éval REW : envoie les 40 demandes de tests/rew-eval.json à /api/rew (local : npx wrangler pages dev dist --port 8788)
// et vérifie les règles automatiquement. node scripts/rew-eval.mjs [url] [--seul=3,7]  → score + échecs, détail dans tests/rew-eval-resultats.json
import fs from "node:fs";
const args = process.argv.slice(2);
const URL_API = args.find((a) => a.startsWith("http")) ?? "http://localhost:8788/api/rew";
const SEUL = args.find((a) => a.startsWith("--seul="))?.slice(7).split(",").map(Number);
const lire = (f) => JSON.parse(fs.readFileSync(new URL(`../${f}`, import.meta.url), "utf8"));
const EVAL = lire("tests/rew-eval.json");
const ARCHIVE = new Map(
  [...lire("src/data/brands.json"), ...lire("src/data/films.json"), ...lire("src/data/musique/artistes.json"), ...lire("src/data/musique/sorties.json")].map((e) => [e.id, e]),
);
const ATTRIBUTS = lire("src/data/attributs.json");
const INDEX = new Map(lire("data/rew-index.json").entrees.map((e) => [e.id, e]));
const lireSiExiste = (f, d) => (fs.existsSync(new URL(`../${f}`, import.meta.url)) ? lire(f) : d);
const TENUES = new Set(lireSiExiste("data/dressing/outfits.json", []).map((t) => t.slug));
const PRODUITS = new Map(lireSiExiste("data/dressing/products.json", []).map((p) => [p.id, p]));
const liensArchive = (e) => [e.url, ...Object.values(e.liens ?? {})].filter(Boolean);
const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const FUITES = ["tu es le module", "module d analyse", "schema", "systeme analyse", "systeme selection", "candidats", "n invente jamais"];

const total = { ok: 0, n: 0 };
const echecs = [];
const resultats = [];
for (const cas of EVAL.cas) {
  if (SEUL && !SEUL.includes(cas.id)) continue;
  const debut = Date.now();
  let c, statut;
  try {
    const r = await fetch(URL_API, {
      method: "POST",
      headers: { "content-type": "application/json", origin: new URL(URL_API).origin, "cf-connecting-ip": `eval-${cas.id}-${Date.now()}` },
      body: JSON.stringify({ messages: [{ role: "user", content: cas.demande }] }),
    });
    statut = r.status;
    c = await r.json();
  } catch (e) {
    c = { erreur: `réseau : ${e.message}` };
  }
  const cartes = (c.sections ?? []).flatMap((s) => s.cartes.map((k) => ({ ...k, univers: s.univers })));
  const ids = cartes.map((k) => k.id);
  const tenues = (c.tenues ?? []).map((t) => t.slug);
  const produits = c.produits ?? [];
  const R = cas.regles;
  const verif = [];
  const regle = (nom, ok, detail = "") => verif.push({ nom, ok: !!ok, detail });
  const refuse = c.erreur === "refus" || (!c.erreur && cartes.length === 0 && tenues.length === 0 && produits.length === 0);
  const texte = norm([c.message, c.conclusion, c.question, ...cartes.map((k) => k.raison)].filter(Boolean).join(" "));

  // Règles globales
  regle("pas d'erreur technique", !c.erreur || c.erreur === "refus", c.erreur ? `${statut} ${c.erreur}` : "");
  regle("ids existants", ids.every((id) => ARCHIVE.has(id)) && produits.every((p) => PRODUITS.has(p.id)) && tenues.every((s) => TENUES.has(s)), [...ids.filter((id) => !ARCHIVE.has(id)), ...produits.filter((p) => !PRODUITS.has(p.id)).map((p) => p.id), ...tenues.filter((s) => !TENUES.has(s))].join(","));
  regle("liens issus des données", cartes.every((k) => !k.action || liensArchive(ARCHIVE.get(k.id) ?? {}).includes(k.action.url)) && produits.every((p) => !PRODUITS.has(p.id) || p.url === PRODUITS.get(p.id).url));
  regle("pas de fuite des instructions", !FUITES.some((f) => texte.includes(f)));

  if (R.refus) regle("refus / recentrage", refuse, `${cartes.length} cartes`);
  else if (!R.question) regle("répond avec des cartes", !c.erreur && (cartes.length + tenues.length + produits.length) > 0);
  if (R.univers && cartes.length) regle(`univers ⊂ ${R.univers}`, cartes.every((k) => R.univers.includes(k.univers)), [...new Set(cartes.map((k) => k.univers))].join(","));
  if (R.universRequis) regle(`univers parmi ${R.universRequis}`, cartes.some((k) => R.universRequis.includes(k.univers)));
  if (R.ids) regle("au moins un id attendu", ids.some((id) => R.ids.includes(id)), ids.join(","));
  if (R.interdits) regle("aucun id interdit", !ids.some((id) => R.interdits.includes(id)), ids.filter((id) => R.interdits.includes(id)).join(","));
  const niveaux = cartes.filter((k) => ["mode", "design", "tech", "digital"].includes(k.univers)).map((k) => ({ id: k.id, n: ATTRIBUTS[k.id]?.[1] }));
  if (R.prixMax) regle(`prix ≤ ${R.prixMax}`, niveaux.every((x) => x.n && x.n <= R.prixMax), niveaux.filter((x) => !x.n || x.n > R.prixMax).map((x) => `${x.id}:${x.n}`).join(","));
  if (R.prixMin) regle(`prix ≥ ${R.prixMin}`, niveaux.every((x) => x.n && x.n >= R.prixMin));
  if (R.famillesInterdites) regle(`familles ≠ ${R.famillesInterdites}`, !cartes.some((k) => R.famillesInterdites.includes(ATTRIBUTS[k.id]?.[0])), cartes.filter((k) => R.famillesInterdites.includes(ATTRIBUTS[k.id]?.[0])).map((k) => k.id).join(","));
  if (R.tagsInterdits) {
    const fautifs = cartes.filter((k) => (INDEX.get(k.id)?.esthetique ?? []).some((t) => R.tagsInterdits.includes(norm(t))));
    regle(`esthétique sans ${R.tagsInterdits}`, !fautifs.length, fautifs.map((k) => k.id).join(","));
  }
  if (R.references) {
    const refs = norm((c.profil?.references ?? []).join(" | ") + " | " + (c.contraintes?.references ?? []).join(" | "));
    regle(`références reconnues ${R.references}`, R.references.every((r) => refs.includes(norm(r))), refs);
  }
  if (R.question === true) regle("pose une question", !!c.question?.trim());
  if (R.question === false) regle("ne pose pas de question", !c.question?.trim());
  if (R.cartesMin) regle(`≥ ${R.cartesMin} cartes`, cartes.length >= R.cartesMin, String(cartes.length));
  if (R.tenue) regle("propose une tenue du Dressing", tenues.length > 0);
  if (R.produits) regle(`pièces ≤ ${R.produits.max} €`, produits.length > 0 && produits.every((p) => PRODUITS.get(p.id)?.price <= R.produits.max), produits.map((p) => `${p.id}:${PRODUITS.get(p.id)?.price}`).join(","));

  if (R.contraintes) {
    const k = c.contraintes ?? {};
    for (const [cle, attendu] of Object.entries(R.contraintes)) {
      let ok;
      if (cle === "budgetMax") ok = attendu === true ? Number(k.budget?.max) > 0 : Math.abs(Number(k.budget?.max) - attendu) < 1;
      else if (Array.isArray(attendu)) ok = attendu.every((a) => (k[cle] ?? []).some((v) => norm(v).includes(norm(a))));
      else ok = norm(k[cle] ?? "").includes(norm(attendu));
      regle(`contrainte ${cle}`, ok, JSON.stringify(cle === "budgetMax" ? k.budget : k[cle]));
    }
  }
  if (R.raisonCite) {
    const raisons = cartes.map((k) => norm(k.raison ?? "") + " " + (k.raison ?? ""));
    regle("une raison cite la contrainte", raisons.some((r) => R.raisonCite.some((m) => r.includes(m === "€" ? "€" : norm(m)))));
  }
  const ok = verif.filter((v) => v.ok).length;
  total.ok += ok;
  total.n += verif.length;
  for (const v of verif) if (!v.ok) echecs.push(`#${cas.id} « ${cas.demande.slice(0, 50)} » — ${v.nom}${v.detail ? ` (${v.detail})` : ""}`);
  resultats.push({ id: cas.id, demande: cas.demande, ok, n: verif.length, ids, tenues, produits: produits.map((p) => p.id), question: c.question, message: c.message, erreur: c.erreur, echecs: verif.filter((v) => !v.ok) });
  console.log(`#${String(cas.id).padStart(2)} ${ok}/${verif.length} (${((Date.now() - debut) / 1000).toFixed(1)} s) ${cas.demande.slice(0, 60)}`);
}
const metier = resultats.flatMap((r) => r.echecs).length;
const nMetier = total.n - 4 * resultats.length;
console.log(`Règles métier seules (sans les 4 règles globales par demande) : ${nMetier - metier}/${nMetier} = ${((100 * (nMetier - metier)) / nMetier).toFixed(1)} %`);
fs.writeFileSync(new URL("../tests/rew-eval-resultats.json", import.meta.url), JSON.stringify({ date: new Date().toISOString(), score: total, resultats }, null, 1));
console.log(`\nScore : ${total.ok}/${total.n} règles = ${((100 * total.ok) / total.n).toFixed(1)} %`);
console.log(echecs.length ? `\nÉchecs (${echecs.length}) :\n${echecs.join("\n")}` : "\nAucun échec.");
