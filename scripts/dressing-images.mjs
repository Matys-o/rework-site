// Images du Dressing : télécharge l'image d'origine et la convertit en .webp (aucun remplaçant inventé).
// - tenues : outfits.json imageSourceImg → public/images/dressing/<slug>.webp (largeur d'origine, max 800 px)
// - pièces : products.json imgSource (sinon l'image de la page produit) → public/images/dressing/pieces/<id>.webp (max 800 px)
// Les échecs sont ajoutés à docs/images-a-trouver.md. node scripts/dressing-images.mjs [--force]
import fs from "node:fs";
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { UA, lireFiche, pause } from "./dressing-fiche.mjs";

const racine = new URL("../", import.meta.url);
const lire = (f) => JSON.parse(fs.readFileSync(new URL(f, racine), "utf8"));
const ecrire = (f, d) => fs.writeFileSync(new URL(f, racine), JSON.stringify(d, null, 1) + "\n");
const FORCE = process.argv.includes("--force");
const echecs = [];

async function convertir(src, dest) {
  const r = await fetch(src, {
    headers: { "user-agent": UA, referer: new URL(src).origin },
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  await sharp(buf)
    .flatten({ background: "#ffffff" })
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(fileURLToPath(new URL(dest, racine)));
}

const produits = lire("data/dressing/products.json");
for (const p of produits) {
  const dest = `public/images/dressing/pieces/${p.id}.webp`;
  if (!FORCE && p.img && fs.existsSync(new URL(dest, racine))) continue;
  try {
    let src = p.imgSource;
    if (!src) {
      src = (await lireFiche(p.url)).image;
      if (!src) throw new Error("aucune image sur la page produit");
      p.imgSource = src;
    }
    await convertir(src, dest);
    p.img = `/images/dressing/pieces/${p.id}.webp`;
    console.log(`✓ ${p.id}`);
  } catch (e) {
    delete p.img;
    echecs.push(`- pièce \`${p.id}\` (${p.brandName}, ${p.name}) — ${e.message} — source : ${p.imgSource ?? p.url}`);
    console.log(`✗ ${p.id} ${e.message}`);
  }
  await pause(1500);
}
ecrire("data/dressing/products.json", produits);

const tenues = lire("data/dressing/outfits.json");
for (const t of tenues) {
  const dest = `public/images/dressing/${t.slug}.webp`;
  if (!FORCE && t.image && fs.existsSync(new URL(dest, racine))) continue;
  if (!t.imageSourceImg) continue;
  try {
    await convertir(t.imageSourceImg, dest);
    t.image = `/images/dressing/${t.slug}.webp`;
    console.log(`✓ ${t.slug}`);
  } catch (e) {
    delete t.image;
    echecs.push(`- tenue \`${t.id}\` (${t.style}) — ${e.message} — source : ${t.imageSourceImg}`);
    console.log(`✗ ${t.slug} ${e.message}`);
  }
  await pause(1500);
}
ecrire("data/dressing/outfits.json", tenues);

if (echecs.length) {
  const f = new URL("docs/images-a-trouver.md", racine);
  const avant = fs.existsSync(f) ? fs.readFileSync(f, "utf8") : "# Images à trouver\n";
  fs.writeFileSync(f, `${avant.trimEnd()}\n\n## Dressing — ${new Date().toISOString().slice(0, 10)}\n${echecs.join("\n")}\n`);
}
