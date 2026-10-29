import { useEffect, useRef } from "react";
import { DOMAINES, TOTAL_ENTREES } from "../data/brands";
import { cn } from "../lib/cn";
import { LIENS, lienDomaine } from "../lib/liens";
import { lenis } from "../lib/mouvement";
import { AuraAnimee } from "./Aura";
import { Filtre } from "./Filtre";
import { Icone } from "./Icone";
import { Logo } from "./Logo";

const ENTREES = [
  { label: "Index", href: LIENS.index, compteur: String(TOTAL_ENTREES) },
  { label: "Domaines", href: LIENS.domaines, compteur: String(Object.keys(DOMAINES).length).padStart(2, "0") },
  { label: "Manifeste", href: LIENS.manifeste, compteur: "—" },
  { label: "Contact", href: LIENS.contact, compteur: "@" },
];

type MenuProps = {
  ouvert: boolean;
  onFermer: () => void;
};

// Menu — overlay plein écran : auras qui respirent sous un voile de verre, liens en Display.
export function Menu({ ouvert, onFermer }: MenuProps) {
  const fermerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    const precedent = document.activeElement as HTMLElement | null;
    fermerRef.current?.focus();
    document.documentElement.style.overflow = "hidden";
    lenis.arreter();
    const surTouche = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", surTouche);
    return () => {
      document.documentElement.style.overflow = "";
      lenis.reprendre();
      window.removeEventListener("keydown", surTouche);
      precedent?.focus();
    };
  }, [ouvert, onFermer]);

  // Pendant l'ouverture, les auras du menu accélèrent (×5) puis reviennent à leur rythme en ~1 s
  const racineRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ouvert || !racineRef.current) return;
    const anims = Array.from(racineRef.current.querySelectorAll(".aura-derive")).flatMap((el) => el.getAnimations());
    const paliers = [5, 3.5, 2.2, 1.5, 1];
    const minuteurs = paliers.map((vitesse, i) =>
      window.setTimeout(() => anims.forEach((a) => a.updatePlaybackRate(vitesse)), i * 220),
    );
    return () => {
      minuteurs.forEach(clearTimeout);
      anims.forEach((a) => a.updatePlaybackRate(1));
    };
  }, [ouvert]);

  // Ouverture : fondu 240 ms, les lignes montent en cascade
  const entree = (i: number) => ({
    className: cn(
      "transition-[opacity,translate] duration-[480ms] ease-rw",
      ouvert ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
    ),
    style: { transitionDelay: ouvert ? `${60 + i * 50}ms` : "0ms" },
  });

  return (
    <div
      ref={racineRef}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      inert={!ouvert}
      className={cn(
        "fixed inset-0 z-[60] overflow-y-auto transition-[opacity,visibility] duration-240 ease-rw",
        ouvert ? "visible opacity-100" : "invisible opacity-0",
      )}
    >
      {/* Menu fermé : les auras sont mises en pause (pas d'animation invisible) */}
      <AuraAnimee className={cn("fixed inset-0 -z-10", !ouvert && "[&_.aura-derive]:[animation-play-state:paused]")}>
        <div aria-hidden className="absolute inset-0 bg-papier/15 backdrop-blur-[24px] backdrop-saturate-150" />
      </AuraAnimee>

      <div className="relative mx-auto flex min-h-full w-full max-w-[1440px] flex-col px-6 pt-6 pb-10 md:px-[100px] md:pt-[34px] md:pb-16">
        <div className="flex items-center justify-between">
          <a href="/" onClick={onFermer} aria-label="rework° — accueil" className="pl-3 md:pl-2.5">
            <Logo className="text-[26px] md:text-[30px]" />
          </a>
          <button
            ref={fermerRef}
            type="button"
            onClick={onFermer}
            aria-label="Fermer le menu"
            className="grid size-12 cursor-pointer place-items-center rounded-pill bg-encre text-papier transition-colors duration-240 ease-rw hover:bg-signal md:size-14"
          >
            <Icone nom="fermer" taille={24} className="size-[22px] md:size-6" />
          </button>
        </div>

        <div className="mt-16 grid flex-1 gap-14 md:mt-[72px] lg:grid-cols-[1fr_340px]">
          <nav aria-label="Sections">
            <ul className="flex flex-col gap-5 md:gap-7">
              {ENTREES.map((e, i) => (
                <li key={e.label} {...entree(i)}>
                  <a
                    href={e.href}
                    onClick={onFermer}
                    className="group inline-flex items-start gap-2.5 text-encre md:gap-5"
                  >
                    <span className="font-display text-[clamp(44px,14vw,132px)] leading-[0.9] font-extrabold tracking-[-0.04em] [font-variation-settings:'opsz'_96] transition-colors duration-240 ease-rw group-hover:text-signal md:leading-[0.88] md:tracking-[-0.05em]">
                      {e.label}
                    </span>
                    <span className="t-cote-s md:t-cote-m text-signal">{e.compteur}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col lg:pt-[30px]">
            <div {...entree(4)}>
              <p className="t-cote-m hidden lg:block">/ domaines</p>
              <ul className="flex max-w-[300px] flex-wrap gap-x-[11px] gap-y-3 lg:mt-5 lg:flex-col lg:items-start lg:gap-4">
                {Object.values(DOMAINES).map((d) => (
                  <li key={d.id}>
                    <Filtre ton="blanc" href={lienDomaine(d.id)} onClick={onFermer} label={d.nom} compte={d.entrees} couleur={d.couleur} />
                  </li>
                ))}
              </ul>
            </div>

            <div {...entree(5)} className={cn(entree(5).className, "mt-12 lg:mt-[50px]")}>
              <p className="t-cote-m hidden lg:block">/ au hasard</p>
              <a
                href={LIENS.hasard}
                className="t-serif-s mt-2 inline-block text-encre transition-colors duration-240 ease-rw hover:text-signal"
              >
                Ouvrir une fiche au hasard →
              </a>
            </div>

            <p className="t-cote-m mt-auto hidden pt-16 lg:block">Instagram · Are.na · Twitter</p>
          </div>
        </div>

        <p className="t-cote-s mt-16 text-carbone">
          48°51′N 2°21′E — Paris<span className="hidden md:inline"> — R°{TOTAL_ENTREES}</span>
        </p>
      </div>
    </div>
  );
}
