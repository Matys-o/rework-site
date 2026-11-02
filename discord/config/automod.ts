// Règles AutoMod du serveur. Ajuste librement les listes, puis relance `npm run discord:setup`.
//
// Syntaxe des mots (règles de Discord) :
//   mot      → le mot entier uniquement (« pute » ne bloque pas « réputation »)
//   *mot     → tout ce qui se termine par « mot »
//   mot*     → tout ce qui commence par « mot »
//   *mot*    → « mot » n'importe où (attention aux faux positifs)
// Discord ignore la casse. Ajoute les variantes avec et sans accents. 1 000 mots max, 60 caractères chacun.

export const MESSAGE_BLOQUE =
  "Ton message a été bloqué automatiquement. Si c'est une erreur, écris à un modo, on regarde ça ensemble.";

/** Au-delà de ce nombre de mentions (utilisateurs + rôles) dans un message, il est bloqué */
export const MENTIONS_MAX = 5;

/** Invitations vers d'autres serveurs Discord */
export const REGEX_INVITATIONS = [
  String.raw`(discord\.gg|discord(app)?\.com/invite|dsc\.gg)/\S+`,
];

/** Mots haineux ou injurieux (français). Liste volontairement sobre : complète-la selon ce que tu vois passer. */
export const MOTS_INTERDITS = [
  // Injures directes
  "connard", "connards", "connasse", "connasses",
  "salope", "salopes", "salaud",
  "enculé", "encule", "enculés", "enculer",
  "fdp", "fils de pute",
  "ntm", "nique ta mère", "nique ta mere", "nique ta race",
  "pute", "putes",
  "batard", "bâtard", "bâtards", "batards",
  "ta gueule", "tg",
  // Haine (origine, religion, orientation, identité, handicap)
  "nègre", "negre", "négro", "negro", "bamboula",
  "bougnoule", "bougnoul", "raton", "bicot",
  "youpin", "youpine", "sale juif", "sale arabe", "sale noir", "sale blanc", "sale musulman",
  "pédé", "pede", "pédés", "tapette", "tarlouze", "gouine", "travelo",
  "mongol", "mongolien", "trisomique",
  // Incitations
  "suicide toi", "suicide-toi", "va te pendre", "crève", "creve",
];

/** Mots autorisés malgré tout (ex. : « raton laveur ») */
export const MOTS_AUTORISES = ["raton laveur", "ratons laveurs"];
