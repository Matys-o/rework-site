// Identité du site — source unique pour toutes les URL absolues (métadonnées, sitemap, JSON-LD).

/** URL de production (Cloudflare Pages, projet rework-archive) — sans barre finale */
export const SITE_URL = "https://rework-archive.pages.dev";

export const NOM_SITE = "rework°";

/** Image de partage par défaut (1200 × 630) */
export const IMAGE_PARTAGE = "/og/rework-og.png";
export const IMAGE_PARTAGE_ALT = "rework° — l'archive vivante de la culture contemporaine";

export const COULEUR_THEME = "#EEECE7";

/** Chemin → URL absolue */
export const absolue = (chemin: string) => (/^https?:\/\//.test(chemin) ? chemin : `${SITE_URL}${chemin.startsWith("/") ? "" : "/"}${chemin}`);
