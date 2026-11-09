import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSearchParams } from "react-router";
import { Bouton } from "../components/Bouton";
import { Fiche } from "../components/Fiche";
import { Filtre } from "../components/Filtre";
import { Footer } from "../components/Footer";
import { Conteneur } from "../components/Grille";
import { Icone } from "../components/Icone";
import { EnTeteIndex, LigneIndex } from "../components/LigneIndex";
import { Nav } from "../components/Nav";
import { Recherche } from "../components/Recherche";
import {
  DOMAINES,
  MARQUES,
  TOTAL_MARQUES,
  type DomaineId,
  type Marque,
} from "../data/brands";
import { cn } from "../lib/cn";
import { metaIndex } from "../lib/meta";
import { EASE_REVELE, defilerVers } from "../lib/mouvement";
import { useMeta } from "../lib/useMeta";
import { EnTetePage } from "../components/EnTetePage";
import { PanneauFiltres } from "../components/PanneauFiltres";
import {
  CLES_FILTRES,
  FAMILLES,
  attributsDe,
  correspond,
  libelle,
  type CleFiltre,
  type Selection,
} from "../data/filtres";

const PAR_PAGE = 24;

const TRIS = {
  // « récent » = dernières entrées d'abord (plus grand id)
  recent: { label: "récent ↓", trier: (a: Marque, b: Marque) => b.id - a.id },
  nom: {
    label: "A → Z",
    trier: (a: Marque, b: Marque) => a.nom.localeCompare(b.nom, "fr"),
  },
  annee: {
    label: "année ↑",
    trier: (a: Marque, b: Marque) => a.annee - b.annee,
  },
  // Réservé au domaine Film, dont c'est le tri par défaut
  rang: {
    label: "rang Letterboxd ↑",
    trier: (a: Marque, b: Marque) =>
      (a.rang ?? Infinity) - (b.rang ?? Infinity),
  },
} as const;
type Tri = keyof typeof TRIS;
const ORDRE_TRIS_MARQUES: Tri[] = ["recent", "nom", "annee"];
const ORDRE_TRIS_FILMS: Tri[] = ["rang", "recent", "nom", "annee"];

/** Recherche insensible à la casse et aux accents */
const normaliser = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const estDomaine = (v: string | null): v is DomaineId => !!v && v in DOMAINES;

/** « 446 marques et films », « 78 films », « 150 marques · Mode » */
function titreIndex(domaine: DomaineId | null) {
  if (!domaine) return `${TOTAL_MARQUES} marques`;
  const d = DOMAINES[domaine];
  return domaine === "film"
    ? `${d.entrees} films`
    : `${d.entrees} marques · ${d.nom}`;
}

