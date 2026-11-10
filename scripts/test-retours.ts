// Tests hors ligne des corrections du 2026-11-10 (retours utilisateur) : recherche globale, chiffres, proches,
// prix dans REW, délais et nouvelles tentatives (serveur et navigateur). Aucun appel réseau, aucune clé.
// npx esbuild scripts/test-retours.ts --bundle --platform=node --format=esm --outfile=<tmp>.mjs && node <tmp>.mjs
import Anthropic from "@anthropic-ai/sdk";

// Navigateur minimal pour le client REW (sessionStorage + window)
const stockage = new Map<string, string>();
Object.assign(globalThis, {
  window: Object.assign(globalThis, {
    location: { pathname: "/", search: "", hash: "" },
    history: { pushState() {}, replaceState() {}, back() {}, state: null },
    addEventListener() {},
  }),
  sessionStorage: {
    getItem: (k: string) => stockage.get(k) ?? null,
    setItem: (k: string, v: string) => void stockage.set(k, v),
  },
});

const {
  chercher,
  STATS,
  UNIVERS,
  NB_UNIVERS,
  prochesDe,
  nomDe,
  categorieDe,
  REFERENCES,
} = await import("../src/data/archive");
const { MARQUES } = await import("../src/data/brands");
const { ARTISTES, SORTIES } = await import("../src/data/musique");
const serveur = await import("../src/lib/rew/serveur");
const client = await import("../src/lib/rew/client");
const { PROFIL_VIDE } = await import("../src/lib/rew/types");

let echecs = 0;
const ok = (cond: boolean, nom: string, detail = "") => {
  console.log(`${cond ? "  ✓" : "  ✗"} ${nom}${detail ? ` — ${detail}` : ""}`);
  if (!cond) echecs++;
};
const premiers = (q: string, n = 3) =>
  chercher(q)
    .slice(0, n)
    .map((r) => `${nomDe(r)} [${categorieDe(r)}]`)
    .join(", ");

console.log("\n── Recherche globale");
ok(
  nomDe(chercher("Whiplash")[0]) === "Whiplash" &&
    categorieDe(chercher("Whiplash")[0]) === "Film",
  "« Whiplash » → le film en premier",
  premiers("Whiplash"),
);
for (const q of [
  "Tyler, The Creator",
  "tyler the creator",
  "TYLER",
  "  tyler   creator ",
])
  ok(
    nomDe(chercher(q)[0]) === "Tyler, The Creator",
    `« ${q} » → l'artiste`,
    premiers(q),
  );
ok(
  nomDe(chercher("stussy")[0]) === "Stüssy" &&
    nomDe(chercher("STÜSSY")[0]) === "Stüssy",
  "accents et casse : « stussy » = « STÜSSY » → Stüssy",
);
ok(
  nomDe(chercher("Rick Owens")[0]) === "Rick Owens",
  "une marque : « Rick Owens »",
  premiers("Rick Owens"),
);
ok(
  nomDe(chercher("whipl")[0]) === "Whiplash",
  "correspondance partielle : « whipl »",
);
ok(
  chercher("comme des garcons").some((r) => nomDe(r) === "Comme des Garçons"),
  "« comme des garcons » → Comme des Garçons",
);
ok(
  chercher("damien chazelle").some((r) => nomDe(r) === "Whiplash"),
  "description / réalisateur : « damien chazelle » → Whiplash",
);
ok(
  chercher("hard techno").some((r) => r.type !== "marque"),
  "genre musical : « hard techno » → musique",
  premiers("hard techno"),
);
ok(
  chercher("time & style").length > 0 &&
    nomDe(chercher("time & style")[0]) === "Time & Style",
  "« time & style » → Time & Style",
);
ok(chercher("zzzzqq").length === 0, "requête sans réponse → aucun résultat");
ok(
  chercher("").length === 0,
  "requête vide → rien (la page affiche alors la liste normale)",
);

