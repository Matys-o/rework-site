import Lenis from "lenis";
import {
  motionValue,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import type { PointerEvent } from "react";
import { useEcran } from "./useEcran";

/** Courbe signature des apparitions */
export const EASE_REVELE = [0.22, 1, 0.36, 1] as const;

// ── Contexte : mobile / tactile ────────────────────────────
// Pas de tilt ni d'effet souris, parallax réduit de moitié, auras plus lentes (voir tokens.css).

export const REQUETE_MOBILE = "(max-width: 767px), (pointer: coarse)";

export function useEstMobile() {
  return useEcran(REQUETE_MOBILE);
}

/** Coefficient à appliquer aux parallax : 0 si mouvement réduit, 0.5 en mobile, 1 sinon */
export function useFacteurParallax() {
  const reduit = useReducedMotion();
  const mobile = useEstMobile();
  return reduit ? 0 : mobile ? 0.5 : 1;
}

// ── Scroll fluide ──────────────────────────────────────────
// Instance unique de Lenis, pilotée par la boucle de Motion (voir <Defilement />).

let lenisCourant: Lenis | null = null;

export const lenis = {
  definir: (l: Lenis | null) => (lenisCourant = l),
  arreter: () => lenisCourant?.stop(),
  reprendre: () => lenisCourant?.start(),
  /** Retour immédiat en haut (changement de page) */
  haut: () => (lenisCourant ? lenisCourant.scrollTo(0, { immediate: true, force: true }) : window.scrollTo(0, 0)),
};

/** Défile jusqu'à un élément — via Lenis si actif, sinon natif */
export function defilerVers(cible: HTMLElement | null, decalage = -120) {
  if (!cible) return;
  if (lenisCourant) lenisCourant.scrollTo(cible, { offset: decalage });
  else cible.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── Navigation interne ─────────────────────────────────────
// Renseignée par <Navigation /> : permet de naviguer (avec View Transition) hors des composants.

let naviguerCourant: ((vers: string) => void) | null = null;

export const navigation = {
  definir: (fn: ((vers: string) => void) | null) => (naviguerCourant = fn),
  aller: (vers: string) => (naviguerCourant ? naviguerCourant(vers) : window.location.assign(vers)),
};

// ── Pointeur global ────────────────────────────────────────
// Position normalisée (−1 → 1) partagée par toutes les auras : un seul écouteur pour tout le site.

let pointeur: { x: MotionValue<number>; y: MotionValue<number> } | null = null;

export function pointeurGlobal() {
  if (pointeur) return pointeur;
  pointeur = { x: motionValue(0), y: motionValue(0) };
  if (typeof window !== "undefined" && !window.matchMedia(REQUETE_MOBILE).matches) {
    window.addEventListener(
      "pointermove",
      (e) => {
        pointeur!.x.set((e.clientX / window.innerWidth) * 2 - 1);
        pointeur!.y.set((e.clientY / window.innerHeight) * 2 - 1);
      },
      { passive: true },
    );
  }
  return pointeur;
}

// ── Cartes interactives ────────────────────────────────────
// Fiches et tuiles domaine, au survol (souris uniquement) :
//   · l'aura glisse vers le curseur · tilt 3D (max 6°, perspective 1000 px)
//   · un reflet lumineux suit la souris sur le verre (déplacé en transform, jamais repeint)

const RESSORT = { stiffness: 150, damping: 18, mass: 0.6 };

export function useCarteInteractive({ amplitudeAura = 0.45, inclinaison = 6 } = {}) {
  const reduit = useReducedMotion();
  const mobile = useEstMobile();
  const actif = !reduit && !mobile;

  // position du curseur dans la carte, 0 → 1 (0.5 = centre)
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const survol = useMotionValue(0);
  const largeur = useMotionValue(0);
  const hauteur = useMotionValue(0);

  const sx = useSpring(px, RESSORT);
  const sy = useSpring(py, RESSORT);

  const rotateY = useTransform(sx, [0, 1], [-inclinaison, inclinaison]);
  const rotateX = useTransform(sy, [0, 1], [inclinaison, -inclinaison]);

  const auraX = useSpring(useTransform([px, largeur], ([p, l]: number[]) => (p - 0.5) * l * amplitudeAura), { stiffness: 90, damping: 18 });
  const auraY = useSpring(useTransform([py, hauteur], ([p, h]: number[]) => (p - 0.5) * h * amplitudeAura), { stiffness: 90, damping: 18 });

  const refletX = useTransform([sx, largeur], ([p, l]: number[]) => p * l);
  const refletY = useTransform([sy, hauteur], ([p, h]: number[]) => p * h);
  const refletOpacite = useSpring(survol, { stiffness: 120, damping: 20 });
  const transformReflet = useMotionTemplate`translate3d(${refletX}px, ${refletY}px, 0) translate(-50%, -50%)`;

  const handlers = actif
    ? {
        onPointerMove: (e: PointerEvent<HTMLElement>) => {
          if (e.pointerType !== "mouse") return;
          const r = e.currentTarget.getBoundingClientRect();
          largeur.set(r.width);
          hauteur.set(r.height);
          px.set((e.clientX - r.left) / r.width);
          py.set((e.clientY - r.top) / r.height);
          survol.set(1);
        },
        onPointerLeave: () => {
          px.set(0.5);
          py.set(0.5);
          survol.set(0);
        },
      }
    : {};

  return {
    actif,
    handlers,
    /** à passer à <Aura suivi={…} /> */
    suivi: { x: auraX, y: auraY },
    /** style du conteneur incliné */
    tilt: actif ? { rotateX, rotateY, transformPerspective: 1000 } : {},
    /** style du reflet (élément rond, en absolu) */
    reflet: { transform: transformReflet, opacity: refletOpacite },
  };
}
