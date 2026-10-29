// Prérendu statique, lancé après `vite build` (npm run build).
// Pour chaque route, écrit un fichier HTML dont le <head> contient déjà titre, description, Open Graph, Twitter et JSON-LD :
// les aperçus de partage (LinkedIn, X, Facebook, WhatsApp, iMessage, Discord) fonctionnent sans JavaScript.
// L'app React se monte ensuite normalement par-dessus (rendu client).
// Génère aussi les images de partage des fiches (JPEG 1200 × 630) et sitemap.xml.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { createServer } from "vite";

const racine = path.resolve(import.meta.dirname, "..");
const dist = path.join(racine, "dist");

// Vite charge les modules TypeScript du site (et leurs imports JSON) tels quels : une seule source pour les métadonnées
const vite = await createServer({ root: racine, logLevel: "error", server: { middlewareMode: true }, appType: "custom" });
try {
  const meta = await vite.ssrLoadModule("/src/lib/meta.ts");
  const { SITE_URL } = await vite.ssrLoadModule("/src/lib/site.ts");
  const { MARQUES, DOMAINES } = await vite.ssrLoadModule("/src/data/brands.ts");

  // ── Pages HTML ──
  const modele = await readFile(path.join(dist, "index.html"), "utf8");
  if (!modele.includes("<!--meta:debut-->")) throw new Error("Marqueurs <!--meta:debut--> absents de dist/index.html");

  // Fichier servi pour chaque route par Cloudflare Pages (/manifeste → manifeste.html, /marque/x → marque/x.html).
  // /index : Pages réserve ce chemin à la racine, la page est servie par la Function functions/index.ts depuis index-rendu.html.
  const fichierDe = (chemin) => (chemin === "/" ? "index.html" : chemin === "/index" ? "index-rendu.html" : `${chemin.slice(1)}.html`);

  const routes = meta.routesPrerendues();
  const horsLongueur = [];
  for (const { chemin, meta: m } of routes) {
    const html = modele
      .replace(/<!--meta:debut-->[\s\S]*?<!--meta:fin-->/, `<!--meta:debut-->\n    ${meta.balisesHtml(m)}\n    <!--meta:fin-->`)
      .replace("<!--noscript-->", meta.noscriptHtml(m));
    const fichier = path.join(dist, fichierDe(chemin));
    await mkdir(path.dirname(fichier), { recursive: true });
    await writeFile(fichier, html);
    if (m.description.length < 140 || m.description.length > 160) horsLongueur.push(`${chemin} (${m.description.length})`);
  }
  console.log(`prérendu : ${routes.length} pages`);
  if (horsLongueur.length) console.log(`  descriptions hors 140-160 caractères : ${horsLongueur.join(", ")}`);

  // ── Images de partage des fiches : photo locale recadrée en 1200 × 630 (JPEG, lu partout, contrairement au WebP) ──
  await mkdir(path.join(dist, "og/fiches"), { recursive: true });
  const avecImage = MARQUES.filter(meta.aImagePartage);
  for (let i = 0; i < avecImage.length; i += 8) {
    await Promise.all(
      avecImage.slice(i, i + 8).map((m) =>
        sharp(path.join(racine, "public", m.image))
          .resize(1200, 630, { fit: "cover", position: sharp.strategy.attention })
          .jpeg({ quality: 80, mozjpeg: true })
          .toFile(path.join(dist, meta.imagePartageFiche(m).slice(1))),
      ),
    );
  }
  console.log(`images de partage : ${avecImage.length} fiches (les autres utilisent /og/rework-og.png)`);

  // ── sitemap.xml : toutes les pages prérendues + les filtres de domaine de l'index ──
  const aujourdHui = new Date().toISOString().slice(0, 10);
  const entrees = [
    ...routes.map((r) => ({ loc: r.chemin, frequent: !r.chemin.startsWith("/marque/") })),
    ...Object.keys(DOMAINES).map((d) => ({ loc: `/index?domaine=${d}`, frequent: true })),
  ];
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entrees.map(
      (e) =>
        `  <url><loc>${SITE_URL}${e.loc.replace(/&/g, "&amp;")}</loc>${e.frequent ? `<lastmod>${aujourdHui}</lastmod><changefreq>weekly</changefreq>` : ""}</url>`,
    ),
    "</urlset>",
    "",
  ].join("\n");
  await writeFile(path.join(dist, "sitemap.xml"), xml);
  console.log(`sitemap.xml : ${entrees.length} URL`);

  await writeFile(
    path.join(dist, "robots.txt"),
    ["User-agent: *", "Allow: /", "Disallow: /composants", "Disallow: /index-rendu", "", `Sitemap: ${SITE_URL}/sitemap.xml`, ""].join("\n"),
  );
} finally {
  await vite.close();
}