export default function Index() {
  const [params, setParams] = useSearchParams();
  const [limite, setLimite] = useState(PAR_PAGE);
  const rechercheRef = useRef<HTMLDivElement>(null);
  const resultatsRef = useRef<HTMLElement>(null);
  // /index#filtres ouvre directement le panneau (lien partageable)
  const [filtresOuverts, setFiltresOuverts] = useState(
    () => typeof window !== "undefined" && window.location.hash === "#filtres",
  );

  // L'état vit dans l'URL : /index?domaine=mode&q=leica&vue=liste&tri=nom — partageable, et le menu peut y pointer
  // La saisie reste locale (réactive à chaque frappe) ; l'URL suit, sans perdre de caractères
  const [q, setQ] = useState(() => params.get("q") ?? "");
  useEffect(() => {
    if ((params.get("q") ?? "") !== q) majParam("q", q || null);
  }, [q]);
  const domaine = estDomaine(params.get("domaine"))
    ? (params.get("domaine") as DomaineId)
    : null;
  const vue = params.get("vue") === "liste" ? "liste" : "grille";
  const ordreTris = domaine === "film" ? ORDRE_TRIS_FILMS : ORDRE_TRIS_MARQUES;
  const triParDefaut = ordreTris[0];
  const tri: Tri = ordreTris.includes(params.get("tri") as Tri)
    ? (params.get("tri") as Tri)
    : triParDefaut;
  // Filtres avancés (pas sur la page Films) : ?famille=street,outdoor&pays=Japon&prix=1,2
  const avecFiltres = domaine !== "film";
  const selectionUrl = CLES_FILTRES.map((k) => params.get(k) ?? "").join("|");
  const selection = useMemo(
    () =>
      Object.fromEntries(
        CLES_FILTRES.map((k) => [
          k,
          avecFiltres ? (params.get(k) ?? "").split(",").filter(Boolean) : [],
        ]),
      ) as Selection,
    [selectionUrl, avecFiltres],
  );
  const nbFiltres = CLES_FILTRES.reduce((n, k) => n + selection[k].length, 0);

  const majParam = (cle: string, valeur: string | null) => {
    setParams(
      (p) => {
        const suivant = new URLSearchParams(p);
        if (valeur) suivant.set(cle, valeur);
        else suivant.delete(cle);
        return suivant;
      },
      { replace: true },
    );
    setLimite(PAR_PAGE);
  };

  const basculerFiltre = (cle: CleFiltre, valeur: string) => {
    const liste = selection[cle].includes(valeur)
      ? selection[cle].filter((v) => v !== valeur)
      : [...selection[cle], valeur];
    majParam(cle, liste.join(",") || null);
  };

  const effacerFiltres = () => {
    setParams(
      (p) => {
        const suivant = new URLSearchParams(p);
        CLES_FILTRES.forEach((k) => suivant.delete(k));
        return suivant;
      },
      { replace: true },
    );
    setLimite(PAR_PAGE);
  };

  /** Changer d'univers : on garde les filtres, sauf les familles qui n'appartiennent pas au nouvel univers */
  const changerDomaine = (d: DomaineId | null) => {
    setParams(
      (p) => {
        const suivant = new URLSearchParams(p);
        if (d) suivant.set("domaine", d);
        else suivant.delete("domaine");
        if (d && d !== "film") {
          const ids = new Set(FAMILLES[d].map((f) => f.id));
          const gardees = selection.famille.filter((f) => ids.has(f));
          if (gardees.length) suivant.set("famille", gardees.join(","));
          else suivant.delete("famille");
        }
        return suivant;
      },
      { replace: true },
    );
    setLimite(PAR_PAGE);
  };

  // Base = univers + recherche ; les filtres avancés s'appliquent ensuite
  const base = useMemo(() => {
    const termes = normaliser(q.trim()).split(/\s+/).filter(Boolean);
    // Page Marques : tout sauf les films, qui ont leur propre page (?domaine=film)
    return MARQUES.filter((m) =>
      domaine ? m.domaine === domaine : m.domaine !== "film",
    )
      .filter((m) => {
        if (!termes.length) return true;
        const texte = normaliser(
          [m.nom, m.origine, m.etiquette, m.realisation, m.titreOriginal].join(
            " ",
          ),
        );
        return termes.every((t) => texte.includes(t));
      })
      .map((m) => ({ m, a: attributsDe(m) }));
  }, [q, domaine]);

  const resultats = useMemo(
    () =>
      base
        .filter(({ a }) => correspond(a, selection))
        .map(({ m }) => m)
        .sort(TRIS[tri].trier),
    [base, selection, tri],
  );

  // Compteurs du panneau : pour chaque filtre, les marques qui passent tous les AUTRES filtres
  const { comptes, pays } = useMemo(() => {
    const comptes = Object.fromEntries(
      CLES_FILTRES.map((k) => [k, {}]),
    ) as Record<CleFiltre, Record<string, number>>;
    const parPays: Record<string, number> = {};
    for (const { a } of base) {
      if (a.pays) parPays[a.pays] = (parPays[a.pays] ?? 0) + 1;
      for (const k of CLES_FILTRES) {
        if (a[k] && correspond(a, selection, k))
          comptes[k][a[k]] = (comptes[k][a[k]] ?? 0) + 1;
      }
    }
    const pays = Object.keys(parPays).sort(
      (x, y) => parPays[y] - parPays[x] || x.localeCompare(y, "fr"),
    );
    return { comptes, pays };
  }, [base, selection]);

  const affiches = resultats.slice(0, limite);
  const reste = resultats.length - affiches.length;

  useMeta(metaIndex(domaine));

  // Arrivée via « Chercher » / ⌘K depuis une autre page : /index#recherche
  useEffect(() => {
    if (window.location.hash === "#recherche")
      rechercheRef.current?.querySelector("input")?.focus();
    // Arrivée depuis la recherche de l'accueil (Entrée) : on descend jusqu'aux résultats
    if (window.location.hash === "#resultats")
      requestAnimationFrame(() => voirResultats());
  }, []);

  /** Entrée dans la recherche : défilement doux jusqu'aux résultats (le clavier mobile se referme) */
  const voirResultats = () => {
    rechercheRef.current?.querySelector("input")?.blur();
    defilerVers(resultatsRef.current, -110);
  };

  const allerARecherche = () => {
    defilerVers(rechercheRef.current, -window.innerHeight / 3);
    rechercheRef.current
      ?.querySelector("input")
      ?.focus({ preventScroll: true });
  };

  return (
    <>
      <Nav onChercher={allerARecherche} />

      <main className="overflow-x-clip">
        {/* ── En-tête ── */}
        <EnTetePage
          pastille="Mis à jour chaque semaine"
          titre={titreIndex(domaine)}
          texte={
            domaine === "film"
              ? "Cherchez par titre, réalisateur ou pays."
              : "Cherchez par nom, ville ou catégorie, ou choisissez un univers."
          }
        >
          {/* Recherche · vue · tri */}
          {/* Recherche et commandes sur une ligne dès lg ; empilées en dessous (sinon « Trier » déborde vers 768 px) */}
          <div className="mt-8 flex flex-col gap-4 md:mt-[60px] lg:flex-row lg:items-center lg:justify-between">
            <div
              ref={rechercheRef}
              className="w-full lg:max-w-[720px] lg:flex-1"
            >
              <Recherche
                valeur={q}
                onChange={setQ}
                onSubmit={voirResultats}
                aide={
                  domaine === "film"
                    ? "Chercher un film, un réalisateur…"
                    : "Chercher une marque, une ville…"
                }
              />
            </div>
            <div className="flex items-center justify-between gap-6 lg:justify-end lg:gap-[59px]">
              <div className="flex items-center gap-2 md:gap-3">
                {avecFiltres && (
                  <button
                    type="button"
                    onClick={() => setFiltresOuverts(true)}
                    aria-haspopup="dialog"
                    className={cn(
                      "inline-flex min-h-[54px] shrink-0 cursor-pointer items-center gap-2.5 rounded-pill py-[11px] pr-[18px] pl-4 transition-colors duration-240 ease-rw md:min-h-[62px]",
                      nbFiltres
                        ? "bg-encre text-papier"
                        : "verre-pill text-encre hover:bg-blanc",
                    )}
                  >
                    <Icone nom="filtres" taille={20} />
                    <span className="t-cote-m">Filtres</span>
                    {nbFiltres > 0 && (
                      <span className="t-cote-s text-signal">{nbFiltres}</span>
                    )}
                  </button>
                )}
                <div
                  role="group"
                  aria-label="Affichage"
                  className="verre-pill flex rounded-pill p-[5px]"
                >
                  {(["grille", "liste"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={vue === v}
                      aria-label={v === "grille" ? "Vue grille" : "Vue liste"}
                      onClick={() =>
                        majParam("vue", v === "liste" ? "liste" : null)
                      }
                      className={cn(
                        "grid size-11 cursor-pointer place-items-center rounded-pill transition-colors duration-240 ease-rw md:size-[52px]",
                        vue === v
                          ? "bg-encre text-papier"
                          : "text-encre hover:bg-blanc",
                      )}
                    >
                      <Icone nom={v} taille={20} />
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const prochain =
                    ordreTris[(ordreTris.indexOf(tri) + 1) % ordreTris.length];
                  majParam("tri", prochain === triParDefaut ? null : prochain);
                }}
                className="t-cote-m -my-3.5 min-w-0 cursor-pointer py-3.5 text-right transition-colors duration-240 ease-rw hover:text-signal sm:whitespace-nowrap"
              >
                Trier : {TRIS[tri].label}
              </button>
            </div>
          </div>

          {/* Filtres par domaine — passent à la ligne (aucun défilement horizontal) */}
          {/* Page Films : pas de filtres d'univers (les films ont leur propre page) */}
          <ul
            className={cn(
              "mt-6 flex flex-wrap gap-2 pt-1 pb-4 md:mt-9 md:gap-3",
              domaine === "film" && "hidden",
            )}
          >
            <li className="shrink-0">
              <Filtre
                label="Toutes"
                compte={TOTAL_MARQUES}
                couleur="var(--color-signal)"
                ton="blanc"
                actif={!domaine}
                onClick={() => changerDomaine(null)}
              />
            </li>
            {Object.values(DOMAINES)
              .filter((d) => d.id !== "film")
              .map((d) => (
                <li key={d.id} className="shrink-0">
                  <Filtre
                    label={d.nom}
                    compte={d.entrees}
                    couleur={d.couleur}
                    ton="blanc"
                    actif={domaine === d.id}
                    onClick={() =>
                      changerDomaine(domaine === d.id ? null : d.id)
                    }
                  />
                </li>
              ))}
          </ul>

          {/* Filtres actifs : pastilles retirables */}
          {nbFiltres > 0 && (
            <div className="flex flex-wrap items-center gap-2 pb-2">
              <span className="t-cote-s mr-1 text-graphite">
                {resultats.length} résultat{resultats.length > 1 ? "s" : ""}
              </span>
              {CLES_FILTRES.flatMap((k) =>
                selection[k].map((v) => (
                  <button
                    key={`${k}-${v}`}
                    type="button"
                    onClick={() => basculerFiltre(k, v)}
                    aria-label={`Retirer le filtre ${libelle(k, v)}`}
                    className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-pill border border-encre bg-encre py-1.5 pr-2.5 pl-3.5 text-papier transition-colors duration-240 ease-rw hover:bg-carbone"
                  >
                    <span className="t-cote-s">{libelle(k, v)}</span>
                    <Icone nom="fermer" taille={14} />
                  </button>
                )),
              )}
              <button
                type="button"
                onClick={effacerFiltres}
                className="t-cote-s ml-1 cursor-pointer py-2 underline underline-offset-4 transition-colors duration-240 ease-rw hover:text-signal"
              >
                Tout effacer
              </button>
            </div>
          )}
        </EnTetePage>

        {avecFiltres && (
          <PanneauFiltres
            ouvert={filtresOuverts}
            onFermer={() => setFiltresOuverts(false)}
            domaine={domaine}
            selection={selection}
            pays={pays}
            comptes={comptes}
            total={resultats.length}
            onBasculer={basculerFiltre}
            onEffacer={effacerFiltres}
          />
        )}

        {/* ── Résultats ── */}
        <section
          ref={resultatsRef}
          id="resultats"
          aria-live="polite"
          className="pt-6 md:pt-12"
        >
          <Conteneur>
            {resultats.length === 0 ? (
              <div className="flex flex-col items-start gap-6 py-16 md:py-24">
                <p className="t-serif-m md:t-serif-l">
                  Aucun résultat{q && ` pour « ${q} »`}.
                </p>
                <Bouton
                  type="verre"
                  onClick={() => {
                    setQ("");
                    setParams({}, { replace: true });
                  }}
                >
                  Tout réafficher
                </Bouton>
              </div>
            ) : vue === "grille" ? (
              // Changement de filtre : la grille se réorganise (animation layout), les fiches sortantes s'effacent
              <ul className="grid justify-items-center gap-y-[30px] md:grid-cols-2 md:gap-x-10 md:gap-y-[52px] xl:grid-cols-3">
                <AnimatePresence mode="popLayout" initial={false}>
                  {affiches.map((m, i) => (
                    <motion.li
                      key={m.slug}
                      layout
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{
                        opacity: 0,
                        scale: 0.94,
                        transition: { duration: 0.25, ease: EASE_REVELE },
                      }}
                      transition={{
                        duration: 0.6,
                        ease: EASE_REVELE,
                        delay: Math.min(i, 8) * 0.06,
                      }}
                      className="w-full max-w-[400px]"
                    >
                      <Fiche marque={m} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            ) : (
              <div>
                <p className="t-cote-s md:t-cote-m text-signal">/ vue liste</p>
                <div className="mt-6 md:mt-9">
                  <EnTeteIndex />
                </div>
                <ul className="mt-3">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {affiches.map((m, i) => (
                      <motion.li
                        key={m.slug}
                        layout
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, transition: { duration: 0.2 } }}
                        transition={{
                          duration: 0.5,
                          ease: EASE_REVELE,
                          delay: Math.min(i, 10) * 0.04,
                        }}
                        className="mt-1 first:mt-0"
                      >
                        <LigneIndex marque={m} />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
            )}

            {resultats.length > 0 && (
              <div className="mt-16 flex flex-col items-center gap-[27px] md:mt-[100px]">
                {reste > 0 && (
                  <Bouton
                    type="encre"
                    onClick={() => setLimite((l) => l + PAR_PAGE)}
                  >
                    {`Charger ${Math.min(reste, PAR_PAGE)} entrées de plus`}
                  </Bouton>
                )}
                <p className="t-cote-m text-graphite">
                  {String(affiches.length).padStart(3, "0")} /{" "}
                  {String(resultats.length).padStart(3, "0")}
                </p>
              </div>
            )}
          </Conteneur>
        </section>

        <div className="h-10 md:h-10" />
      </main>

      <Footer />
    </>
  );
}
