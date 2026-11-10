import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "../../lib/cn";
import {
  LONGUEUR_MAX,
  MESSAGES_ERREUR,
  rew,
  texteAttente,
  useRew,
  type Tour,
} from "../../lib/rew/client";
import { NOMS_UNIVERS } from "../../lib/rew/types";
import { lenis } from "../../lib/mouvement";
import { Icone } from "../Icone";
import { CarteRew, Orbe } from "./CarteRew";

export const ACCUEIL_REW =
  "Salut, moi c'est REW. Tu cherches quelque chose de précis, un nouvel artiste, ou ta prochaine obsession ? Dis-moi ce que tu aimes, je te trouve les références qui valent le coup.";
const SUGGESTIONS = [
  "Trouver un cadeau",
  "Découvrir des marques",
  "Mon prochain album",
  "Soirée film",
  "Explorer une esthétique",
];

function Bulle({
  children,
  moi,
}: {
  children: ReactNode;
  moi?: boolean;
}) {
  return (
    <div
      className={cn(
        "rew-apparition max-w-[88%] rounded-[20px] px-4 py-3 text-[15px] leading-[1.45]",
        moi
          ? "self-end rounded-br-[6px] bg-encre text-papier"
          : "self-start rounded-bl-[6px] bg-blanc text-carbone shadow-repos",
      )}
    >
      {children}
    </div>
  );
}

function TourRew({ tour, dernier }: { tour: Tour; dernier: boolean }) {
  if (tour.role === "user") return <Bulle moi>{tour.texte}</Bulle>;
  if (tour.role === "erreur")
    return (
      <div className="rew-apparition flex flex-col items-start gap-3 self-start rounded-[20px] border border-signal/30 bg-blanc px-4 py-3">
        <p className="text-[15px] leading-[1.45] text-carbone">
          {MESSAGES_ERREUR[tour.code]}
        </p>
        {dernier && !["limite", "trop-long", "refus"].includes(tour.code) && (
          <button
            type="button"
            onClick={() => rew.reessayer()}
            className="t-cote-s cursor-pointer rounded-pill bg-encre px-4 py-2 text-papier transition-colors duration-240 ease-rw hover:bg-signal"
          >
            Réessayer
          </button>
        )}
      </div>
    );
  const r = tour.reponse;
  let carte = 0;
  return (
    <div className="flex flex-col gap-4">
      {r.message && <Bulle>{r.message}</Bulle>}
      {r.sections.map((s, i) => (
        <section key={s.univers} className="flex flex-col gap-2.5">
          <h3 className="t-cote-s text-signal">
            {String(i + 1).padStart(2, "0")} — {NOMS_UNIVERS[s.univers]}
          </h3>
          {s.cartes.map((c) => (
            <CarteRew
              key={c.id}
              carte={c}
              className="rew-apparition"
              style={{ animationDelay: `${carte++ * 80}ms` } as CSSProperties}
            />
          ))}
        </section>
      ))}
      {(r.conclusion || r.question) && (
        <Bulle>{[r.conclusion, r.question].filter(Boolean).join(" ")}</Bulle>
      )}
    </div>
  );
}

/** Attente : le texte suit l'avancement réel (lecture, recherche, rédaction, relance) pour ne jamais sembler figé */
function Attente({ debut, essai, long }: { debut: number; essai: number; long: boolean }) {
  const [maintenant, setMaintenant] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <p
      className="rew-apparition flex items-center gap-2.5 self-start text-[15px] text-graphite"
      role="status"
    >
      <Orbe taille={18} rapide />
      {texteAttente(maintenant - debut, essai, long)}
      <span className="rew-points" aria-hidden>
        <span>.</span>
        <span>.</span>
        <span>.</span>
      </span>
    </p>
  );
}

