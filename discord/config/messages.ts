// Textes des messages épinglés. Ton : chaleureux, simple, tutoiement, sans jargon ni MAJUSCULES.
// Les références {#clé} sont remplacées par la mention du salon, {@&clé} par celle du rôle (voir lib/embeds.ts).
// Modifier un texte puis relancer `npm run discord:setup` : le message déjà épinglé est modifié, pas republié.
import { SITE } from "./server.ts";

export type MessageDef = {
  /** Titre de l'embed */
  title: string;
  description: string;
  fields?: { name: string; value: string }[];
  footer?: string;
  /** Forums : titre du post épinglé */
  postTitle?: string;
};

export const MESSAGES: Record<string, MessageDef> = {
  "nouveaux-arrivants": {
    title: "Bienvenue sur REWORK 👋",
    description:
      "Ici, on partage les marques qui font les choses bien : bien faites, bien pensées, faites pour durer.",
    fields: [
      {
        name: "Pour bien commencer",
        value: [
          "1. Lis la charte dans {#regles} (2 minutes, promis).",
          "2. Choisis tes univers dans **Salons et rôles**, tout en haut de la liste des salons.",
          "3. Présente-toi dans {#presentations}, même en une phrase.",
          "4. Passe chaque matin sur {#marque-du-jour} : une nouvelle marque du site t'y attend.",
        ].join("\n"),
      },
      {
        name: "Ici, c'est bienveillant",
        value:
          "Personne ne juge ton budget, ton style ou tes questions. On aime les débutants comme les connaisseurs.",
      },
      {
        name: "Une question ?",
        value: `Mentionne {@&moderation}, on est là. 🌱\n→ Le site : ${SITE}`,
      },
    ],
  },

  regles: {
    title: "📜 La charte de REWORK",
    description: "Cinq règles, pas plus. Elles valent partout sur le serveur, fils et messages privés compris.",
    fields: [
      { name: "1. Sois bienveillant", value: "On critique des idées ou des produits, jamais des personnes." },
      { name: "2. Pas de pub", value: "Pas de pub ni d'auto-promo sans l'accord du staff, même en message privé." },
      { name: "3. Pas de contrefaçon ni de vente", value: "On parle des marques, on ne vend rien et on ne fait pas la promo des copies." },
      { name: "4. Reste dans le bon salon", value: "Chaque salon a son sujet, écrit en haut : jette un œil avant de poster." },
      { name: "5. Respecte la vie privée", value: "Pas d'infos personnelles, ni les tiennes ni celles des autres." },
      {
        name: "Si ça dérape",
        value: "On commence par un rappel, puis une exclusion temporaire, et en dernier recours un bannissement.",
      },
    ],
    footer: "En rejoignant le serveur, tu acceptes cette charte. Merci de faire de REWORK un endroit agréable.",
  },

  "tes-roles": {
    title: "🎭 Tes rôles",
    description:
      "Les rôles servent à te montrer ce qui te parle et à te prévenir quand il se passe quelque chose. Pour les changer : clique sur **Salons et rôles**, tout en haut de la liste des salons. Tu peux revenir dessus quand tu veux.",
    fields: [
      {
        name: "Tes univers",
        value:
          "{@&u-mode} · {@&u-design} · {@&u-tech} · {@&u-digital} · {@&u-film}\nIls mettent en avant le salon de l'univers et te mentionnent quand la marque du jour en fait partie.",
      },
      {
        name: "Tes notifications",
        value:
          "{@&notif-marque} : une mention chaque matin avec la marque du jour.\n{@&notif-film} : une mention chaque matin avec le film du jour.\n{@&notif-annonces} : les nouveautés importantes de REWORK.\nPersonne ne mentionne jamais tout le serveur.",
      },
      {
        name: "Les autres rôles",
        value: [
          "{@&membre} : donné quand tu acceptes la charte. Il te permet d'écrire.",
          "{@&contributeur} : un badge d'honneur quand une marque que tu as suggérée entre dans l'archive.",
          "{@&moderation} : l'équipe qui veille sur le serveur. N'hésite pas à la mentionner.",
          "{@&fondateur} : le créateur de REWORK.",
        ].join("\n"),
      },
    ],
  },

  presentations: {
    title: "🙋 Présente-toi !",
    description:
      "Pas besoin d'en faire trop, une phrase suffit. Si tu manques d'inspiration, voici un exemple à reprendre :",
    fields: [
      {
        name: "Exemple",
        value:
          "> Salut, moi c'est Lou, je suis à Lyon. J'aime le design scandinave et les vêtements qui durent dix ans. Ma marque préférée de l'archive : USM Haller. J'ai découvert REWORK grâce à un ami.",
      },
      { name: "Bon à savoir", value: "Un message par heure dans ce salon, pour laisser la place à chacun." },
    ],
  },

  "forum-avis": {
    postTitle: "📌 Comment poster ici",
    title: "Comment poster dans avis-et-conseils",
    description:
      "Un post = une question. Plus tu donnes de contexte, plus les réponses seront utiles. Pense à choisir un tag.",
    fields: [
      {
        name: "Modèle à recopier",
        value:
          "```\nMarque / pièce : \nMa question : \nCe que je sais déjà : \nBudget (si tu veux) : \nPhoto (si tu en as une) : \n```",
      },
      { name: "Merci", value: "Quand tu as ta réponse, remercie la personne qui t'a aidé, ça fait toujours plaisir." },
    ],
  },

  "forum-aide": {
    postTitle: "📌 Comment poster ici",
    title: "Comment poster dans aide-à-trouver",
    description:
      "Tu cherches une marque qui fait quelque chose de précis ? Décris-le, la communauté t'aide. Quand tu as trouvé, ajoute le tag « résolu ».",
    fields: [
      {
        name: "Modèle à recopier",
        value:
          "```\nJe cherche une marque qui fait : \nPour quel usage : \nCe que j'ai déjà regardé : \nBudget (si tu veux) : \n```",
      },
    ],
  },

  "forum-suggestion": {
    postTitle: "📌 Comment suggérer une marque",
    title: "Comment suggérer une marque",
    description:
      "Une marque par post, s'il te plaît. Vérifie d'abord qu'elle n'est pas déjà sur le site. Le staff mettra le tag à jour (en attente, acceptée, déjà sur le site).",
    fields: [
      {
        name: "Modèle à recopier",
        value: "```\nNom : \nLien : \nUnivers : mode / design / tech / digital\nPourquoi elle mérite sa place : \n```",
      },
      {
        name: "Ta suggestion est acceptée ?",
        value: "Tu reçois le rôle {@&contributeur}, un petit badge pour te dire merci.",
      },
    ],
  },
};
