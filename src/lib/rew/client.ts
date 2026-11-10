// REW côté navigateur : un seul point d'entrée (rew.ouvrir) pour le menu, le bandeau, la box de l'accueil et /rew.
// La conversation et le profil vivent dans sessionStorage : rien n'est stocké côté serveur.
import { useSyncExternalStore } from "react";
import {
  ERREURS_TEMPORAIRES,
  LONGUEUR_MAX,
  PROFIL_VIDE,
  type CarteRew,
  type ErreurRew,
  type MessageRew,
  type ProfilRew,
  type ReponseRew,
} from "./types";

export { LONGUEUR_MAX };

export type Tour =
  | { role: "user"; texte: string }
  | { role: "rew"; reponse: ReponseRew }
  | { role: "erreur"; code: ErreurRew["erreur"]; texte: string };

type Etat = {
  ouvert: boolean;
  tours: Tour[];
  profil: ProfilRew;
  enCours: boolean;
  /** Pendant une demande : 1 = premier essai, 2 = nouvelle tentative automatique ; début = horodatage de la demande */
  essai: number;
  debut: number;
  /** La demande en cours est un brief long (texte d'attente adapté) */
  long: boolean;
  brouillon: string;
  /** Incrémenté à chaque ouverture : le panneau remet le focus dans le champ */
  ouverture: number;
};

const CLE = "rew-session";
const charger = (): Pick<Etat, "tours" | "profil"> => {
  try {
    const s = JSON.parse(sessionStorage.getItem(CLE) ?? "null");
    if (s && Array.isArray(s.tours))
      return { tours: s.tours, profil: { ...PROFIL_VIDE, ...s.profil } };
  } catch {
    /* session indisponible : on repart de zéro */
  }
  return { tours: [], profil: PROFIL_VIDE };
};

let etat: Etat = {
  ouvert: false,
  enCours: false,
  essai: 0,
  debut: 0,
  long: false,
  brouillon: "",
  ouverture: 0,
  ...(typeof window !== "undefined"
    ? charger()
    : { tours: [], profil: PROFIL_VIDE }),
};
const abonnes = new Set<() => void>();
function maj(partiel: Partial<Etat>) {
  etat = { ...etat, ...partiel };
  try {
    sessionStorage.setItem(
      CLE,
      JSON.stringify({ tours: etat.tours, profil: etat.profil }),
    );
  } catch {
    /* navigation privée : la conversation reste en mémoire */
  }
  abonnes.forEach((f) => f());
}

export function useRew() {
  return useSyncExternalStore(
    (f) => {
      abonnes.add(f);
      return () => abonnes.delete(f);
    },
    () => etat,
    () => etat,
  );
}

/** Résumé d'une réponse de REW pour l'historique envoyé au serveur (court : noms, pas les cartes) */
function resume(r: ReponseRew) {
  const choix = r.sections
    .flatMap((s) => s.cartes.map((c) => `${c.nom} (${s.univers})`))
    .join(", ");
  return [r.message, choix && `Sélection : ${choix}.`, r.conclusion, r.question]
    .filter(Boolean)
    .join(" ");
}

// ── Explications de REW transmises aux fiches ──
// Quand on ouvre une fiche depuis une carte REW, la fiche affiche le « Pourquoi » de cette recommandation.
// C'est une explication propre à la conversation (sessionStorage), jamais mélangée à la description éditoriale.
const CLE_RAISONS = "rew-raisons";
export type RaisonRew = { raison: string; demande: string };
function raisons(): Record<string, RaisonRew> {
  try {
    return JSON.parse(sessionStorage.getItem(CLE_RAISONS) ?? "{}") ?? {};
  } catch {
    return {};
  }
}
/** Mémorise le « Pourquoi » d'une carte au moment où on ouvre sa fiche (avec la demande qui l'a fait naître) */
export function memoriserRaison(carte: CarteRew) {
  if (!carte.raison) return;
  const dansLaConversation = etat.tours.some(
    (t) =>
      t.role === "rew" &&
      t.reponse.sections.some((s) => s.cartes.some((c) => c.id === carte.id)),
  );
  const demande = dansLaConversation
    ? ([...etat.tours].reverse().find((t) => t.role === "user") as
        | { texte: string }
        | undefined)?.texte ?? ""
    : "";
  try {
    const r = raisons();
    r[carte.fiche] = { raison: carte.raison, demande: demande.slice(0, 160) };
    sessionStorage.setItem(CLE_RAISONS, JSON.stringify(r));
  } catch {
    /* sans session : la fiche s'affiche sans le « Pourquoi » */
  }
}
/** Le « Pourquoi » de REW pour une fiche (chemin /marque/…, /musique/…), s'il vient d'une recommandation */
export function raisonPour(fiche: string): RaisonRew | undefined {
  if (typeof window === "undefined") return undefined;
  return raisons()[fiche];
}

