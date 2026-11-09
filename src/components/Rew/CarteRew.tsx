import type { CSSProperties } from "react";
import { cn } from "../../lib/cn";
import { NOMS_UNIVERS, type CarteRew as Carte } from "../../lib/rew/types";
import { MediaCouverture } from "../MediaCouverture";

/** Petite orbe dégradée de REW (rose → bleu → vert), en rotation lente sauf en mouvement réduit */
export function Orbe({
  taille = 14,
  className,
  rapide,
}: {
  taille?: number;
  className?: string;
  rapide?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "rew-orbe inline-block shrink-0 rounded-full",
        rapide && "rew-orbe-rapide",
        className,
      )}
      style={{ width: taille, height: taille } as CSSProperties}
    />
  );
}

/**
 * Carte REW (maquette 1156:958) : visuel à gauche, univers · info, nom, « Pourquoi : … » en Instrument Serif italique,
 * bouton vers le lien officiel (masqué s'il manque) et lien vers la fiche rework°.
 */
export function CarteRew({
  carte,
  ton = "clair",
  className,
  style,
  compacte,
}: {
  carte: Carte;
  ton?: "clair" | "sombre";
  className?: string;
  style?: CSSProperties;
  compacte?: boolean;
}) {
  const sombre = ton === "sombre";
  return (
    <article
      className={cn(
        "group/carte relative flex gap-4 rounded-[22px] border p-3 pr-4 transition-[box-shadow,translate,background-color] duration-240 ease-rw",
        sombre
          ? "border-papier/15 bg-papier/8 text-papier backdrop-blur-md"
          : "border-encre/8 bg-blanc text-encre shadow-repos hover:shadow-levee",
        className,
      )}
      style={style}
    >
      <a
        href={carte.fiche}
        tabIndex={-1}
        aria-hidden
        className={cn(
          "relative block shrink-0 overflow-hidden rounded-[16px] bg-brume",
          compacte ? "size-[76px] sm:size-[104px]" : "size-[112px] sm:size-[128px]",
        )}
      >
        {carte.image ? (
          <MediaCouverture src={carte.image} video={carte.video} alt="" />
        ) : (
          <span className="grid size-full place-items-center font-serif text-[64px] italic">
            {carte.nom.charAt(0)}
          </span>
        )}
      </a>
      <div className="flex min-w-0 flex-1 flex-col">
        <p
          className={cn(
            "t-cote-s truncate",
            sombre ? "text-papier/65" : "text-graphite",
          )}
        >
          {NOMS_UNIVERS[carte.univers]}
          {carte.info && ` · ${carte.info}`}
        </p>
        <h4
          className="mt-1 font-display text-[21px] leading-[1.05] font-bold tracking-[-0.02em]"
          translate="no"
        >
          <a
            href={carte.fiche}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {carte.nom}
          </a>
        </h4>
        {carte.raison && (
          <p
            className={cn(
              "mt-1.5 font-serif text-[17px] leading-[1.2] italic",
              sombre ? "text-papier/90" : "text-carbone",
            )}
          >
            Pourquoi : {carte.raison}
          </p>
        )}
        {!compacte && carte.description && (
          <p
            className={cn(
              "t-texte-s mt-1.5 line-clamp-2",
              sombre ? "text-papier/60" : "text-graphite",
            )}
          >
            {carte.description}
          </p>
        )}
        <div className="relative z-10 mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3">
          {carte.action && (
            <a
              href={carte.action.url}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "t-cote-s inline-flex min-h-9 items-center rounded-pill px-3.5 transition-colors duration-240 ease-rw",
                sombre
                  ? "bg-papier text-encre hover:bg-signal hover:text-blanc"
                  : "bg-encre text-papier hover:bg-signal hover:text-blanc",
              )}
            >
              {carte.action.label}
            </a>
          )}
          <a
            href={carte.fiche}
            className={cn(
              "t-cote-s py-2 underline-offset-4 hover:underline",
              sombre ? "text-papier/75" : "text-graphite hover:text-encre",
            )}
          >
            Voir la fiche rework°
          </a>
        </div>
      </div>
    </article>
  );
}
