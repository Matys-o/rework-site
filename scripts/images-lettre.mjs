// Images des entrées du trio dans la lettre : JPEG 1120 × 600 (2× la case 560 × 300 de la maquette).
// JPEG plutôt que WebP : Outlook pour Windows n'affiche pas le WebP.
// Photo locale ou distante recadrée ; vidéo ou photo introuvable → dégradé de l'aura du domaine vers la brume,
// comme le gabarit de la maquette.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const AURAS = { mode: "#ff8fc7", design: "#d2f34c", tech: "#ff7a1a", digital: "#8cc8ff", film: "#b49bff" };
const L = 1120;
const H = 600;

const degrade = (domaine) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${H}"><defs><linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${AURAS[domaine]}"/><stop offset="1" stop-color="#e2e0d9"/></linearGradient></defs><rect width="${L}" height="${H}" fill="url(#a)"/></svg>`,
  );

async function source(m, racine) {
  if (!m.image || m.video) return null;
  if (m.image.startsWith("/")) return path.join(racine, "public", m.image);
  try {
    const reponse = await fetch(m.image, { signal: AbortSignal.timeout(15000) });
    if (!reponse.ok) return null;
    return Buffer.from(await reponse.arrayBuffer());
  } catch {
    return null;
  }
}

/** Écrit <dossier>/<slug>.jpg pour chaque entrée ; renvoie les entrées tombées sur le dégradé */
export async function genererImagesLettre(marques, dossier, racine) {
  await mkdir(dossier, { recursive: true });
  const degradees = [];
  for (const m of marques) {
    const fichier = path.join(dossier, `${m.slug}.jpg`);
    const entree = await source(m, racine);
    try {
      if (!entree) throw new Error("pas de photo");
      await sharp(entree).resize(L, H, { fit: "cover", position: sharp.strategy.attention }).jpeg({ quality: 78, mozjpeg: true }).toFile(fichier);
    } catch {
      degradees.push(m.nom);
      await sharp(degrade(m.domaine)).jpeg({ quality: 85, mozjpeg: true }).toFile(fichier);
    }
  }
  return degradees;
}
