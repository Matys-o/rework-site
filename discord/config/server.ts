// Arborescence du serveur Discord REWORK : rôles, catégories, salons, permissions.
// C'est la seule source de vérité : pour ajouter un salon, ajoute une entrée ici puis relance `npm run discord:setup`.
// Chaque élément a une `key` stable : ne la change jamais (c'est elle qui relie l'entrée au salon déjà créé, via generated/ids.json).
// Le nom affiché, lui, peut changer librement.
import { PermissionFlagsBits as P } from "discord.js";
import type { DomaineId } from "../../src/data/brands.ts";

export const SITE = "https://rework-archive.pages.dev";

/** Couleurs du site (tokens.css) */
export const COULEURS = {
  lime: 0xb8ff6a,
  encre: 0x0e0e0e,
  papier: 0xf5f3ee,
  signal: 0xff3d2e,
  domaine: {
    mode: 0xff8fc7,
    design: 0xd2f34c,
    tech: 0xff7a1a,
    digital: 0x8cc8ff,
    film: 0xb49bff,
  } satisfies Record<DomaineId, number>,
};

// ─── Rôles ──────────────────────────────────────────────────────────────────

export type RoleKey =
  | "fondateur"
  | "moderation"
  | "contributeur"
  | "membre"
  | "u-mode"
  | "u-design"
  | "u-tech"
  | "u-digital"
  | "u-film"
  | "notif-marque"
  | "notif-film"
  | "notif-annonces";

export type RoleDef = {
  key: RoleKey;
  name: string;
  color?: number;
  /** Affiché séparément dans la liste des membres */
  hoist?: boolean;
  /** Mentionnable par tout le monde (non : seuls le staff et le bot mentionnent les rôles) */
  mentionable?: boolean;
  /** Permissions globales du rôle (les surcharges par salon sont plus bas) */
  permissions: bigint[];
};

/** Ce que tout membre accepté peut faire (le reste est réglé salon par salon) */
const PERMS_MEMBRE = [
  P.SendMessages,
  P.SendMessagesInThreads,
  P.CreatePublicThreads,
  P.AddReactions,
  P.EmbedLinks,
  P.AttachFiles,
  P.Connect,
  P.Speak,
  P.UseVAD,
  P.Stream,
];

/**
 * Ordre = du plus haut au plus bas. Le rôle du bot (« REWORK », créé par Discord à l'invitation) n'est pas listé :
 * le script place tous les rôles ci-dessous sous lui ; 👑 et 🛡️ doivent ensuite être glissés AU-DESSUS du bot à la main
 * (un bot ne peut jamais placer un rôle au-dessus du sien).
 */
export const ROLES: RoleDef[] = [
  // Administrateur : un bot ne peut pas accorder « Administrateur » → à cocher à la main (tu es propriétaire, tu as déjà tout).
  { key: "fondateur", name: "👑 Fondateur", color: 0xf5f3ee, hoist: true, permissions: [] },
  {
    key: "moderation",
    name: "🛡️ Modération",
    color: 0xb8ff6a,
    hoist: true,
    mentionable: true, // « Une question ? Mentionne @Modération »
    permissions: [
      ...PERMS_MEMBRE,
      P.ManageMessages,
      P.ManageThreads,
      P.PinMessages,
      P.ModerateMembers, // exclure temporairement
      P.CreateInstantInvite,
      P.SendPolls,
      P.ViewAuditLog,
    ],
  },
  { key: "contributeur", name: "✨ Contributeur", color: 0xe0b24a, hoist: true, permissions: [] },
  { key: "membre", name: "🌱 Membre", color: 0x9a978f, permissions: PERMS_MEMBRE },
  { key: "u-mode", name: "👕 Mode", permissions: [] },
  { key: "u-design", name: "🪑 Design", permissions: [] },
  { key: "u-tech", name: "📷 Tech", permissions: [] },
  { key: "u-digital", name: "💻 Digital", permissions: [] },
  { key: "u-film", name: "🎬 Films", permissions: [] },
  { key: "notif-marque", name: "🔔 Marque du jour", permissions: [] },
  { key: "notif-film", name: "🔔 Film du jour", permissions: [] },
  { key: "notif-annonces", name: "🔔 Annonces", permissions: [] },
];

