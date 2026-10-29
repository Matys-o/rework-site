import { motion, useScroll, useTransform } from "motion/react";
import { useRef, type CSSProperties } from "react";
import { DOMAINES, metaMarque, type Domaine, type Marque } from "../data/brands";
import { useCarteInteractive, useFacteurParallax } from "../lib/mouvement";
import { Reflet } from "./Reflet";
import { cn } from "../lib/cn";
import { lienMarque } from "../lib/liens";
import { Aura } from "./Aura";
import { FlecheSurvol } from "./Icone";
import { MediaCouverture } from "./MediaCouverture";

/** Forme signature : fiche à onglet (rayon 28). Remplie avec currentColor. */
function FormeDossier({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("absolute inset-0", className)}>
      <span className="absolute top-0 left-0 h-[68px] w-[129px] rounded-tl-dossier bg-current" />
      <svg className="absolute top-0 left-[127px] h-[41px] w-[54px]" viewBox="0 0 54 41" fill="currentColor">
        <path d="M0 0H1C27 0 27 40 53 40H54V41H0Z" />
      </svg>
      <span className="absolute inset-x-0 top-10 bottom-0 rounded-dossier bg-current" />
    </span>
  );
}

/** Taille du titre de fiche, proportionnelle à la largeur de la fiche (cqw) */
const tailleTitreFiche = (titre: string) =>
  titre.length > 30 ? "min(24px, 6.7cqw)" : titre.length > 12 ? "min(30px, 8.4cqw)" : "min(40px, 11cqw)";

type FicheDossierProps = {
  /** Texte de l'onglet (cote ou année) */
  onglet: string;
  domaine: Domaine;
  meta: string;
  titre: string;
  description: string;
  /** Lettre de la couverture — remplace la photo tant qu'on n'en a pas */
  initiale?: string;
  /** Photo de couverture, posée sur « aura + initiale » (fond pendant le chargement, secours en cas d'erreur) */
  image?: string;
  /** La couverture est une vidéo (.mp4 / .webm) */
  video?: boolean;
  /** Texte de la pastille sur la couverture (par défaut : le domaine) */
  pastille?: string;
  href?: string;
  /** Nom de View Transition : la couverture devient l'image hero de la page marque */
  nomTransition?: string;
  className?: string;
};

// Fiche (dossier à onglet) — survol : levée −8 px, ombre Levée, aura dilatée, flèche ↗ sur rouge
export function FicheDossier({ onglet, domaine, meta, titre, description, initiale, image, video, pastille, href, nomTransition, className }: FicheDossierProps) {
  const Racine = href ? "a" : "article";
  // Survol : l'aura suit le curseur, tilt 3D (max 6°), reflet lumineux
  const { handlers, suivi, tilt, reflet, actif } = useCarteInteractive({ amplitudeAura: 0.45 });
  // L'initiale géante défile à 0.85x dans son cadre (moitié moins en mobile)
  const facteur = useFacteurParallax();
  const couvertureRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: couvertureRef, offset: ["start end", "end start"] });
  const yInitiale = useTransform(scrollYProgress, [0, 1], [-55 * facteur, 55 * facteur]);

  return (
    <Racine
      href={href}
      {...handlers}
      // Fluide : largeur max 400 px (548 px de haut à cette largeur, comme la maquette), couverture en aspect-ratio
      className={cn("group @container relative block w-full max-w-[400px] pt-2 outline-offset-8", className)}
    >
      <motion.div className="relative will-change-transform" style={tilt}>
      <div
        className={cn(
          "relative text-blanc transition-[translate] duration-240 ease-rw",
          "group-hover:-translate-y-2",
        )}
      >
        {/* Ombre Repos → Levée : deux formes superposées, on ne fait varier que l'opacité */}
        <FormeDossier className="[filter:var(--drop-repos)]" />
        <FormeDossier className="opacity-0 [filter:var(--drop-levee)] transition-opacity duration-240 ease-rw group-hover:opacity-100" />

        <div className="relative flex flex-col px-6 pt-[60px] pb-[42px] text-encre">
          <span className="t-cote-s absolute top-3.5 left-[22px]">{onglet}</span>

          <div
            ref={couvertureRef}
            className="relative isolate aspect-[352/300] overflow-hidden rounded-carte bg-brume"
            style={nomTransition ? { viewTransitionName: nomTransition, viewTransitionClass: "couverture" } as CSSProperties : undefined}
          >
            <Aura
              couleur={domaine.couleur}
              flou="douce"
              amplitude={0.3}
              suivi={suivi}
              className="top-1/2 left-1/2 size-[260px] -translate-1/2 transition-[scale] duration-240 ease-rw group-hover:scale-[1.31]"
            />
            <motion.span
              aria-hidden
              style={{ y: yInitiale }}
              className="absolute inset-x-0 top-2.5 text-center font-serif text-[min(300px,85cqw)] leading-[0.85] tracking-[-0.03em] italic opacity-92 transition-[translate] duration-240 ease-rw group-hover:-translate-y-4"
            >
              {initiale ?? titre.charAt(0)}
            </motion.span>
            {image && <MediaCouverture src={image} video={video} alt={titre} />}
            <span className="verre-pill t-cote-s absolute top-3.5 left-3.5 flex h-[30px] max-w-[calc(100%-28px)] items-center truncate rounded-pill px-[15px]">
              {pastille || domaine.nom}
            </span>
            {actif && <Reflet style={reflet} />}
          </div>

          <p className="t-cote-s mt-6 truncate text-graphite">{meta}</p>
          <div className="mt-1.5 flex items-start justify-between gap-2">
            {/* Taille suivant la largeur de la fiche — à 400 px : 40 px, 30 px pour les titres longs (Teenage Engineering),
                24 px au-delà de 30 caractères (titres de films). Jamais coupé : un titre trop long passe à la ligne. */}
            <h3 className="t-titre-l min-w-0 pb-[0.06em]" style={{ fontSize: tailleTitreFiche(titre) }}>
              {titre}
            </h3>
            <span
              className={cn(
                "grid size-12 shrink-0 place-items-center rounded-pill border border-encre text-encre",
                "transition-colors duration-240 ease-rw group-hover:border-signal group-hover:bg-signal group-hover:text-blanc",
              )}
            >
              <FlecheSurvol taille={20} />
            </span>
          </div>
          {/* min-h : deux lignes réservées, toutes les fiches ont la même hauteur */}
          <p className="t-texte-s mt-1 line-clamp-2 min-h-[3em] max-w-[300px] text-carbone">{description}</p>
        </div>
      </div>
      </motion.div>
    </Racine>
  );
}

/** « TOP n°12 · LETTERBOXD » — dans un style t-cote (capitales), le « n° » reste en bas de casse */
export function RangFilm({ rang }: { rang: number }) {
  return (
    <>
      Top <span className="normal-case">n°</span>
      {rang} · Letterboxd
    </>
  );
}

/** Fiche d'une marque de l'archive → lien vers /marque/:slug */
export function Fiche({ marque, className }: { marque: Marque; className?: string }) {
  const domaine = DOMAINES[marque.domaine];
  return (
    <FicheDossier
      href={lienMarque(marque.slug)}
      onglet={marque.cote}
      domaine={domaine}
      meta={metaMarque(marque)}
      titre={marque.nom}
      description={marque.description}
      image={marque.image}
      video={marque.video}
      pastille={marque.etiquette}
      nomTransition={`couverture-${marque.slug}`}
      className={className}
    />
  );
}
