// Calcule la teinte dominante de l'image de couverture de chaque marque → src/data/couleurs.json ({ id: teinte })
// Usage : node scripts/couleurs.mjs   (à relancer après l'ajout d'une marque ou d'une image)
// Images locales (public/…) lues directement ; images distantes téléchargées (échec → pas de teinte, marque absente du filtre).
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const RACINE = path.resolve(import.meta.dirname, "..");
const MARQUES = JSON.parse(await fs.readFile(path.join(RACINE, "src/data/brands.json"), "utf8"));
const SORTIE = path.join(RACINE, "src/data/couleurs.json");

function hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

/** Pixel → teinte chromatique, ou null s'il est neutre (trop gris, trop sombre, trop clair) */
function teinteChromatique(h, s, l) {
  if (l < 0.12 || l > 0.9 || s < 0.22) return null;
  // Bruns / beiges : orangés peu saturés ou sombres
  if (h >= 15 && h < 50 && (s < 0.45 || l < 0.35)) return "beige";
  if (h < 12 || h >= 340) return l > 0.7 ? "rose" : "rouge";
  if (h < 40) return "orange";
  if (h < 68) return "jaune";
  if (h < 165) return "vert";
  if (h < 255) return "bleu";
  if (h < 295) return "violet";
  return "rose";
}

async function lireImage(src) {
  if (src.startsWith("/")) return fs.readFile(path.join(RACINE, "public", decodeURIComponent(src)));
  const r = await fetch(src, { headers: { "User-Agent": "rework-couleurs/1.0" }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

async function teinte(src) {
  const { data, info } = await sharp(await lireImage(src), { animated: false })
    .resize(64, 64, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const poids = {};
  let chroma = 0, lum = 0;
  const n = info.width * info.height;
  for (let i = 0; i < data.length; i += 3) {
    const [h, s, l] = hsl(data[i], data[i + 1], data[i + 2]);
    lum += l;
    const t = teinteChromatique(h, s, l);
    if (t) {
      // Les pixels saturés comptent davantage : ce sont eux que l'œil retient
      poids[t] = (poids[t] ?? 0) + s;
      chroma++;
    }
  }
  // Image surtout neutre → noir / gris / blanc selon la luminosité moyenne
  if (chroma / n < 0.25) {
    const m = lum / n;
    return m < 0.3 ? "noir" : m > 0.72 ? "blanc" : "gris";
  }
  return Object.entries(poids).sort((a, b) => b[1] - a[1])[0][0];
}

const resultat = {};
const echecs = [];
let i = 0;
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (i < MARQUES.length) {
      const m = MARQUES[i++];
      const src = m.img?.trim();
      if (!src || src === "#" || /\.(mp4|webm)(\?|$)/i.test(src)) { echecs.push(`${m.id} ${m.name} (pas d'image)`); continue; }
      try {
        resultat[m.id] = await teinte(src);
      } catch (e) {
        echecs.push(`${m.id} ${m.name} (${e.message})`);
      }
    }
  }),
);

const trie = Object.fromEntries(Object.entries(resultat).sort((a, b) => a[0] - b[0]));
await fs.writeFile(SORTIE, JSON.stringify(trie, null, 2) + "\n");
const comptes = {};
Object.values(trie).forEach((t) => (comptes[t] = (comptes[t] ?? 0) + 1));
console.log(`${Object.keys(trie).length}/${MARQUES.length} teintes →`, comptes);
if (echecs.length) console.log(`Sans teinte (${echecs.length}) :\n  ` + echecs.join("\n  "));
