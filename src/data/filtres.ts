// Filtres avancés de la page Marques (panneau « Filtres ») : famille, pays, époque, couleur, gamme de prix.
// - Pays et époque : dérivés des données réelles (origine, année).
// - Couleur : teinte dominante de l'image de couverture, calculée par scripts/couleurs.mjs (couleurs.json).
// - Famille et prix : attribués à la main dans attributs.json — le prix est une ESTIMATION éditoriale.
import type { DomaineId, Marque } from "./brands";
import ATTRIBUTS from "./attributs.json";
import COULEURS from "./couleurs.json";

export type Option = {
  id: string;
  label: string;
  /** Pastille de couleur (filtre Couleur) */ teinte?: string;
};

/** Familles par univers — l'ordre est celui de l'affichage */
export const FAMILLES: Record<Exclude<DomaineId, "film">, Option[]> = {
  mode: [
    { id: "luxe", label: "Luxe & couture" },
    { id: "createurs", label: "Avant-garde & créateurs" },
    { id: "pretaporter", label: "Prêt-à-porter & essentiels" },
    { id: "street", label: "Streetwear & skate" },
    { id: "outdoor", label: "Outdoor & technique" },
    { id: "workwear", label: "Workwear & héritage" },
    { id: "chaussures", label: "Chaussures & sport" },
    { id: "accessoires", label: "Accessoires" },
  ],
  design: [
    { id: "mobilier", label: "Mobilier" },
    { id: "luminaires", label: "Luminaires" },
    { id: "systemes", label: "Bureau & rangement" },
    { id: "cuisine", label: "Cuisine & bain" },
    { id: "objets", label: "Objets & textile" },
    { id: "exterieur", label: "Extérieur" },
  ],
  tech: [
    { id: "son", label: "Son" },
    { id: "image", label: "Image & optique" },
    { id: "mobilite", label: "Auto & mobilité" },
    { id: "objets-tech", label: "Objets & interfaces" },
  ],
  digital: [
    { id: "creation", label: "Outils de création" },
    { id: "productivite", label: "Productivité" },
    { id: "communication", label: "Communication & publication" },
    { id: "finance", label: "Commerce, finance & web3" },
    { id: "dev", label: "Dev, IA & web libre" },
  ],
};

export const PRIX: Option[] = [
  { id: "1", label: "€ · Accessible" },
  { id: "2", label: "€€ · Milieu de gamme" },
  { id: "3", label: "€€€ · Premium" },
  { id: "4", label: "€€€€ · Luxe" },
];

export const EPOQUES: Option[] = [
  { id: "avant-1950", label: "Avant 1950" },
  { id: "1950-1979", label: "1950 – 1979" },
  { id: "1980-1999", label: "1980 – 1999" },
  { id: "2000-2009", label: "2000 – 2009" },
  { id: "depuis-2010", label: "Depuis 2010" },
];

export const COULEURS_OPTIONS: Option[] = [
  { id: "noir", label: "Noir", teinte: "#151515" },
  { id: "gris", label: "Gris", teinte: "#9a9a96" },
  { id: "blanc", label: "Blanc", teinte: "#f4f3ef" },
  { id: "beige", label: "Beige & brun", teinte: "#b8916a" },
  { id: "rouge", label: "Rouge", teinte: "#c8322b" },
  { id: "rose", label: "Rose", teinte: "#e79bb4" },
  { id: "orange", label: "Orange", teinte: "#e7792b" },
  { id: "jaune", label: "Jaune", teinte: "#e9c536" },
  { id: "vert", label: "Vert", teinte: "#3f8a4f" },
  { id: "bleu", label: "Bleu", teinte: "#2f5fb3" },
  { id: "violet", label: "Violet", teinte: "#7a4bb0" },
];

