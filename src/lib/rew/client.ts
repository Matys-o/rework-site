// REW côté navigateur : un seul point d'entrée (rew.ouvrir) pour le menu, le bandeau, la box de l'accueil et /rew.
// La conversation et le profil vivent dans sessionStorage : rien n'est stocké côté serveur.
import { useSyncExternalStore } from "react";
import {
  PROFIL_VIDE,
  type ErreurRew,
  type MessageRew,
  type ProfilRew,
  type ReponseRew,
} from "./types";

export const LONGUEUR_MAX = 500;

export type Tour =
  | { role: "user"; texte: string }
  | { role: "rew"; reponse: ReponseRew }
  | { role: "erreur"; code: ErreurRew["erreur"]; texte: string };

type Etat = {
  ouvert: boolean;
  tours: Tour[];
  profil: ProfilRew;
  enCours: boolean;
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

let urlAvant: string | null = null;

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
    maj({ tours: [], profil: PROFIL_VIDE, brouillon: "", enCours: false });
  },
  async envoyer(texteBrut: string) {
    const texte = texteBrut.trim().slice(0, LONGUEUR_MAX);
    if (!texte || etat.enCours) return;
    const tours = [
      ...etat.tours.filter((t) => t.role !== "erreur"),
      { role: "user", texte } as Tour,
    ];
    maj({ tours, enCours: true, brouillon: "" });
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
    let tour: Tour;
    try {
      const r = await fetch("/api/rew", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages, profil: etat.profil }),
        signal: AbortSignal.timeout(45_000),
      });
      const corps = (await r.json().catch(() => ({ erreur: "erreur" }))) as
        ReponseRew | ErreurRew;
      if ("erreur" in corps)
        tour = { role: "erreur", code: corps.erreur, texte };
      else {
        tour = { role: "rew", reponse: corps };
        maj({ profil: corps.profil });
      }
    } catch (e) {
      tour = {
        role: "erreur",
        code:
          e instanceof DOMException && e.name === "TimeoutError"
            ? "delai"
            : "erreur",
        texte,
      };
    }
    maj({ tours: [...etat.tours, tour], enCours: false });
  },
  /** Réessayer après une erreur : on renvoie la dernière demande */
  reessayer() {
    const dernier = [...etat.tours].reverse().find((t) => t.role === "erreur");
    if (!dernier || dernier.role !== "erreur") return;
    const sansDernier = etat.tours.slice(
      0,
      etat.tours.lastIndexOf(dernier) - 1,
    );
    maj({ tours: sansDernier });
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

export const MESSAGES_ERREUR: Record<ErreurRew["erreur"], string> = {
  limite:
    "Tu as beaucoup échangé avec REW cette heure-ci. Reviens dans un moment, je serai là.",
  "trop-long": "Ton message est un peu long : 500 caractères au maximum.",
  invalide: "Je n'ai pas compris la demande. Tu peux la reformuler ?",
  indisponible: "REW n'est pas encore branché sur ce site. Réessaie plus tard.",
  refus:
    "Je ne peux pas t'aider sur ce sujet. Parlons plutôt mode, design, musique ou cinéma ?",
  delai: "REW a mis trop de temps à fouiller l'archive.",
  erreur: "Quelque chose s'est mal passé de mon côté.",
};