/** Rôle d'univers mentionné avec la marque du jour */
export const ROLE_DOMAINE: Record<DomaineId, RoleKey> = {
  mode: "u-mode",
  design: "u-design",
  tech: "u-tech",
  digital: "u-digital",
  film: "u-film",
};

export const EMOJI_DOMAINE: Record<DomaineId, string> = {
  mode: "👕",
  design: "🪑",
  tech: "📷",
  digital: "💻",
  film: "🎬",
};

/**
 * Permissions globales de @everyone : seulement voir et lire.
 * Le script ne touche qu'aux permissions listées dans GEREES_EVERYONE ; les autres restent comme Discord les a mises.
 */
export const PERMS_EVERYONE = [P.ViewChannel, P.ReadMessageHistory];
export const GEREES_EVERYONE = [
  P.ViewChannel,
  P.ReadMessageHistory,
  P.SendMessages,
  P.SendMessagesInThreads,
  P.CreatePublicThreads,
  P.AddReactions,
  P.EmbedLinks,
  P.AttachFiles,
  P.MentionEveryone,
  P.CreateInstantInvite,
  P.SendTTSMessages,
  P.ManageMessages,
  P.PinMessages,
  P.ManageThreads,
  P.Connect,
  P.Speak,
  P.UseVAD,
  P.Stream,
  P.SendPolls,
];

// ─── Surcharges par salon ───────────────────────────────────────────────────

/** Cible d'une surcharge : un rôle de la config, @everyone ou le rôle du bot */
export type Cible = RoleKey | "everyone" | "bot";
export type Surcharge = { cible: Cible; allow?: bigint[]; deny?: bigint[] };

const ECRIRE = [P.SendMessages, P.SendMessagesInThreads, P.CreatePublicThreads, P.CreatePrivateThreads, P.SendPolls];
const ECRIRE_STAFF = [P.SendMessages, P.SendMessagesInThreads, P.CreatePublicThreads, P.EmbedLinks, P.AttachFiles, P.AddReactions];

/** Lecture seule : personne n'écrit sauf 👑 🛡️ 🤖 ; les réactions restent ouvertes aux membres. */
export const LECTURE_SEULE: Surcharge[] = [
  { cible: "everyone", deny: ECRIRE },
  { cible: "fondateur", allow: ECRIRE_STAFF },
  { cible: "moderation", allow: ECRIRE_STAFF },
  // Le bot doit garder TOUT ce que @everyone perd : sinon Discord lui refuse de poser des surcharges dans la catégorie (50013).
  { cible: "bot", allow: [...ECRIRE, ...ECRIRE_STAFF, P.ManageMessages, P.PinMessages, P.ManageThreads] },
];

/** Lecture seule, mais les membres peuvent répondre dans les fils ouverts par le bot (« On en parle ? 💬 ») */
export const LECTURE_SEULE_AVEC_FILS: Surcharge[] = [
  ...LECTURE_SEULE,
  { cible: "membre", allow: [P.SendMessagesInThreads] },
];

/** Catégorie staff : invisible pour tous sauf 👑 🛡️ 🤖 */
const STAFF: Surcharge[] = [
  { cible: "everyone", deny: [P.ViewChannel] },
  { cible: "fondateur", allow: [P.ViewChannel] },
  { cible: "moderation", allow: [P.ViewChannel] },
  { cible: "bot", allow: [P.ViewChannel, ...ECRIRE_STAFF] },
];

/** Sondages : tout le monde vote, seul le staff en crée (les membres n'ont pas SendPolls) */
const SONDAGES: Surcharge[] = [{ cible: "moderation", allow: [P.SendPolls] }];

// ─── Salons ─────────────────────────────────────────────────────────────────

export type TypeSalon = "text" | "announcement" | "forum" | "media" | "voice";

export type Tag = { name: string; emoji?: string; /** réservé au staff */ staff?: boolean };

