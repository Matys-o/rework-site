import { useEffect, useRef, useState } from "react";
import { DOMAINES, MARQUES, type Marque } from "../data/brands";
import { cn } from "../lib/cn";
import { lienMarque } from "../lib/liens";
import { useIntroFinie } from "../lib/useIntroFinie";

/** Hauteurs des cartes pour une largeur de 228 px (maquette 1135:903) — en aspect-ratio, le mur reste fluide */
const HAUTEURS = [300, 380, 260, 340];
const COLONNES = 6;
const PAR_COLONNE = 6;
/** Mobile : moins d'images par colonne (performance) */
const PAR_COLONNE_MOBILE = 4;
/** Durée d'un cycle par colonne (s) : calme, presque imperceptible */
const DUREES = [58, 44, 66, 50, 70, 40];

/** Seulement des photos locales (pas de vidéo, pas d'URL externe) */
const AVEC_IMAGE = MARQUES.filter(
  (m) => m.image?.startsWith("/images/") && !m.video,
);

function melanger<T>(liste: T[]) {
  const l = [...liste];
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [l[i], l[j]] = [l[j], l[i]];
  }
  return l;
}

/** Un mélange à chaque visite, qui favorise les entrées récentes : la moitié parmi les 60 dernières, le reste au hasard */
function tirerMur(): Marque[][] {
  const parColonne = window.matchMedia("(max-width: 639px)").matches ? PAR_COLONNE_MOBILE : PAR_COLONNE;
  const total = COLONNES * parColonne;
  const recentes = AVEC_IMAGE.slice(-60);
  const choisies = melanger(recentes).slice(0, total / 2);
  const reste = melanger(AVEC_IMAGE.filter((m) => !choisies.includes(m))).slice(
    0,
    total - choisies.length,
  );
  const tout = melanger([...choisies, ...reste]);
  return Array.from({ length: COLONNES }, (_, c) =>
    tout.slice(c * parColonne, (c + 1) * parColonne),
  );
}

function Carte({
  marque,
  hauteur,
  copie,
  prioritaire,
}: {
  marque: Marque;
  hauteur: number;
  copie: boolean;
  prioritaire: boolean;
}) {
  const domaine = DOMAINES[marque.domaine];
  return (
    // pb au lieu de gap : chaque moitié de la piste fait exactement 50 % → boucle sans couture
    <li className="pb-3">
      <a
        href={lienMarque(marque.slug)}
        aria-label={`${marque.nom} — ${domaine.nom}`}
        aria-hidden={copie || undefined}
        tabIndex={copie ? -1 : undefined}
        className="mur-carte group relative block overflow-hidden rounded-[16px] bg-brume"
        style={{ aspectRatio: `228 / ${hauteur}` }}
      >
        <img
          src={marque.image}
          alt=""
          width={228}
          height={hauteur}
          loading={prioritaire ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
        <span className="mur-cartouche verre-pill absolute inset-x-2.5 bottom-2.5 flex items-center justify-between gap-2 rounded-pill bg-blanc/60! py-1.5 pr-1.5 pl-3.5">
          <span
            className="truncate text-[14px] leading-[1.4] font-semibold text-encre"
            translate="no"
          >
            {marque.nom}
          </span>
          <span
            className="t-cote-s shrink-0 rounded-pill px-2.5 py-1 text-encre"
            style={{ backgroundColor: domaine.couleur }}
          >
            {domaine.nom}
          </span>
        </span>
      </a>
    </li>
  );
}

/**
 * Mur de marques — 6 colonnes décalées (5 en tablette, 3 en mobile) qui défilent lentement en boucle,
 * sens et vitesse alternés. Le défilement est en CSS (translateY sur une piste dupliquée) ;
 * il se met en pause hors écran, onglet caché, et au survol d'une colonne. Décoratif : posé derrière le panneau.
 */
export function MurMarques({ className }: { className?: string }) {
  const [colonnes] = useState(tirerMur);
  const introFinie = useIntroFinie();
  const ref = useRef<HTMLDivElement>(null);
  const [pause, setPause] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let visible = true;
    const maj = () => setPause(!visible || document.hidden);
    const obs = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      maj();
    });
    obs.observe(el);
    document.addEventListener("visibilitychange", maj);
    return () => {
      obs.disconnect();
      document.removeEventListener("visibilitychange", maj);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-label="Mur de marques et de films"
      role="group"
      data-pause={pause || undefined}
      className={cn(
        "mur grid grid-cols-3 gap-3 overflow-hidden px-1.5 sm:grid-cols-5 lg:grid-cols-6",
        className,
      )}
    >
      {colonnes.map((liste, c) => (
        <div
          key={c}
          // 4e–5e colonnes dès la tablette, 6e en desktop : sur mobile, leurs images (lazy) ne sont jamais chargées
          className={cn(
            "mur-colonne",
            c >= 3 && "max-sm:hidden",
            c === 5 && "max-lg:hidden",
            introFinie && "mur-colonne-arrivee",
          )}
          style={{ animationDelay: `${c * 70}ms`, marginTop: c % 2 ? -80 : 0 }}
        >
          <ul
            className={cn(
              "mur-piste",
              c % 2 ? "mur-piste-descend" : "mur-piste-monte",
            )}
            style={{ animationDuration: `${DUREES[c]}s` }}
          >
            {[false, true].map((copie) =>
              liste.map((m, i) => (
                <Carte
                  key={`${copie}-${m.slug}`}
                  marque={m}
                  hauteur={HAUTEURS[(i + c) % HAUTEURS.length]}
                  copie={copie}
                  prioritaire={!copie && i === 0 && c < 3}
                />
              )),
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}