let urlAvant: string | null = null;
/** Demande en cours : un numéro par envoi, pour ignorer toute réponse tardive (jamais deux réponses pour une demande) */
let demandeCourante = 0;
let controleur: AbortController | null = null;

const ESSAIS_MAX = 2;
const DELAI_ESSAI_MS = 65_000; // le serveur s'arrête à 55 s
type Resultat =
  | { ok: true; reponse: ReponseRew }
  | { ok: false; code: ErreurRew["erreur"]; temporaire: boolean };

/** Un essai : distingue réponse, erreur de l'API REW (code), délai dépassé et coupure réseau */
async function essayer(corps: string, signal: AbortSignal): Promise<Resultat> {
  // Délai par essai sans AbortSignal.any (absent des navigateurs un peu anciens)
  const essai = new AbortController();
  let depasse = false;
  const minuteur = setTimeout(() => {
    depasse = true;
    essai.abort();
  }, DELAI_ESSAI_MS);
  const relayer = () => essai.abort();
  signal.addEventListener("abort", relayer);
  try {
    const r = await fetch("/api/rew", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: corps,
      signal: essai.signal,
    });
    const c = (await r.json().catch(() => null)) as
      ReponseRew | ErreurRew | null;
    // Réponse illisible (page d'erreur de la plateforme, coupure) : temporaire si 5xx
    if (!c)
      return {
        ok: false,
        code: "erreur",
        temporaire: r.status >= 500 || r.status === 0,
      };
    if ("erreur" in c)
      return {
        ok: false,
        code: c.erreur,
        temporaire: ERREURS_TEMPORAIRES.includes(c.erreur),
      };
    return { ok: true, reponse: c };
  } catch (e) {
    if (signal.aborted) throw e; // abandon volontaire (nouvelle conversation)
    return { ok: false, code: depasse ? "delai" : "erreur", temporaire: true };
  } finally {
    clearTimeout(minuteur);
    signal.removeEventListener("abort", relayer);
  }
}

