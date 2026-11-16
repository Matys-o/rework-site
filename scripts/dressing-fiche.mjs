// Lit une page produit officielle et en extrait les données vérifiables : nom, prix, devise, disponibilité, image.
// Sources dans la page : JSON-LD schema.org Product, balises og:/product:, sinon données Shopify (/products/<handle>.js).
// node scripts/dressing-fiche.mjs <url> [url…]   → une ligne JSON par page (une requête toutes les 3 s)
// Aussi importé par scripts/dressing-check.mjs.
import fs from "node:fs";

export const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";
export const pause = (ms) => new Promise((r) => setTimeout(r, ms));

const robotsCache = new Map();
/** Respect de robots.txt (règles User-agent: * seulement, Disallow par préfixe) */
export async function autorise(url) {
  const u = new URL(url);
  if (!robotsCache.has(u.origin)) {
    let regles = [];
    try {
      const r = await fetch(`${u.origin}/robots.txt`, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(10000) });
      if (r.ok) {
        let actif = false;
        for (const ligne of (await r.text()).split(/\r?\n/)) {
          const [cle, ...reste] = ligne.split(":");
          const v = reste.join(":").trim();
          if (/^user-agent$/i.test(cle.trim())) actif = v === "*";
          else if (actif && /^disallow$/i.test(cle.trim()) && v) regles.push(v);
        }
      }
    } catch {}
    robotsCache.set(u.origin, regles);
  }
  const chemin = u.pathname + u.search;
  return !robotsCache.get(u.origin).some((r) => !r.includes("*") && chemin.startsWith(r));
}

const decoder = (s) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const meta = (html, prop) =>
  decoder(
    html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)`, "i"))?.[1] ??
      html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`, "i"))?.[1] ??
      "",
  );

function produitsJsonLd(html) {
  const sortie = [];
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    let d;
    try {
      d = JSON.parse(m[1].trim());
    } catch {
      continue;
    }
    const pile = [d];
    while (pile.length) {
      const x = pile.pop();
      if (!x || typeof x !== "object") continue;
      if (Array.isArray(x)) pile.push(...x);
      else {
        const t = [].concat(x["@type"] ?? []);
        if (t.includes("Product") || t.includes("ProductGroup")) sortie.push(x);
        if (x["@graph"]) pile.push(x["@graph"]);
        if (x.hasVariant) pile.push(x.hasVariant);
      }
    }
  }
  return sortie;
}

/** Fiche d'une page produit : { url, statut, nom, prix, devise, dispo, image, indices } */
export async function lireFiche(url) {
  const fiche = { url, statut: 0, nom: "", prix: null, devise: "", dispo: null, image: "", couleur: "" };
  if (!(await autorise(url))) return { ...fiche, statut: "robots" };
  let r;
  try {
    r = await fetch(url, {
      headers: { "user-agent": UA, "accept-language": "fr-FR,fr;q=0.9,en;q=0.8", accept: "text/html" },
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    });
  } catch (e) {
    return { ...fiche, statut: `réseau ${e.message}` };
  }
  fiche.statut = r.status;
  fiche.urlFinale = r.url;
  if (!r.ok) return fiche;
  const html = await r.text();
  const ld = produitsJsonLd(html);
  const p = ld[0];
  if (p) {
    fiche.nom = decoder(String(p.name ?? ""));
    fiche.couleur = String(p.color ?? "");
    const offres = [].concat(p.offers ?? [], ...ld.slice(1).map((v) => [].concat(v.offers ?? [])));
    const o = offres.flatMap((x) => (x?.offers ? [].concat(x.offers) : [x])).find((x) => x && (x.price ?? x.lowPrice) != null);
    if (o) {
      fiche.prix = Number(o.price ?? o.lowPrice);
      fiche.devise = o.priceCurrency ?? "";
    }
    const dispos = offres.flatMap((x) => (x?.offers ? [].concat(x.offers) : [x])).map((x) => String(x?.availability ?? ""));
    if (dispos.some(Boolean)) fiche.dispo = dispos.some((d) => /InStock|LimitedAvailability|PreOrder/i.test(d));
    const img = [].concat(p.image ?? [])[0];
    fiche.image = typeof img === "string" ? img : (img?.url ?? img?.contentUrl ?? "");
  }
  fiche.nom ||= meta(html, "og:title");
  fiche.image ||= meta(html, "og:image");
  if (fiche.prix == null) {
    const prix = meta(html, "product:price:amount") || meta(html, "og:price:amount");
    if (prix) {
      fiche.prix = Number(prix.replace(",", "."));
      fiche.devise = meta(html, "product:price:currency") || meta(html, "og:price:currency");
    }
  }
  // Shopify : variantes et stock exacts
  if (/cdn\/shop\/|Shopify\.shop/.test(html) && /\/products\//.test(r.url)) {
    try {
      const u = new URL(r.url);
      const js = await (await fetch(`${u.origin}${u.pathname.replace(/\/$/, "")}.js`, { headers: { "user-agent": UA } })).json();
      fiche.nom = js.title ?? fiche.nom;
      fiche.prix = js.price / 100;
      fiche.dispo = !!js.available;
      fiche.devise ||= "EUR";
      fiche.image = js.featured_image ? (js.featured_image.startsWith("//") ? `https:${js.featured_image}` : js.featured_image) : fiche.image;
      fiche.variantes = js.variants?.map((v) => `${v.title}${v.available ? "" : " (épuisé)"}`).slice(0, 12);
    } catch {}
  }
  if (fiche.image.startsWith("//")) fiche.image = `https:${fiche.image}`;
  return fiche;
}

if (process.argv[1]?.endsWith("dressing-fiche.mjs")) {
  const urls = process.argv.slice(2);
  for (const [i, u] of urls.entries()) {
    if (i) await pause(3000);
    console.log(JSON.stringify(await lireFiche(u)));
  }
}
void fs;