/** Origine (pays ou ville) → pays ; une valeur absente de la table est déjà un pays */
const VILLE_VERS_PAYS: Record<string, string> = {
  Paris: "France",
  Annecy: "France",
  Lille: "France",
  Bordeaux: "France",
  Dijon: "France",
  Grenoble: "France",
  Caen: "France",
  Autun: "France",
  Thoissey: "France",
  Londres: "Royaume-Uni",
  UK: "Royaume-Uni",
  Somerset: "Royaume-Uni",
  Northampton: "Royaume-Uni",
  "South Shields": "Royaume-Uni",
  Brighton: "Royaume-Uni",
  "New York": "États-Unis",
  "San Francisco": "États-Unis",
  "Los Angeles": "États-Unis",
  Anaheim: "États-Unis",
  Ventura: "États-Unis",
  USA: "États-Unis",
  "USA/EU": "États-Unis",
  "USA/Paris": "États-Unis",
  Tokyo: "Japon",
  Kojima: "Japon",
  Osaka: "Japon",
  Anvers: "Belgique",
  Copenhague: "Danemark",
  Ebeltoft: "Danemark",
  Struer: "Danemark",
  Vicence: "Italie",
  Turin: "Italie",
  Madrid: "Espagne",
  Yecla: "Espagne",
  Séoul: "Corée du Sud",
  Corée: "Corée du Sud",
  Zurich: "Suisse",
  Berlin: "Allemagne",
  Francfort: "Allemagne",
  Wetzlar: "Allemagne",
  Stockholm: "Suède",
  Göteborg: "Suède",
  Amsterdam: "Pays-Bas",
  Auckland: "Nouvelle-Zélande",
  NZ: "Nouvelle-Zélande",
  Dubai: "Émirats arabes unis",
};

export const paysDe = (origine: string) =>
  origine ? (VILLE_VERS_PAYS[origine] ?? origine) : "";

function epoqueDe(annee: number) {
  if (!annee) return "";
  if (annee < 1950) return "avant-1950";
  if (annee < 1980) return "1950-1979";
  if (annee < 2000) return "1980-1999";
  if (annee < 2010) return "2000-2009";
  return "depuis-2010";
}

export type Attributs = {
  famille: string;
  prix: string;
  pays: string;
  epoque: string;
  couleur: string;
};

const attrib = ATTRIBUTS as unknown as Record<string, [string, number]>;
const teintes = COULEURS as Record<string, string>;

export function attributsDe(m: Marque): Attributs {
  const [famille = "", prix = 0] = attrib[m.id] ?? [];
  return {
    famille,
    prix: prix ? String(prix) : "",
    pays: paysDe(m.origine),
    epoque: epoqueDe(m.annee),
    couleur: teintes[m.id] ?? "",
  };
}

/** Clés des filtres — aussi les paramètres d'URL (?famille=street,outdoor&pays=Japon…) */
export const CLES_FILTRES = [
  "famille",
  "pays",
  "epoque",
  "couleur",
  "prix",
] as const;
export type CleFiltre = (typeof CLES_FILTRES)[number];
export type Selection = Record<CleFiltre, string[]>;

export const TITRES_FILTRES: Record<CleFiltre, string> = {
  famille: "Famille",
  pays: "Pays d'origine",
  epoque: "Époque",
  couleur: "Couleur",
  prix: "Gamme de prix",
};

/** Une marque passe si, pour chaque filtre actif, sa valeur est l'une des valeurs cochées (OU dans un filtre, ET entre filtres) */
export function correspond(a: Attributs, sel: Selection, sauf?: CleFiltre) {
  return CLES_FILTRES.every(
    (k) => k === sauf || sel[k].length === 0 || sel[k].includes(a[k]),
  );
}

/** Libellé d'une valeur, pour les pastilles retirables */
export function libelle(cle: CleFiltre, valeur: string) {
  const listes: Partial<Record<CleFiltre, Option[]>> = {
    famille: Object.values(FAMILLES).flat(),
    epoque: EPOQUES,
    couleur: COULEURS_OPTIONS,
    prix: PRIX,
  };
  return listes[cle]?.find((o) => o.id === valeur)?.label ?? valeur;
}