// Panneau REW : à droite (≈ 480 px) sur desktop, plein écran sur mobile. URL /rew, Échap ou retour = fermer, focus piégé.
export function PanneauRew() {
  const { ouvert, tours, enCours, essai, debut, long, brouillon, ouverture } =
    useRew();
  const panneauRef = useRef<HTMLDivElement>(null);
  const champRef = useRef<HTMLTextAreaElement>(null);
  const filRef = useRef<HTMLDivElement>(null);
  const declencheur = useRef<Element | null>(null);

  useEffect(() => {
    if (!ouvert) return;
    declencheur.current = document.activeElement;
    document.documentElement.style.overflow = "hidden";
    lenis.arreter();
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") rew.fermer();
      if (e.key !== "Tab" || !panneauRef.current) return;
      const focusables = panneauRef.current.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), textarea, input",
      );
      const premier = focusables[0];
      const dernier = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === premier) {
        e.preventDefault();
        dernier.focus();
      } else if (!e.shiftKey && document.activeElement === dernier) {
        e.preventDefault();
        premier.focus();
      }
    };
    window.addEventListener("keydown", surTouche);
    return () => {
      document.documentElement.style.overflow = "";
      lenis.reprendre();
      window.removeEventListener("keydown", surTouche);
      (declencheur.current as HTMLElement | null)?.focus?.();
    };
  }, [ouvert]);

  // Chaque ouverture : curseur dans le champ
  useEffect(() => {
    if (ouvert)
      requestAnimationFrame(() =>
        champRef.current?.focus({ preventScroll: true }),
      );
  }, [ouverture]);

  // Nouveau message : on descend en bas du fil
  useEffect(() => {
    filRef.current?.scrollTo({
      top: filRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [tours.length, enCours]);

  const envoyer = () => void rew.envoyer(brouillon);

  return (
    <div
      aria-hidden={!ouvert}
      className={cn(
        "fixed inset-0 z-[70] transition-[visibility] duration-300",
        ouvert ? "visible" : "invisible",
      )}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Fermer REW"
        onClick={() => rew.fermer()}
        className={cn(
          "absolute inset-0 cursor-default bg-encre/30 transition-opacity duration-300 ease-rw",
          ouvert ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        ref={panneauRef}
        role="dialog"
        aria-modal="true"
        aria-label="REW, ton curateur culturel"
        data-lenis-prevent
        className={cn(
          "absolute inset-y-0 right-0 flex w-full flex-col overflow-hidden bg-papier shadow-levee transition-transform duration-400 ease-rw sm:w-[480px] sm:rounded-l-dossier",
          ouvert ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* En-tête noir : orbe, REW, Your cultural curator. */}
        <header className="relative isolate flex items-center gap-3.5 overflow-hidden bg-encre px-5 py-4 text-papier">
          <span
            aria-hidden
            className="absolute -top-16 -left-10 -z-10 size-40 rounded-full bg-aura-mode/45 blur-[60px]"
          />
          <span
            aria-hidden
            className="absolute -right-10 -bottom-20 -z-10 size-44 rounded-full bg-aura-digital/40 blur-[60px]"
          />
          <Orbe taille={38} rapide={enCours} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-[26px] leading-none font-extrabold tracking-[-0.04em]">
              REW
            </p>
            <p className="mt-0.5 font-serif text-[16px] leading-none text-papier/80 italic">
              Your cultural curator.
            </p>
          </div>
          {tours.length > 0 && (
            <button
              type="button"
              onClick={() => rew.nouvelle()}
              className="t-cote-s cursor-pointer rounded-pill border border-papier/25 px-3 py-2 transition-colors duration-240 ease-rw hover:bg-papier hover:text-encre"
            >
              Nouvelle conversation
            </button>
          )}
          <button
            type="button"
            onClick={() => rew.fermer()}
            aria-label="Fermer"
            className="grid size-11 cursor-pointer place-items-center rounded-pill transition-colors duration-240 ease-rw hover:bg-papier/15"
          >
            <Icone nom="fermer" taille={20} />
          </button>
        </header>

        {/* Fil */}
        <div
          ref={filRef}
          aria-live="polite"
          aria-busy={enCours}
          className="flex flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5"
        >
          <Bulle>{ACCUEIL_REW}</Bulle>
          {tours.length === 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Suggestions">
              {SUGGESTIONS.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => void rew.envoyer(s)}
                    className="t-cote-s cursor-pointer rounded-pill border border-encre/15 bg-blanc px-3.5 py-2.5 transition-colors duration-240 ease-rw hover:border-encre"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {tours.map((t, i) => (
            <TourRew key={i} tour={t} dernier={i === tours.length - 1} />
          ))}
          {enCours && <Attente debut={debut} essai={essai} long={long} />}
        </div>

        {/* Saisie */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            envoyer();
          }}
          className="border-t border-encre/10 bg-papier px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-5"
        >
          <div className="flex items-end gap-2 rounded-[26px] border border-encre/15 bg-blanc p-1.5 pl-4 focus-within:border-signal">
            <label htmlFor="rew-champ" className="sr-only">
              Ton message à REW
            </label>
            <textarea
              id="rew-champ"
              ref={champRef}
              rows={1}
              value={brouillon}
              maxLength={LONGUEUR_MAX}
              onChange={(e) => rew.setBrouillon(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  envoyer();
                }
              }}
              placeholder="Dis à REW ce que tu cherches…"
              className="max-h-32 min-h-11 flex-1 resize-none bg-transparent py-2.5 text-[16px] leading-[1.4] outline-none placeholder:text-graphite [field-sizing:content]"
            />
            <button
              type="submit"
              disabled={!brouillon.trim() || enCours}
              aria-label="Envoyer"
              className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-encre text-papier transition-colors duration-240 ease-rw hover:bg-signal disabled:cursor-default disabled:opacity-35 disabled:hover:bg-encre"
            >
              <span aria-hidden className="text-[18px] leading-none">
                ↑
              </span>
            </button>
          </div>
          <p className="mt-2 flex justify-between gap-3 text-[12px] leading-[1.35] text-graphite">
            <span>
              REW est une IA : ses suggestions peuvent se tromper. Tes messages
              ne sont pas conservés.
            </span>
            {brouillon.length > LONGUEUR_MAX - 80 && (
              <span className="shrink-0 tabular-nums">
                {brouillon.length}/{LONGUEUR_MAX}
              </span>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
