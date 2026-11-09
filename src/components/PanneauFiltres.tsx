import { useEffect, useRef } from "react";
import { DOMAINES, type DomaineId } from "../data/brands";
import {
  CLES_FILTRES,
  COULEURS_OPTIONS,
  EPOQUES,
  FAMILLES,
  PRIX,
  TITRES_FILTRES,
  type CleFiltre,
  type Option,
  type Selection,
} from "../data/filtres";
import { cn } from "../lib/cn";
import { lenis } from "../lib/mouvement";
import { Bouton } from "./Bouton";
import { Icone } from "./Icone";

type PanneauFiltresProps = {
  ouvert: boolean;
  onFermer: () => void;
  domaine: DomaineId | null;
  selection: Selection;
  /** Pays présents dans les résultats de base, du plus fréquent au plus rare */
  pays: string[];
  /** Nombre de marques par valeur, compte tenu des AUTRES filtres actifs */
  comptes: Record<CleFiltre, Record<string, number>>;
  total: number;
  onBasculer: (cle: CleFiltre, valeur: string) => void;
  onEffacer: () => void;
};

// Panneau « Filtres » à la Zalando : tiroir à droite (plein écran sur mobile), options cochables avec compteur,
// bouton « Voir N marques » en pied. Les valeurs sans résultat restent visibles mais grisées.
export function PanneauFiltres({
  ouvert,
  onFermer,
  domaine,
  selection,
  pays,
  comptes,
  total,
  onBasculer,
  onEffacer,
}: PanneauFiltresProps) {
  const panneauRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    document.documentElement.style.overflow = "hidden";
    lenis.arreter();
    const surTouche = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", surTouche);
    panneauRef.current?.focus();
    return () => {
      document.documentElement.style.overflow = "";
      lenis.reprendre();
      window.removeEventListener("keydown", surTouche);
    };
  }, [ouvert]);

  const nbActifs = CLES_FILTRES.reduce((n, k) => n + selection[k].length, 0);

  // Familles : celles de l'univers choisi, sinon toutes, regroupées par univers
  const groupesFamilles: { titre?: string; options: Option[] }[] =
    domaine && domaine !== "film"
      ? [{ options: FAMILLES[domaine] }]
      : (Object.keys(FAMILLES) as (keyof typeof FAMILLES)[]).map((d) => ({
          titre: DOMAINES[d].nom,
          options: FAMILLES[d],
        }));

  const options: Record<Exclude<CleFiltre, "famille">, Option[]> = {
    pays: pays.map((p) => ({ id: p, label: p })),
    epoque: EPOQUES,
    couleur: COULEURS_OPTIONS,
    prix: PRIX,
  };

  const listeOptions = (cle: CleFiltre, liste: Option[]) => (
    <ul className="flex flex-wrap gap-2">
      {liste.map((o) => {
        const actif = selection[cle].includes(o.id);
        const n = comptes[cle][o.id] ?? 0;
        const vide = n === 0 && !actif;
        return (
          <li key={o.id}>
            <button
              type="button"
              aria-pressed={actif}
              disabled={vide}
              onClick={() => onBasculer(cle, o.id)}
              className={cn(
                "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-pill border py-2 pr-3.5 pl-3 transition-colors duration-240 ease-rw",
                actif
                  ? "border-encre bg-encre text-papier"
                  : "border-encre/12 bg-blanc text-encre hover:border-encre",
                vide && "cursor-not-allowed opacity-35 hover:border-encre/12",
              )}
            >
              {o.teinte && (
                <span
                  aria-hidden
                  className="size-3.5 rounded-full border border-encre/15"
                  style={{ background: o.teinte }}
                />
              )}
              <span className="t-cote-s">{o.label}</span>
              <span
                className={cn(
                  "t-cote-s",
                  actif ? "text-papier/70" : "text-graphite",
                )}
              >
                {n}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div
      aria-hidden={!ouvert}
      className={cn(
        "fixed inset-0 z-[60] transition-[visibility] duration-300",
        ouvert ? "visible" : "invisible",
      )}
    >
      {/* Voile */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="Fermer les filtres"
        onClick={onFermer}
        className={cn(
          "absolute inset-0 cursor-default bg-encre/30 transition-opacity duration-300 ease-rw",
          ouvert ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        ref={panneauRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filtres"
        tabIndex={-1}
        data-lenis-prevent
        className={cn(
          "absolute inset-y-0 right-0 flex w-full flex-col bg-papier shadow-levee outline-none transition-transform duration-400 ease-rw sm:w-[440px] sm:rounded-l-dossier",
          ouvert ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex items-center justify-between border-b border-encre/10 px-6 py-5">
          <p className="t-titre-s">
            Filtres
            {nbActifs > 0 && <span className="text-signal"> · {nbActifs}</span>}
          </p>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="grid size-11 cursor-pointer place-items-center rounded-pill transition-colors duration-240 ease-rw hover:bg-blanc"
          >
            <Icone nom="fermer" taille={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6">
          {CLES_FILTRES.map((cle) => (
            <section
              key={cle}
              className="border-b border-encre/10 pb-7 not-first:pt-7 last:border-0"
            >
              <h3 className="t-cote-m mb-4">
                {TITRES_FILTRES[cle]}
                {selection[cle].length > 0 && (
                  <span className="text-signal">
                    {" "}
                    · {selection[cle].length}
                  </span>
                )}
              </h3>
              {cle === "famille" ? (
                <div className="flex flex-col gap-5">
                  {groupesFamilles.map((g) => (
                    <div key={g.titre ?? "famille"}>
                      {g.titre && (
                        <p className="t-cote-s mb-2.5 text-graphite">
                          {g.titre}
                        </p>
                      )}
                      {listeOptions(cle, g.options)}
                    </div>
                  ))}
                </div>
              ) : (
                listeOptions(cle, options[cle])
              )}
              {cle === "prix" && (
                <p className="t-cote-s mt-4 text-graphite normal-case">
                  Gamme estimée par la rédaction, à titre indicatif.
                </p>
              )}
              {cle === "couleur" && (
                <p className="t-cote-s mt-4 text-graphite normal-case">
                  Teinte dominante de l'image de la fiche.
                </p>
              )}
            </section>
          ))}
        </div>

        <footer className="flex items-center justify-between gap-4 border-t border-encre/10 px-6 py-5">
          <button
            type="button"
            onClick={onEffacer}
            disabled={nbActifs === 0}
            className="t-cote-m cursor-pointer underline-offset-4 transition-colors duration-240 ease-rw hover:text-signal disabled:cursor-default disabled:text-graphite/60 disabled:hover:text-graphite/60"
          >
            Tout effacer
          </button>
          <Bouton type="encre" onClick={onFermer}>
            {total === 0
              ? "Aucune marque"
              : `Voir ${total} marque${total > 1 ? "s" : ""}`}
          </Bouton>
        </footer>
      </div>
    </div>
  );
}
