// Métadonnées de chaque page : titre, description, image de partage, JSON-LD.
// Partagé par le prérendu (scripts/prerendu.mjs : balises écrites dans le HTML de chaque route, lisibles sans JavaScript),
// la Pages Function de /index (filtre ?domaine=) et le navigateur (useMeta : mise à jour pendant la navigation interne).
import { DOMAINES, MARQUES, TOTAL_ENTREES, type DomaineId, type Marque } from "../data/brands";
import { TRIOS, semaineIso, type Trio } from "../data/trios";
import { lienMarque } from "./liens";
import { IMAGE_PARTAGE, IMAGE_PARTAGE_ALT, NOM_SITE, SITE_URL, absolue } from "./site";

export type Meta = {
  titre: string;
  description: string;
  /** Chemin canonique (avec ?domaine= pour un filtre de l'index) */
  chemin: string;
  image: string;
  imageAlt: string;
  /** Dimensions de l'image (1200 × 630 pour les images générées) */
  imageLargeur: number;
  imageHauteur: number;
  type: "website" | "article";
  jsonLd: Record<string, unknown>[];
  /** Contenu minimal pour les robots sans JavaScript (<noscript>) */
  resume: string;
};

const LONGUEUR_MIN = 140;
const LONGUEUR_MAX = 160;

/** Compléments génériques, du plus long au plus court, pour atteindre 140 caractères sans couper de phrase */
const COMPLEMENTS = [
  "Rework, l'archive vivante de la culture contemporaine : pas de bruit, juste le signal.",
  "Une archive vivante de la culture contemporaine.",
  "Pas de bruit, juste le signal.",
  "Archive vivante.",
];

/**
 * Description entre 140 et 160 caractères. Trop courte : on ajoute les `suites` puis les compléments, chacun en entier
 * et seulement s'il tient sous 160. Trop longue : coupée au mot (…).
 */
export function ajuster(texte: string, ...suites: string[]) {
  let t = texte.trim();
  for (const s of [...suites, ...COMPLEMENTS].map((x) => x.trim()).filter(Boolean)) {
    if (t.length >= LONGUEUR_MIN) break;
    if (t.length + 1 + s.length <= LONGUEUR_MAX) t = `${t} ${s}`;
  }
  if (t.length <= LONGUEUR_MAX) return t;
  const coupe = t.slice(0, LONGUEUR_MAX - 1);
  return `${coupe.slice(0, coupe.lastIndexOf(" ")).replace(/[\s,;:.—–-]+$/, "")}…`;
}

const NOMS_DOMAINES = Object.values(DOMAINES).map((d) => d.nom.toLowerCase());
/** « mode, design, tech, digital et film » */
const LISTE_DOMAINES = `${NOMS_DOMAINES.slice(0, -1).join(", ")} et ${NOMS_DOMAINES.at(-1)}`;

const ORGANISATION = { "@type": "Organization", name: NOM_SITE, url: SITE_URL, logo: absolue("/icons/icon-512.png") };

const base = (m: Omit<Meta, "image" | "imageAlt" | "imageLargeur" | "imageHauteur" | "type" | "jsonLd"> & Partial<Meta>): Meta => ({
  image: IMAGE_PARTAGE,
  imageAlt: IMAGE_PARTAGE_ALT,
  imageLargeur: 1200,
  imageHauteur: 630,
  type: "website",
  jsonLd: [],
  ...m,
});

/** Image de partage d'une fiche : copie JPEG 1200 × 630 générée au build depuis la photo locale (pas pour les vidéos) */
export const aImagePartage = (m: Marque) => !!m.image && m.image.startsWith("/images/") && !m.video;
export const imagePartageFiche = (m: Marque) => `/og/fiches/${m.slug}.jpg`;

// ── Pages ────────────────────────────────────────────────

export function metaAccueil(): Meta {
  return base({
    titre: "rework° — archive vivante de la culture contemporaine",
    description: ajuster(
      `${TOTAL_ENTREES} entités sélectionnées en ${LISTE_DOMAINES}. Pas de bruit, juste le signal.`,
      "Une archive vivante, et chaque semaine un trio : un film, deux marques, un fil commun.",
    ),
    chemin: "/",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: NOM_SITE,
        alternateName: "Rework",
        url: `${SITE_URL}/`,
        inLanguage: "fr-FR",
        description: `Archive vivante de la culture contemporaine : ${TOTAL_ENTREES} entités en ${LISTE_DOMAINES}.`,
        publisher: ORGANISATION,
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/index?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
    ],
    resume: `Archive vivante de la culture contemporaine : ${TOTAL_ENTREES} entités en ${LISTE_DOMAINES}.`,
  });
}

