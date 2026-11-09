// Test hors ligne de la récupération REW (sans IA) : analyses écrites à la main pour les 8 cas du brief.
// npx esbuild scripts/rew-test-recuperation.ts --bundle --platform=node --format=esm --outfile=<tmp>.mjs && node <tmp>.mjs
import { recuperer, type Analyse } from "../src/lib/rew/serveur";
import { PROFIL_VIDE, type UniversRew } from "../src/lib/rew/types";

const cas: [string, UniversRew[], string[], string[]][] = [
  [
    "1 cadeau rose Y2K rock",
    ["mode", "musique", "design"],
    [
      "rose",
      "pink",
      "y2k",
      "années 2000",
      "rock",
      "guitare",
      "vintage",
      "streetwear",
      "féminin",
    ],
    [],
  ],
  [
    "2 style Tyler",
    ["musique"],
    [
      "hip-hop alternatif",
      "neo soul",
      "alternative hip hop",
      "jazz rap",
      "soul",
      "excentrique",
    ],
    ["Tyler, The Creator"],
  ],
  [
    "3 minimal japonais",
    ["design", "mode"],
    [
      "minimalisme",
      "minimal",
      "japon",
      "japanese",
      "wabi sabi",
      "bois",
      "épuré",
      "muji",
    ],
    [],
  ],
  [
    "4 techno indus",
    ["musique"],
    [
      "techno industrielle",
      "industrial techno",
      "hard techno",
      "sombre",
      "dark",
      "berlin",
      "warehouse",
    ],
    [],
  ],
  [
    "5 ciné 90s",
    ["cinema"],
    ["années 90", "1990s", "culte", "1994", "1995", "1999", "cadeau"],
    [],
  ],
  [
    "7 mode musique ciné",
    ["mode", "musique", "cinema"],
    ["paris", "nuit", "noir", "élégant", "électronique", "french touch"],
    [],
  ],
  ["8 hors archive", [], ["équitation", "selle", "cheval", "horse riding"], []],
];
for (const [nom, univers, recherche, references] of cas) {
  const analyse: Analyse = {
    profil: PROFIL_VIDE,
    univers,
    recherche,
    references,
    question: "",
  };
  const c = recuperer(analyse, () => 0);
  const parU = new Map<string, string[]>();
  for (const e of c)
    parU.set(e.univers, [...(parU.get(e.univers) ?? []), e.nom]);
  console.log(`\n## ${nom} (${c.length} candidats)`);
  for (const [u, n] of parU)
    console.log(`  ${u}: ${n.slice(0, 10).join(" · ")}`);
}