console.log("\n── Chiffres (une seule source)");
const ids = REFERENCES.map((r) => r.id);
ok(
  new Set(ids).size === ids.length,
  "aucun numéro R° en double",
  `${ids.length} références`,
);
ok(
  STATS.total === MARQUES.length + ARTISTES.length + SORTIES.length,
  "total = marques + films + artistes + sorties",
  `${STATS.total}`,
);
ok(
  STATS.marques + STATS.films + STATS.musique === STATS.total,
  "marques + films + musique = total",
  `${STATS.marques} + ${STATS.films} + ${STATS.musique}`,
);
ok(
  Object.values(STATS.parUnivers).reduce((a, b) => a + b, 0) === STATS.total,
  "somme des 6 univers = total",
);
ok(
  NB_UNIVERS === 6 &&
    UNIVERS.map((u) => u.id).join() === "mode,design,tech,digital,film,musique",
  "6 univers dont Musique",
  UNIVERS.map((u) => `${u.nom} ${u.entrees}`).join(" · "),
);

console.log("\n── Dans le même univers");
const ts = MARQUES.find((m) => m.nom === "Time & Style")!;
const p = prochesDe(ts.id);
ok(
  p.length > 0 && p.every((r) => r.id !== ts.id),
  "Time & Style a des proches (sans elle-même)",
  p.map(nomDe).join(", "),
);
const categories = new Set(
  REFERENCES.filter((r) => prochesDe(r.id).length).map((r) =>
    r.type === "marque" ? r.marque.domaine : r.type,
  ),
);
ok(
  ["mode", "design", "tech", "digital", "film", "artiste", "sortie"].every(
    (c) => categories.has(c as never),
  ),
  "toutes les catégories ont des proches",
  [...categories].join(", "),
);
ok(
  prochesDe(ts.id, [p[0].id]).every((r) => r.id !== p[0].id),
  "exclusion (déjà affiché ailleurs sur la fiche)",
);

console.log("\n── REW : prix");
const rick = MARQUES.find((m) => m.nom === "Rick Owens")!;
const analyse = {
  profil: PROFIL_VIDE,
  univers: ["mode" as const],
  recherche: [
    "dark",
    "avant-garde",
    "gothique",
    "noir",
    "drapé",
    "dark fashion",
  ],
  references: ["Rick Owens"],
  question: "",
  prix: { sens: "moins-cher" as const, max: 0, min: 0 },
};
const c = serveur.contraintePrix(analyse)!;
ok(
  c.references[0]?.prix === 4 && c.max === 3,
  "Rick Owens = €€€€ → plafond €€€",
  JSON.stringify(c),
);
const cand = serveur.recuperer(analyse, () => 0);
ok(
  cand.length > 0 && cand.every((e) => e.prix && e.prix <= 3),
  "candidats tous ≤ €€€ et avec un niveau connu",
  cand
    .slice(0, 6)
    .map((e) => `${e.nom} ${"€".repeat(e.prix!)}`)
    .join(", "),
);
ok(!cand.some((e) => e.id === rick.id), "Rick Owens lui-même exclu");
ok(
  cand.every((e) => !!e.resumePrix?.includes("Prix : ") && !e.resume.includes("Prix")),
  "prix lu par le modèle seulement quand la demande en parle",
);
const sansPrix = serveur.recuperer(
  { ...analyse, prix: undefined, references: [] },
  () => 0,
);
ok(
  sansPrix.some((e) => e.prix === 4),
  "sans demande de prix : les marques de luxe restent possibles",
);
const uniqlo = MARQUES.find((m) => serveur.recuperer && m.nom === "Uniqlo");
if (uniqlo) {
  const c2 = serveur.contraintePrix({ ...analyse, references: ["Uniqlo"] });
  ok(
    !!c2?.impossible,
    "moins cher qu'une marque déjà € → signalé impossible (rien d'inventé)",
  );
}

console.log("\n── REW serveur : délais, erreurs, nouvelle tentative");
type Script = (Error | object)[];
function fauxClient(script: Script) {
  let n = 0;
  const appels: { timeout?: number; max_tokens: number }[] = [];
  return {
    appels,
    client: {
      messages: {
        create: async (
          params: { max_tokens: number },
          opts: { timeout?: number },
        ) => {
          appels.push({
            timeout: opts?.timeout,
            max_tokens: params.max_tokens,
          });
          const etape = script[n++] ?? new Error("script épuisé");
          if (etape instanceof Error) throw etape;
          return etape;
        },
      },
    } as unknown as Anthropic,
  };
}
const reponseJson = (o: unknown, stop = "end_turn") => ({
  stop_reason: stop,
  usage: { output_tokens: 10 },
  content: [{ type: "text", text: JSON.stringify(o) }],
});
const ANALYSE_OK = reponseJson({
  profil: PROFIL_VIDE,
  univers: ["mode"],
  recherche: ["dark", "noir", "avant-garde"],
  references: ["Rick Owens"],
  prix: { sens: "moins-cher", max: 0, min: 0 },
  question: "",
});
const SELECTION_OK = (id: number) =>
  reponseJson({
    message: "Voici.",
    sections: [
      {
        univers: "mode",
        items: [{ id, raison: "même noir, un cran en dessous." }],
      },
    ],
    conclusion: "",
    question: "",
  });