export function metaIndex(domaine?: DomaineId | null): Meta {
  const d = domaine ? DOMAINES[domaine] : null;
  const titre = d ? `L'index · ${d.nom} — ${d.entrees} entités | ${NOM_SITE}` : `L'index — ${TOTAL_ENTREES} entités | ${NOM_SITE}`;
  const description = d
    ? ajuster(
        `${d.nom} : ${d.entrees} entités de l'archive Rework. ${d.description}`,
        d.id === "film" ? "Le top 50 Letterboxd, classé par rang, avec réalisation, pays et année." : "Recherche par nom, ville ou année, tri par date d'entrée ou par nom.",
      )
    : ajuster(
        `Les ${TOTAL_ENTREES} entités de l'archive Rework, classées par domaine : ${LISTE_DOMAINES}.`,
        "Recherche par nom, ville ou année, filtres et tri, en grille ou en liste.",
      );
  const chemin = d ? `/index?domaine=${d.id}` : "/index";
  return base({
    titre,
    description,
    chemin,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: titre.replace(` | ${NOM_SITE}`, ""),
        description,
        url: absolue(chemin),
        inLanguage: "fr-FR",
        isPartOf: { "@type": "WebSite", name: NOM_SITE, url: `${SITE_URL}/` },
        mainEntity: { "@type": "ItemList", numberOfItems: d ? d.entrees : TOTAL_ENTREES },
      },
    ],
    resume: description,
  });
}

export function metaFiche(m: Marque): Meta {
  const d = DOMAINES[m.domaine];
  const film = m.domaine === "film";
  const titre = `${m.nom} — ${d.nom}${m.annee ? `, ${m.annee}` : ""} | ${NOM_SITE}`;
  const contexte = film
    ? `Film de ${m.realisation}${m.origine ? ` (${m.origine}` : " ("}${m.annee ? `, ${m.annee})` : ")"}, n°${m.rang} du top Letterboxd.`
    : `${m.nom} : ${[d.nom.toLowerCase(), m.etiquette.toLowerCase(), m.origine].filter(Boolean).join(", ")}${m.annee ? `, depuis ${m.annee}` : ""}.`;
  const cote = `Fiche ${m.cote} de l'archive Rework.`;
  const description = m.description ? ajuster(m.description, contexte, cote) : ajuster(contexte, cote);
  const image = aImagePartage(m) ? imagePartageFiche(m) : IMAGE_PARTAGE;
  const url = absolue(lienMarque(m.slug));

  const ld: Record<string, unknown> = film
    ? {
        "@context": "https://schema.org",
        "@type": "Movie",
        name: m.nom,
        ...(m.titreOriginal && m.titreOriginal !== m.nom && { alternateName: m.titreOriginal }),
        url,
        ...(m.url && { sameAs: [m.url] }),
        description: m.description,
        image: absolue(image),
        ...(m.annee && { dateCreated: String(m.annee) }),
        ...(m.origine && { countryOfOrigin: { "@type": "Country", name: m.origine } }),
        ...(m.etiquette && { genre: m.etiquette }),
        ...(m.realisation && { director: m.realisation.split(/,\s*/).map((name) => ({ "@type": "Person", name })) }),
      }
    : {
        "@context": "https://schema.org",
        "@type": ["Organization", "Brand"],
        name: m.nom,
        url,
        ...(m.url && { sameAs: [m.url] }),
        description: m.description,
        image: absolue(image),
        ...(m.annee && { foundingDate: String(m.annee) }),
        ...(m.origine && { foundingLocation: { "@type": "Place", name: m.origine } }),
        ...(m.etiquette && { keywords: `${d.nom}, ${m.etiquette}` }),
      };

  return base({
    titre,
    description,
    chemin: lienMarque(m.slug),
    image,
    imageAlt: aImagePartage(m) ? `${m.nom}${film ? `, film de ${m.realisation}` : ` — ${d.nom}`}` : IMAGE_PARTAGE_ALT,
    type: "article",
    jsonLd: [ld],
    resume: `${m.nom} — ${d.nom}${m.annee ? `, ${m.annee}` : ""}. ${m.description}`,
  });
}

export function metaManifeste(): Meta {
  return base({
    titre: `Manifeste — pas de bruit, juste le signal | ${NOM_SITE}`,
    description: ajuster(
      "Pourquoi Rework existe : curater, contextualiser, ralentir, transmettre. Une archive vivante plutôt qu'un magazine, une nouvelle entrée par semaine.",
    ),
    chemin: "/manifeste",
    resume: "Rework n'est pas un magazine, c'est une archive vivante. Curater, contextualiser, ralentir, transmettre.",
  });
}

