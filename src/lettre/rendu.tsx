// Rendu de la lettre : HTML (email et version web /lettre/n) + version texte brut.
// Utilisé par le prérendu (scripts/prerendu.mjs) et le script Brevo (scripts/lettre.mjs), jamais par le navigateur.
import { render } from "@react-email/render";
import { DOMAINES } from "../data/brands";
import { SITE_URL } from "../lib/site";
import { ENTREES_LISTEES, LettreEmail, STYLE_MSO } from "./LettreEmail";
import { metaEntree, texteEntree, urlFiche, type Lettre } from "./lettre";

/** Lien de désinscription Brevo, remplacé à l'envoi d'une campagne par le lien propre à chaque contact */
export const DESINSCRIPTION_BREVO = "{{ unsubscribe }}";
/** Ailleurs (version web, envoi de test transactionnel) : la page qui explique comment se désinscrire */
export const DESINSCRIPTION_PAGE = `${SITE_URL}/confidentialite#desinscription`;

export async function rendreLettre(
  lettre: Lettre,
  desinscription = DESINSCRIPTION_PAGE,
) {
  const html = (
    await render(
      <LettreEmail lettre={lettre} desinscription={desinscription} />,
    )
  ).replace("</head>", `${STYLE_MSO}</head>`);
  return { html, texte: texteBrut(lettre, desinscription) };
}

export function texteBrut(
  lettre: Lettre,
  desinscription = DESINSCRIPTION_PAGE,
) {
  const { trio } = lettre;
  const lignes = [
    `rework° — Lettre n°${lettre.numero} — semaine du ${lettre.semaineDu}`,
    `Voir en ligne : ${SITE_URL}${lettre.chemin}`,
    "",
    "/ LE TRIO DE LA SEMAINE",
    "",
    trio.titre.toUpperCase(),
    trio.intro,
    "",
  ];
  trio.items.forEach((m, i) => {
    lignes.push(
      metaEntree(m, i + 1).toUpperCase(),
      m.nom,
      texteEntree(m),
      urlFiche(m),
      "",
    );
    if (i < 2) lignes.push(`    |  ${trio.liens[i]}`, "    |", "");
  });
  lignes.push("/ ENTRÉES DANS L'ARCHIVE CETTE SEMAINE", "");
  if (lettre.entrees.length) {
    for (const m of lettre.entrees.slice(0, ENTREES_LISTEES)) {
      lignes.push(
        `${m.cote}  ${m.nom} — ${DOMAINES[m.domaine].nom}, ${[m.origine, m.annee || null].filter(Boolean).join(", ")}`,
      );
    }
    const reste = lettre.entrees.length - ENTREES_LISTEES;
    if (reste > 0)
      lignes.push(
        `+ ${reste} ${reste > 1 ? "autres entrées" : "autre entrée"} : ${SITE_URL}/index`,
      );
  } else {
    lignes.push(
      "Pas de nouvelle entrée cette semaine : l'archive prend son temps.",
    );
  }
  lignes.push(
    "",
    `Explorer l'archive → ${SITE_URL}/index`,
    "",
    "—",
    "rework° — archive vivante de la culture contemporaine. Paris.",
    "Tu reçois cette lettre parce que tu t'es inscrit·e sur rework.",
    `Se désinscrire : ${desinscription}`,
    `Confidentialité : ${SITE_URL}/confidentialite`,
  );
  return lignes.join("\n");
}