const msgs = [
  {
    role: "user" as const,
    content: "Des marques comme Rick Owens, moins chères",
  },
];
const timeout = () => new Anthropic.APIConnectionTimeoutError();

{
  const f = fauxClient([ANALYSE_OK, SELECTION_OK(cand[0].id)]);
  const r = await serveur.repondre(f.client, msgs);
  ok(
    r.sections[0]?.cartes[0]?.id === cand[0].id &&
      r.sections[0].cartes[0].info.includes("€"),
    "réponse normale, carte avec son niveau de prix",
    r.sections[0]?.cartes[0]?.info,
  );
  ok(
    f.appels.every((a) => (a.timeout ?? 0) <= 30_000) &&
      f.appels[1].max_tokens >= 8000,
    "délai ≤ 30 s par appel, sélection à 8000 tokens",
    JSON.stringify(f.appels),
  );
}
{
  const f = fauxClient([
    ANALYSE_OK,
    reponseJson({}, "max_tokens"),
    SELECTION_OK(cand[0].id),
  ]);
  const r = await serveur.repondre(f.client, msgs);
  ok(
    r.sections.length === 1 &&
      f.appels.length === 3 &&
      f.appels[2].max_tokens > f.appels[1].max_tokens,
    "réponse coupée (max_tokens) → 1 nouvelle tentative, plus de place",
    JSON.stringify(f.appels.map((a) => a.max_tokens)),
  );
}
{
  const f = fauxClient([timeout(), ANALYSE_OK, SELECTION_OK(cand[0].id)]);
  const r = await serveur.repondre(f.client, msgs);
  ok(
    r.sections.length === 1 && f.appels.length === 3,
    "délai dépassé → nouvelle tentative réussie",
  );
}
{
  const f = fauxClient([timeout(), timeout(), ANALYSE_OK]);
  let code = "";
  try {
    await serveur.repondre(f.client, msgs);
  } catch (e) {
    code = (e as InstanceType<typeof serveur.EchecRew>).code;
  }
  ok(
    code === "delai" && f.appels.length === 2,
    "deux délais → échec « delai », pas de 3e essai (coût borné)",
    `${code}, ${f.appels.length} appels`,
  );
}
{
  const err = new Anthropic.AuthenticationError(
    401,
    { type: "error" },
    "clé",
    new Headers(),
  );
  const f = fauxClient([err, ANALYSE_OK]);
  let code = "";
  try {
    await serveur.repondre(f.client, msgs);
  } catch (e) {
    code = (e as InstanceType<typeof serveur.EchecRew>).code;
  }
  ok(
    code === "config" && f.appels.length === 1,
    "erreur d'authentification → définitive, aucune nouvelle tentative",
  );
}
{
  const err = new Anthropic.InternalServerError(
    529,
    { type: "error" },
    "overloaded",
    new Headers(),
  );
  const f = fauxClient([err, ANALYSE_OK, SELECTION_OK(cand[0].id)]);
  const r = await serveur.repondre(f.client, msgs);
  ok(
    r.sections.length === 1 && f.appels.length === 3,
    "fournisseur saturé (529) → nouvelle tentative réussie",
  );
}
{
  const f = fauxClient([ANALYSE_OK, SELECTION_OK(cand[0].id)]);
  let code = "";
  try {
    await serveur.repondre(f.client, msgs, PROFIL_VIDE, Date.now() + 4_000);
  } catch (e) {
    code = (e as InstanceType<typeof serveur.EchecRew>).code;
  }
  ok(
    code === "delai" && f.appels.length === 0,
    "budget de temps épuisé → on n'appelle pas le modèle pour rien",
  );
}