export function metaTrios(): Meta {
  return base({
    titre: `Les trios — un fil, trois entrées | ${NOM_SITE}`,
    description: ajuster(
      "Chaque semaine, Rework relie un film, une marque et une autre marque par un fil commun : une esthétique, une matière, une époque, une idée.",
      "L'archive des trios.",
    ),
    chemin: "/trios",
    resume: "Chaque semaine, un film, une marque, puis une autre marque, reliés par un fil commun.",
  });
}

export const lienTrio = (t: Trio) => `/trios/${t.semaine}`;

export function metaTrio(t: Trio): Meta {
  const [a, b, c] = t.items;
  const titre = `${t.titre} — trio de la semaine ${t.numero} | ${NOM_SITE}`;
  const image = aImagePartage(a) ? imagePartageFiche(a) : IMAGE_PARTAGE;
  return base({
    titre,
    description: ajuster(`${t.intro} ${a.nom} → ${b.nom} → ${c.nom}.`, `Le trio de la semaine ${t.numero} sur Rework : un film, deux marques, un fil commun.`),
    chemin: lienTrio(t),
    image,
    imageAlt: image === IMAGE_PARTAGE ? IMAGE_PARTAGE_ALT : `${a.nom}, film de ${a.realisation}`,
    type: "article",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: t.titre,
        description: t.intro,
        url: absolue(lienTrio(t)),
        itemListElement: t.items.map((m, i) => ({ "@type": "ListItem", position: i + 1, name: m.nom, url: absolue(lienMarque(m.slug)) })),
      },
    ],
    resume: `${t.titre}. ${t.intro} ${a.nom} → ${b.nom} → ${c.nom}. ${t.liens.join(" ")}`,
  });
}

// ── Balises HTML ─────────────────────────────────────────

const echapper = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Balises propres à la page, à poser dans le <head> (entre les marqueurs <!--meta:debut--> et <!--meta:fin-->) */
export function balisesHtml(meta: Meta) {
  const url = absolue(meta.chemin);
  const image = absolue(meta.image);
  const e = echapper;
  return [
    `<title>${e(meta.titre)}</title>`,
    `<meta name="description" content="${e(meta.description)}" />`,
    `<link rel="canonical" href="${e(url)}" />`,
    `<meta property="og:title" content="${e(meta.titre)}" />`,
    `<meta property="og:description" content="${e(meta.description)}" />`,
    `<meta property="og:url" content="${e(url)}" />`,
    `<meta property="og:type" content="${meta.type}" />`,
    `<meta property="og:site_name" content="${NOM_SITE}" />`,
    `<meta property="og:locale" content="fr_FR" />`,
    `<meta property="og:image" content="${e(image)}" />`,
    `<meta property="og:image:width" content="${meta.imageLargeur}" />`,
    `<meta property="og:image:height" content="${meta.imageHauteur}" />`,
    `<meta property="og:image:alt" content="${e(meta.imageAlt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${e(meta.titre)}" />`,
    `<meta name="twitter:description" content="${e(meta.description)}" />`,
    `<meta name="twitter:image" content="${e(image)}" />`,
    `<meta name="twitter:image:alt" content="${e(meta.imageAlt)}" />`,
    ...meta.jsonLd.map((ld) => `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`),
  ].join("\n    ");
}

/** Contenu <noscript> : titre et résumé lisibles sans JavaScript */
export const noscriptHtml = (meta: Meta) =>
  `<noscript><h1>${echapper(meta.titre)}</h1><p>${echapper(meta.resume)}</p></noscript>`;

// ── Routes prérendues ────────────────────────────────────

export type RoutePrerendue = { chemin: string; meta: Meta };

/** Toutes les routes à prérendre au build (trios : seulement ceux déjà publiés à la date du build) */
export function routesPrerendues(date = new Date()): RoutePrerendue[] {
  const publies = TRIOS.filter((t) => t.semaine <= semaineIso(date));
  return [
    { chemin: "/", meta: metaAccueil() },
    { chemin: "/index", meta: metaIndex() },
    { chemin: "/manifeste", meta: metaManifeste() },
    { chemin: "/trios", meta: metaTrios() },
    ...publies.map((t) => ({ chemin: lienTrio(t), meta: metaTrio(t) })),
    ...MARQUES.map((m) => ({ chemin: lienMarque(m.slug), meta: metaFiche(m) })),
  ];
}