export const rew = {
  /** Ouvre le panneau. `texte` + `envoyer` : la demande part tout de suite ; `texte` seul : champ pré-rempli */
  ouvrir({ texte, envoyer }: { texte?: string; envoyer?: boolean } = {}) {
    if (!etat.ouvert && window.location.pathname !== "/rew") {
      urlAvant =
        window.location.pathname +
        window.location.search +
        window.location.hash;
      window.history.pushState({ rew: true }, "", "/rew");
    }
    maj({
      ouvert: true,
      ouverture: etat.ouverture + 1,
      brouillon: texte && !envoyer ? texte : etat.brouillon,
    });
    if (texte && envoyer) void rew.envoyer(texte);
  },
  /** Ferme le panneau ; l'URL revient à la page d'avant (bouton retour = fermer) */
  fermer({ depuisHistorique = false } = {}) {
    if (!etat.ouvert) return;
    maj({ ouvert: false });
    if (depuisHistorique) return;
    if (urlAvant !== null && window.history.state?.rew) window.history.back();
    else if (window.location.pathname === "/rew")
      window.history.replaceState(null, "", "/");
    urlAvant = null;
  },
  setBrouillon(brouillon: string) {
    maj({ brouillon: brouillon.slice(0, LONGUEUR_MAX) });
  },
  nouvelle() {
    demandeCourante++;
    controleur?.abort();
    maj({
      tours: [],
      profil: PROFIL_VIDE,
      brouillon: "",
      enCours: false,
      essai: 0,
    });
  },
  async envoyer(texteBrut: string) {
    const texte = texteBrut.trim().slice(0, LONGUEUR_MAX);
    if (!texte || etat.enCours) return;
    const numero = ++demandeCourante;
    const tours = [
      ...etat.tours.filter((t) => t.role !== "erreur"),
      { role: "user", texte } as Tour,
    ];
    maj({
      tours,
      enCours: true,
      essai: 1,
      debut: Date.now(),
      long: texte.length > 200,
      brouillon: "",
    });
    const messages: MessageRew[] = tours
      .map((t): MessageRew | null =>
        t.role === "user"
          ? { role: "user", content: t.texte }
          : t.role === "rew"
            ? { role: "assistant", content: resume(t.reponse) }
            : null,
      )
      .filter((m): m is MessageRew => !!m)
      .slice(-6);
    const corps = JSON.stringify({ messages, profil: etat.profil });

    controleur = new AbortController();
    let resultat: Resultat = { ok: false, code: "erreur", temporaire: true };
    try {
      // 1er essai, puis UNE nouvelle tentative automatique si l'erreur est temporaire. Les essais sont successifs :
      // un seul est en vol à la fois, et seul le dernier peut produire une réponse.
      for (let essai = 1; essai <= ESSAIS_MAX; essai++) {
        if (essai > 1) maj({ essai });
        resultat = await essayer(corps, controleur.signal);
        if (resultat.ok || !resultat.temporaire) break;
      }
    } catch {
      return; // conversation remise à zéro pendant la demande
    }
    if (numero !== demandeCourante) return; // réponse tardive d'une demande abandonnée

    if (resultat.ok) {
      maj({
        tours: [...etat.tours, { role: "rew", reponse: resultat.reponse }],
        profil: resultat.reponse.profil,
        enCours: false,
        essai: 0,
      });
    } else
      maj({
        tours: [...etat.tours, { role: "erreur", code: resultat.code, texte }],
        enCours: false,
        essai: 0,
        // Échec définitif : le brief revient dans le champ, rien à retaper
        brouillon: etat.brouillon || texte,
      });
  },
  /** Réessayer après une erreur : on renvoie la dernière demande */
  reessayer() {
    const dernier = [...etat.tours].reverse().find((t) => t.role === "erreur");
    if (!dernier || dernier.role !== "erreur") return;
    const sansDernier = etat.tours.slice(
      0,
      etat.tours.lastIndexOf(dernier) - 1,
    );
    // Le brouillon restauré est la même demande : on le vide pour ne pas l'envoyer deux fois
    maj({
      tours: sansDernier,
      brouillon: etat.brouillon === dernier.texte ? "" : etat.brouillon,
    });
    void rew.envoyer(dernier.texte);
  },
};

if (typeof window !== "undefined") {
  // Bouton retour du navigateur pendant que REW est ouvert : on ferme
  window.addEventListener("popstate", () => {
    if (etat.ouvert && window.location.pathname !== "/rew")
      rew.fermer({ depuisHistorique: true });
  });
}

const DIFFICULTES =
  "REW rencontre quelques difficultés pour analyser ta demande. Ton message a bien été conservé. Tu peux réessayer.";

export const MESSAGES_ERREUR: Record<ErreurRew["erreur"], string> = {
  limite:
    "Tu as beaucoup échangé avec REW cette heure-ci. Reviens dans un moment, je serai là.",
  "trop-long": `Ton message est un peu long : ${LONGUEUR_MAX} caractères au maximum.`,
  invalide: "Je n'ai pas compris la demande. Tu peux la reformuler ?",
  indisponible:
    "REW est indisponible pour le moment. Ton message a bien été conservé, réessaie un peu plus tard.",
  refus:
    "Je ne peux pas t'aider sur ce sujet. Parlons plutôt mode, design, musique ou cinéma ?",
  delai: DIFFICULTES,
  surcharge: DIFFICULTES,
  generation: DIFFICULTES,
  erreur: DIFFICULTES,
};

/** Texte d'attente, selon le temps écoulé et l'essai (jamais « bloqué » : il change au fil de l'analyse) */
export function texteAttente(ecoule: number, essai: number, long: boolean) {
  if (essai > 1) return "Petit contretemps, REW relance l'analyse";
  if (ecoule < 4_000) return long ? "REW lit ton brief" : "REW lit ta demande";
  if (ecoule < 10_000)
    return long ? "REW analyse ton brief" : "REW cherche dans l'archive";
  if (ecoule < 20_000) return "REW compose sa sélection";
  return long
    ? "Brief détaillé : REW prend le temps de bien faire"
    : "Encore quelques secondes";
}
