import { motion } from "motion/react";
import type { Domaine as DomaineData } from "../data/brands";
import { cn } from "../lib/cn";
import { lienDomaine } from "../lib/liens";
import { useCarteInteractive } from "../lib/mouvement";
import { Aura } from "./Aura";
import { Compteur } from "./Compteur";
import { FlecheSurvol } from "./Icone";
import { Reflet } from "./Reflet";

type DomaineProps = {
  domaine: DomaineData;
  compte: number;
  className?: string;
};

// Domaine — survol : l'aura se dilate et suit le curseur, le signal s'allume, le verre monte,
// tilt 3D (max 6°) et reflet lumineux sur le verre
export function Domaine({ domaine, compte, className }: DomaineProps) {
  const t = "duration-240 ease-rw";
  const { handlers, suivi, tilt, reflet, actif } = useCarteInteractive({ amplitudeAura: 0.5 });
  return (
    // @container : la hauteur et le mot en serif suivent la largeur de la tuile (460 px dès 368 px de large)
    <a href={lienDomaine(domaine.id)} {...handlers} className={cn("group @container relative block w-full rounded-[32px]", className)}>
      <motion.div
        style={tilt}
        className="relative isolate h-[clamp(340px,125cqw,460px)] overflow-hidden rounded-[32px] bg-brume will-change-transform"
      >
        <Aura
          couleur={domaine.couleur}
          flou="douce"
          amplitude={0.4}
          suivi={suivi}
          className={cn("top-10 -left-10 size-[380px] transition-[scale,translate]", t, "group-hover:translate-x-2.5 group-hover:-translate-y-5 group-hover:scale-[1.42]")}
        />
        <Aura
          couleur="var(--color-signal)"
          flou="douce"
          amplitude={0.4}
          className={cn("top-[180px] left-[150px] size-[200px] opacity-0 transition-[scale,translate,opacity]", t, "group-hover:-translate-y-[30px] group-hover:scale-[1.3] group-hover:opacity-90")}
        />

        <span className="t-cote-m absolute top-7 left-7">{domaine.numero}</span>
        <span
          aria-hidden
          className={cn("absolute top-[min(110px,30cqw)] left-6 font-serif text-[min(110px,30cqw)] leading-[0.9] tracking-[-0.02em] lowercase italic opacity-90 transition-[translate,opacity]", t, "group-hover:-translate-y-3.5 group-hover:opacity-100")}
        >
          {domaine.id}
        </span>

        {/* Panneau en flux (et non en absolu) : une description plus haute en mobile (16 px) le fait grandir vers le haut */}
        <div className={cn("verre absolute inset-x-4 bottom-4 flex min-h-[148px] flex-col overflow-hidden rounded-[24px] px-[21px] pt-[17px] pb-[17px] transition-[translate]", t, "group-hover:-translate-y-5")}>
          {actif && <Reflet style={reflet} className="-mt-[296px] -ml-4" />}
          <h3 className="t-titre-l pr-14">{domaine.nom}</h3>
          <p className="t-texte-s mt-2.5 max-w-[200px] text-carbone">{domaine.description}</p>
          <p className="t-cote-s mt-auto pt-2 text-graphite">
            <Compteur valeur={compte} chiffres={3} /> entrées
          </p>
          <span
            className={cn("absolute top-[17px] right-[19px] grid size-11 place-items-center rounded-pill bg-blanc text-encre transition-colors", t, "group-hover:bg-encre group-hover:text-blanc")}
          >
            <FlecheSurvol />
          </span>
        </div>
      </motion.div>
    </a>
  );
}