console.log(
  "\n── REW navigateur : nouvelle tentative sans doublon, brief conservé",
);
const REPONSE = {
  message: "ok",
  sections: [],
  conclusion: "",
  question: "",
  profil: PROFIL_VIDE,
};
function fauxFetch(etapes: (() => Promise<Response>)[]) {
  let n = 0;
  (globalThis as { fetch: unknown }).fetch = async () =>
    (etapes[n++] ?? etapes[etapes.length - 1])();
  return () => n;
}
const json = (statut: number, corps: unknown) => async () =>
  new Response(JSON.stringify(corps), { status: statut });
const etat = () =>
  (client as unknown as { useRew: () => unknown }) &&
  JSON.parse(stockage.get("rew-session") ?? "{}");
{
  client.rew.nouvelle();
  const n = fauxFetch([json(504, { erreur: "delai" }), json(200, REPONSE)]);
  await client.rew.envoyer("Un brief de test");
  const t = etat().tours;
  ok(
    n() === 2 && t.length === 2 && t[1].role === "rew",
    "1er essai en délai → 2e essai auto → UNE seule réponse",
    `${n()} requêtes, tours : ${t.map((x: { role: string }) => x.role).join(",")}`,
  );
}
{
  client.rew.nouvelle();
  const n = fauxFetch([
    json(502, { erreur: "generation" }),
    json(502, { erreur: "generation" }),
    json(200, REPONSE),
  ]);
  const brief = "Brief de moodboard très détaillé ".repeat(18).trim();
  await client.rew.envoyer(brief);
  const t = etat().tours;
  ok(n() === 2, "au plus 2 essais par demande", `${n()} requêtes`);
  ok(
    t[t.length - 1].role === "erreur" && t[t.length - 1].texte === brief,
    "échec définitif → message d'erreur, brief conservé dans le fil",
  );
  ok(
    client.MESSAGES_ERREUR[t[t.length - 1].code as "generation"].includes(
      "conservé",
    ),
    "message compréhensible",
    client.MESSAGES_ERREUR.generation,
  );
}
{
  client.rew.nouvelle();
  const n = fauxFetch([json(429, { erreur: "limite" }), json(200, REPONSE)]);
  await client.rew.envoyer("test");
  ok(n() === 1, "limite atteinte (429 REW) → pas de nouvelle tentative");
}
{
  client.rew.nouvelle();
  const n = fauxFetch([
    async () => {
      throw new TypeError("Failed to fetch");
    },
    json(200, REPONSE),
  ]);
  await client.rew.envoyer("test réseau");
  ok(
    n() === 2 && etat().tours.at(-1).role === "rew",
    "coupure réseau → nouvelle tentative réussie",
  );
}
{
  client.rew.nouvelle();
  const n = fauxFetch([
    async () => new Response("<html>Error 1102</html>", { status: 503 }),
    json(200, REPONSE),
  ]);
  await client.rew.envoyer("page d'erreur plateforme");
  ok(
    n() === 2 && etat().tours.at(-1).role === "rew",
    "page d'erreur non JSON (5xx) → nouvelle tentative",
  );
}
{
  // Deux envois rapprochés : le second est ignoré tant que le premier est en cours (jamais deux réponses)
  client.rew.nouvelle();
  let liberer!: () => void;
  const attente = new Promise<void>((r) => (liberer = r));
  const n = fauxFetch([
    async () => {
      await attente;
      return new Response(JSON.stringify(REPONSE));
    },
  ]);
  const a = client.rew.envoyer("premier");
  const b = client.rew.envoyer("second");
  liberer();
  await Promise.all([a, b]);
  const t = etat().tours;
  ok(
    n() === 1 &&
      t.filter((x: { role: string }) => x.role === "rew").length === 1,
    "double clic → une requête, une réponse",
  );
}
{
  // Le « Pourquoi » d'une carte cliquée suit vers la fiche
  const carte = {
    id: 167,
    nom: "Time & Style",
    univers: "design" as const,
    info: "",
    description: "",
    fiche: "/marque/time-style",
    raison: "le bois japonais travaillé avec précision.",
  };
  client.memoriserRaison(carte);
  ok(
    client.raisonPour("/marque/time-style")?.raison === carte.raison,
    "« Pourquoi » transmis à la fiche via la session",
  );
}

console.log(
  echecs ? `\n${echecs} test(s) en échec` : "\nTous les tests passent.",
);
process.exit(echecs ? 1 : 0);