export type SalonDef = {
  key: string;
  name: string;
  type: TypeSalon;
  topic?: string;
  /** Mode lent en secondes */
  slowmode?: number;
  /** Surcharges propres au salon, ajoutées à celles de la catégorie */
  overwrites?: Surcharge[];
  /** Forums / média */
  tags?: Tag[];
  defaultReaction?: string;
  /** Messages épinglés (clés de config/messages.ts) */
  pinned?: string[];
};

export type CategorieDef = {
  key: string;
  name: string;
  overwrites: Surcharge[];
  channels: SalonDef[];
};

/** Format des noms : « emoji・nom-du-salon » */
export const CATEGORIES: CategorieDef[] = [
  {
    key: "bienvenue",
    name: "📌 BIENVENUE",
    overwrites: LECTURE_SEULE,
    channels: [
      {
        key: "nouveaux-arrivants",
        name: "👋・nouveaux-arrivants",
        type: "text",
        topic: "Bienvenue chez toi ! Commence par ici : tout ce qu'il faut savoir en 1 minute.",
        pinned: ["nouveaux-arrivants"],
      },
      {
        key: "regles",
        name: "📜・règles",
        type: "text",
        topic: "La charte du serveur : 5 règles simples pour que tout le monde se sente bien.",
        pinned: ["regles"],
      },
      {
        key: "annonces",
        name: "📣・annonces",
        type: "announcement",
        topic: "Les nouveautés de REWORK. Tu peux suivre ce salon pour les recevoir sur ton propre serveur.",
      },
      {
        key: "tes-roles",
        name: "🎭・tes-rôles",
        type: "text",
        topic: "À quoi servent les rôles, et comment choisir les tiens dans « Salons et rôles ».",
        pinned: ["tes-roles"],
      },
    ],
  },
  {
    key: "fil",
    name: "🗞️ LE FIL REWORK",
    overwrites: LECTURE_SEULE,
    channels: [
      {
        key: "marque-du-jour",
        name: "🏷️・marque-du-jour",
        type: "announcement",
        topic: "Chaque matin à 9 h, une marque de l'archive t'attend ici. Réagis, ou viens en parler dans le fil.",
        overwrites: LECTURE_SEULE_AVEC_FILS,
      },
      {
        key: "film-du-jour",
        name: "🎬・film-du-jour",
        type: "announcement",
        topic: "Chaque matin à 9 h, un des 50 films de l'archive. Le fil sous le message est fait pour en parler.",
        overwrites: LECTURE_SEULE_AVEC_FILS,
      },
      {
        key: "trio-de-la-semaine",
        name: "🔺・trio-de-la-semaine",
        type: "announcement",
        topic: "Chaque lundi, le trio du site : un film, deux marques, un fil commun.",
        overwrites: LECTURE_SEULE_AVEC_FILS,
      },
      {
        key: "nouveautes-du-site",
        name: "🆕・nouveautés-du-site",
        type: "text",
        topic: "Les marques qui entrent dans l'archive et les nouvelles fonctionnalités du site.",
      },
      {
        key: "newsletter",
        name: "💌・newsletter",
        type: "text",
        topic: "Le lien vers chaque nouvelle lettre du lundi, pour la lire même sans être inscrit.",
      },
    ],
  },
  {
    key: "communaute",
    name: "💬 COMMUNAUTÉ",
    overwrites: [],
    channels: [
      {
        key: "discussion",
        name: "💬・discussion",
        type: "text",
        topic: "Le salon de tout le monde. Parle de ce que tu veux, avec bienveillance.",
        slowmode: 5,
      },
      {
        key: "presentations",
        name: "🙋・présentations",
        type: "text",
        topic: "Dis-nous qui tu es, même en une phrase. Un message par heure, pour laisser la place à chacun.",
        slowmode: 3600,
        pinned: ["presentations"],
      },
      {
        // Forum : chaque trouvaille devient un post avec son propre fil.
        // (Le type « media » serait idéal, mais Discord le refuse sur ce serveur : erreur 50024.)
        key: "vos-trouvailles",
        name: "📸・vos-trouvailles",
        type: "forum",
        topic:
          "Montre tes pièces, objets et setups. Une photo par post, dis-nous la marque et pourquoi tu l'aimes. Les commentaires se font dans le fil du post.",
        defaultReaction: "🔥",
        tags: [
          { name: "mode", emoji: "👕" },
          { name: "objet", emoji: "🪑" },
          { name: "tech", emoji: "📷" },
          { name: "setup", emoji: "🖥️" },
          { name: "seconde-main", emoji: "♻️" },
        ],
      },
      {
        key: "avis-et-conseils",
        name: "🧵・avis-et-conseils",
        type: "forum",
        topic:
          "Un sujet par question : taille, qualité, entretien, alternative… Choisis un tag et donne un maximum de contexte. Lis le post épinglé avant de publier.",
        defaultReaction: "🙏",
        tags: [
          { name: "taille", emoji: "📏" },
          { name: "qualité", emoji: "🧵" },
          { name: "entretien", emoji: "🧼" },
          { name: "alternative", emoji: "🔁" },
          { name: "seconde-main", emoji: "♻️" },
        ],
        pinned: ["forum-avis"],
      },
      {
        key: "aide-a-trouver",
        name: "🔍・aide-à-trouver",
        type: "forum",
        topic:
          "« Je cherche une marque qui fait… » Décris ce que tu cherches, ton budget si tu veux, et ajoute le tag « résolu » quand tu as trouvé.",
        defaultReaction: "🔍",
        tags: [
          { name: "mode", emoji: "👕" },
          { name: "objet", emoji: "🪑" },
          { name: "tech", emoji: "📷" },
          { name: "digital", emoji: "💻" },
          { name: "résolu", emoji: "✅" },
        ],
        pinned: ["forum-aide"],
      },
    ],
  },
  {
    key: "univers",
    name: "🎨 PAR UNIVERS",
    overwrites: [],
    // Les univers du site (src/data/brands.ts → DOMAINES)
    channels: [
      { key: "mode", name: "👕・mode", type: "text", topic: "Streetwear, techwear, maisons indépendantes : vêtements, chaussures, accessoires." },
      { key: "design", name: "🪑・design-et-objet", type: "text", topic: "Mobilier, objets, éditeurs historiques : tout ce qui fait une maison." },
      { key: "tech", name: "📷・tech", type: "text", topic: "Outils, machines, matériel de création : audio, photo, appareils." },
      { key: "digital", name: "💻・digital", type: "text", topic: "Logiciels, plateformes, studios et culture en ligne." },
      { key: "films", name: "🎬・films", type: "text", topic: "Les 50 films de l'archive, et tous les autres. Pense à prévenir avant un spoiler." },
    ],
  },
  {
    key: "contribuer",
    name: "🛠️ CONTRIBUER",
    overwrites: [],
    channels: [
      {
        key: "suggerer-une-marque",
        name: "💡・suggérer-une-marque",
        type: "forum",
        topic:
          "Une marque par post : son nom, son lien, et pourquoi elle mérite sa place dans l'archive. Le staff met à jour le tag.",
        defaultReaction: "👍",
        tags: [
          { name: "en-attente", emoji: "⏳", staff: true },
          { name: "acceptée", emoji: "✅", staff: true },
          { name: "déjà-sur-le-site", emoji: "📚", staff: true },
        ],
        pinned: ["forum-suggestion"],
      },
      {
        key: "retours-site",
        name: "🐞・retours-site",
        type: "text",
        topic: "Un bug, une idée pour le site ? Dis-nous ce que tu as vu, sur quelle page et quel appareil.",
      },
      {
        key: "sondages",
        name: "🗳️・sondages",
        type: "text",
        topic: "Les sondages de la communauté : vote et donne ton avis. Une idée de sondage ? Propose-la à un modo.",
        overwrites: SONDAGES,
      },
    ],
  },
  {
    key: "vocal",
    name: "🔊 VOCAL",
    overwrites: [],
    channels: [
      { key: "salon-vocal", name: "🛋️ Salon", type: "voice" },
      { key: "ecoute-partagee", name: "🎧 Écoute partagée", type: "voice" },
    ],
  },
  {
    key: "staff",
    name: "🛡️ STAFF",
    overwrites: STAFF,
    channels: [
      { key: "moderation", name: "🛡️・modération", type: "text", topic: "Entre modos : cas en cours, décisions, questions." },
      { key: "journal", name: "📋・journal", type: "text", topic: "Alertes AutoMod et journal de modération." },
      { key: "bot", name: "🤖・bot", type: "text", topic: "Résultats des scripts : marque du jour, film du jour, trio, setup." },
    ],
  },
];

