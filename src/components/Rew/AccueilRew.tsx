import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "motion/react";
import HOME from "../../data/rew-home.json";
import { cn } from "../../lib/cn";
import { carteParId } from "../../lib/rew/cartes";
import { LONGUEUR_MAX, rew } from "../../lib/rew/client";
import type { CarteRew as Carte } from "../../lib/rew/types";
import { FlecheSurvol } from "../Icone";
import { CarteRew, Orbe } from "./CarteRew";

const PHRASE =
  "Ton curateur culturel : dis-lui ce que tu aimes, il te trouve quoi découvrir.";

/**
 * Bandeau noir « Parle à REW » (maquette 1156:902), sous les deux boutons du panneau d'accueil.
 * La phrase alterne toutes les 4 s avec des exemples ; un clic pendant un exemple l'écrit dans le champ, sans l'envoyer.
 */
export function BandeauRew({ className }: { className?: string }) {
  const reduit = useReducedMotion();
  const [i, setI] = useState(-1); // -1 = phrase de présentation
  useEffect(() => {
    if (reduit) return;
    const t = setInterval(
      () => setI((x) => (x + 1 >= HOME.bandeau.length ? -1 : x + 1)),
      4000,
    );
    return () => clearInterval(t);
  }, [reduit]);
  const exemple = i >= 0 ? HOME.bandeau[i] : null;

  return (
    <button
      type="button"
      onClick={() => rew.ouvrir(exemple ? { texte: exemple } : {})}
      aria-label={
        exemple
          ? `Parle à REW — exemple : ${exemple}`
          : "Parle à REW, ton curateur culturel"
      }
      className={cn(
        "group relative isolate flex min-h-[72px] w-full cursor-pointer items-center gap-4 overflow-hidden rounded-pill bg-encre py-3 pr-3 pl-3 text-left text-papier transition-transform duration-300 ease-rw hover:scale-[1.01] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-signal md:min-h-[100px] md:gap-5 md:pr-4 md:pl-4",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute -top-10 -left-8 -z-10 h-40 w-56 rounded-full bg-aura-mode/55 blur-[50px]"
      />
      <span
        aria-hidden
        className="absolute -right-10 -bottom-14 -z-10 h-44 w-72 rounded-full bg-aura-digital/45 blur-[60px]"
      />
      <span className="grid shrink-0 place-items-center">
        <Orbe
          taille={52}
          className="md:size-[68px]! group-hover:[animation-duration:2.5s]"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[26px] leading-none font-extrabold tracking-[-0.04em] md:text-[34px]">
          Parle à REW
        </span>
        <span
          key={i}
          className={cn(
            "mt-1.5 block text-[13px] leading-[1.35] text-papier/80 md:text-[15px]",
            !reduit && "rew-fondu",
          )}
        >
          {exemple ? `« ${exemple} »` : PHRASE}
        </span>
      </span>
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-blanc text-encre transition-transform duration-300 ease-rw group-hover:translate-x-1 md:size-[58px]">
        <FlecheSurvol taille={22} />
      </span>
    </button>
  );
}

/** Tire une entrée par catégorie (film, marque, musique) : les cartes changent à chaque visite */
function tirage(): Carte[] {
  const un = <T,>(l: T[]) => l[Math.floor(Math.random() * l.length)];
  return [
    un(HOME.cartes.cinema),
    un(HOME.cartes.marque),
    un(HOME.cartes.musique),
  ]
    .map((c) => carteParId(c.id, c.raison))
    .filter((c): c is Carte => !!c);
}

/** Box noire REW (maquette 1156:958), juste après le mur d'images */
export function BoxRew() {
  const reduit = useReducedMotion();
  const [texte, setTexte] = useState("");
  const [visible, setVisible] = useState(false);
  const [survol, setSurvol] = useState<number | null>(null);
  // Tirage côté navigateur seulement (le HTML prérendu n'a pas de cartes, pas de décalage d'hydratation)
  const [cartes, setCartes] = useState<Carte[]>([]);
  useEffect(() => setCartes(tirage()), []);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (reduit || !ref.current) return setVisible(true);
    const o = new IntersectionObserver(
      ([e]) => e.isIntersecting && (setVisible(true), o.disconnect()),
      { threshold: 0.2 },
    );
    o.observe(ref.current);
    return () => o.disconnect();
  }, [reduit]);

  // Éventail : rotation et décalage de chaque carte ; la carte survolée se redresse et passe devant
  const pose = (i: number): CSSProperties => {
    const base = [
      { r: -4, x: 10, y: 0 },
      { r: 3, x: -8, y: 0 },
      { r: -2, x: 14, y: 0 },
    ][i];
    const ouvert = survol !== null;
    const actif = survol === i;
    return {
      transform: reduit
        ? undefined
        : `rotate(${actif ? 0 : base.r * (ouvert ? 1.4 : 1)}deg) translateX(${base.x}px) ${actif ? "scale(1.03)" : ""}`,
      zIndex: actif ? 10 : i + 1,
      opacity: visible ? 1 : 0,
      transition: reduit
        ? undefined
        : `transform 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.6s ease ${i * 80 + 150}ms`,
    };
  };

  return (
    <section
      ref={ref}
      aria-labelledby="rew-box-titre"
      className="px-(--marge) pt-10 md:pt-16"
    >
      <div
        className={cn(
          "relative isolate mx-auto grid max-w-[1280px] gap-10 overflow-hidden rounded-[32px] bg-encre px-6 py-10 text-papier transition-opacity duration-700 md:rounded-[44px] md:px-12 md:py-14 lg:grid-cols-2 lg:gap-8",
          visible ? "opacity-100" : "opacity-0",
        )}
      >
        <span
          aria-hidden
          className="absolute -bottom-40 -left-20 -z-10 size-[460px] rounded-full bg-aura-mode/35 blur-[110px]"
        />
        <span
          aria-hidden
          className="absolute -top-40 right-0 -z-10 size-[460px] rounded-full bg-aura-digital/30 blur-[110px]"
        />
        <span
          aria-hidden
          className="absolute right-[-80px] bottom-[-120px] -z-10 size-[360px] rounded-full bg-signal/35 blur-[110px]"
        />

        <div className="flex min-w-0 flex-col">
          <h2
            id="rew-box-titre"
            className="font-display text-[clamp(96px,22vw,230px)] leading-[0.8] font-extrabold tracking-[-0.07em] text-papier"
          >
            REW
          </h2>
          <p className="mt-4 font-serif text-[30px] leading-none italic md:text-[38px]">
            Your cultural curator.
          </p>
          <p className="mt-5 max-w-[480px] text-[16px] leading-[1.5] text-papier/80 md:text-[18px]">
            Mode, design, musique, cinéma : dis-lui ce que tu aimes, il cherche
            dans l'archive et te ramène ce qui vaut le coup.
          </p>
          <ul className="-mx-6 mt-7 flex gap-2.5 overflow-x-auto px-6 pb-1 [scrollbar-width:none] md:mx-0 md:flex-col md:items-start md:overflow-visible md:px-0">
            {HOME.pastilles.map((p, i) => (
              <li key={p} className="shrink-0">
                <button
                  type="button"
                  onClick={() => rew.ouvrir({ texte: p, envoyer: true })}
                  className={cn(
                    "cursor-pointer rounded-pill px-4 py-2.5 text-[14px] whitespace-nowrap transition-colors duration-240 ease-rw md:text-[15px]",
                    i === 0
                      ? "bg-papier text-encre hover:bg-blanc"
                      : "border border-papier/30 bg-papier/12 text-papier hover:bg-papier hover:text-encre",
                  )}
                >
                  « {p} »
                </button>
              </li>
            ))}
          </ul>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (texte.trim()) {
                rew.ouvrir({ texte, envoyer: true });
                setTexte("");
              }
            }}
            className="mt-8 flex h-[60px] max-w-[540px] items-center gap-2 rounded-pill bg-papier pr-1.5 pl-5 text-encre focus-within:outline-3 focus-within:outline-signal md:h-[68px]"
          >
            <label htmlFor="rew-box-champ" className="sr-only">
              Dis à REW ce que tu cherches
            </label>
            <input
              id="rew-box-champ"
              value={texte}
              maxLength={LONGUEUR_MAX}
              onChange={(e) => setTexte(e.target.value)}
              placeholder="Dis à REW ce que tu cherches…"
              className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-graphite md:text-[17px]"
            />
            <button
              type="submit"
              aria-label="Envoyer à REW"
              className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-full bg-encre text-papier transition-colors duration-240 ease-rw hover:bg-signal md:size-[54px]"
            >
              <span aria-hidden className="text-[20px] leading-none">
                ↑
              </span>
            </button>
          </form>
        </div>

        {/* Cartes en éventail (pile décalée en mobile) */}
        <ul
          className="flex flex-col justify-center gap-3 lg:gap-0 lg:pl-6"
          onMouseLeave={() => setSurvol(null)}
        >
          {cartes.map((c, i) => (
            <li
              key={c.id}
              className="relative lg:-my-1"
              style={pose(i)}
              onMouseEnter={() => setSurvol(i)}
              onFocus={() => setSurvol(i)}
            >
              <CarteRew
                carte={c}
                ton={i === 2 ? "clair" : "sombre"}
                compacte
                className={cn(i !== 2 && "bg-[#1d1d1b]/85")}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