// ─── Paramètres du serveur ──────────────────────────────────────────────────

/**
 * Ce que `--prune` ne supprime jamais, même hors config : rôles et salons créés par Wick (anti-raid / anti-nuke),
 * sa quarantaine, sa vérification et ses logs. Les rôles gérés par un bot (ex. « Wick ») sont déjà protégés.
 * Ajoute un motif ici si un autre bot crée ses propres rôles ou salons.
 */
export const CONSERVER = {
  roles: [/wick/i, /quarant/i, /mute/i, /v[ée]rifi/i, /unverified/i],
  salons: [/wick/i, /quarant/i, /v[ée]rifi/i, /logs?\b/i, /^rules$/i],
};

export const PARAMETRES = {
  /** Salon de règles (Communauté) */
  rulesChannel: "regles",
  /** Salon des mises à jour Discord pour la communauté (privé) */
  publicUpdatesChannel: "moderation",
  /** Messages d'arrivée + autocollants de bienvenue */
  systemChannel: "discussion",
  /** Alertes AutoMod */
  alertChannel: "journal",
  /** Rapports des scripts */
  botChannel: "bot",
};

export const ECRAN_BIENVENUE = {
  description: "L'archive des marques qui font les choses bien. Bienvenue chez toi.",
  channels: [
    { channel: "nouveaux-arrivants", emoji: "👋", description: "Par où commencer" },
    { channel: "marque-du-jour", emoji: "🏷️", description: "Une nouvelle marque chaque matin" },
    { channel: "discussion", emoji: "💬", description: "Viens dire bonjour" },
  ],
};

export type OptionOnboarding = {
  title: string;
  description?: string;
  emoji?: string;
  roles?: RoleKey[];
  channels?: string[];
};
export type QuestionOnboarding = {
  title: string;
  required: boolean;
  singleSelect: boolean;
  options: OptionOnboarding[];
};

export const ONBOARDING: { defaultChannels: string[]; prompts: QuestionOnboarding[] } = {
  defaultChannels: [
    "nouveaux-arrivants",
    "regles",
    "annonces",
    "tes-roles",
    "marque-du-jour",
    "film-du-jour",
    "trio-de-la-semaine",
    "nouveautes-du-site",
    "newsletter",
    "discussion",
  ],
  prompts: [
    {
      title: "Tu acceptes la charte ?",
      required: true,
      singleSelect: true,
      options: [
        {
          title: "Oui, je m'engage à la respecter",
          description: "Bienveillance, pas de pub, pas de contrefaçon, le bon salon, la vie privée.",
          emoji: "🌱",
          roles: ["membre"],
        },
      ],
    },
    {
      title: "Qu'est-ce qui t'intéresse ?",
      required: false,
      singleSelect: false,
      options: [
        { title: "Mode", description: "Vêtements, chaussures, accessoires", emoji: "👕", roles: ["u-mode"], channels: ["mode"] },
        { title: "Design et objet", description: "Mobilier, objets, maison", emoji: "🪑", roles: ["u-design"], channels: ["design"] },
        { title: "Tech", description: "Appareils, audio, photo", emoji: "📷", roles: ["u-tech"], channels: ["tech"] },
        { title: "Digital", description: "Outils, apps, studios", emoji: "💻", roles: ["u-digital"], channels: ["digital"] },
        { title: "Films", description: "Les 50 films de l'archive", emoji: "🎬", roles: ["u-film"], channels: ["films"] },
      ],
    },
    {
      title: "Tu veux être notifié ?",
      required: false,
      singleSelect: false,
      options: [
        { title: "La marque du jour", description: "Une mention chaque matin à 9 h", emoji: "🏷️", roles: ["notif-marque"] },
        { title: "Le film du jour", description: "Une mention chaque matin à 9 h", emoji: "🎬", roles: ["notif-film"] },
        { title: "Les annonces", description: "Les nouveautés importantes de REWORK", emoji: "📣", roles: ["notif-annonces"] },
      ],
    },
  ],
};
