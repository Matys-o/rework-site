import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSearchParams } from "react-router";
import { AuraAnimee } from "../components/Aura";
import { Bouton } from "../components/Bouton";
import { Compteur } from "../components/Compteur";
import { SerifRevele, TitreRevele, dureeCascade } from "../components/Revele";
import { Fiche } from "../components/Fiche";
import { Filtre } from "../components/Filtre";
import { Footer } from "../components/Footer";
import { Conteneur } from "../components/Grille";
import { Icone } from "../components/Icone";
import { EnTeteIndex, LigneIndex } from "../components/LigneIndex";
import { Nav } from "../components/Nav";
import { Recherche } from "../components/Recherche";
import { DOMAINES, MARQUES, TOTAL_ENTREES, type DomaineId, type Marque } from "../data/brands";
import { cn } from "../lib/cn";
import { metaIndex } from "../lib/meta";
import { EASE_REVELE, defilerVers } from "../lib/mouvement";
import { useMeta } from "../lib/useMeta";

const PAR_PAGE = 24;

const TRIS = {
  // « récent » = dernières entrées d'abord (plus grand id)
  recent: { label: "récent ↓", trier: (a: Marque, b: Marque) => b.id - a.id },
  nom: { label: "A → Z", trier: (a: Marque, b: Marque) => a.nom.localeCompare(b.nom, "fr") },
  annee: { label: "année ↑", trier: (a: Marque, b: Marque) => a.annee - b.annee },
  // Réservé au domaine Film, dont c'est le tri par défaut
  rang: { label: "rang Letterboxd ↑", trier: (a: Marque, b: Marque) => (a.rang ?? Infinity) - (b.rang ?? Infinity) },
} as const;
type Tri = keyof typeof TRIS;
const ORDRE_TRIS_MARQUES: Tri[] = ["recent", "nom", "annee"];
const ORDRE_TRIS_FILMS: Tri[] = ["rang", "recent", "nom", "annee"];

/** Recherche insensible à la casse et aux accents */
const normaliser = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const estDomaine = (v: string | null): v is DomaineId => !!v && v in DOMAINES;

export default function Index() {
  const [params, setParams] = useSearchParams();
  const [limite, setLimite] = useState(PAR_PAGE);
  const rechercheRef = useRef<HTMLDivElement>(null);

  // L'état vit dans l'URL : /index?domaine=mode&q=leica&vue=liste&tri=nom — partageable, et le menu peut y pointer
  // La saisie reste locale (réactive à chaque frappe) ; l'URL suit, sans perdre de caractères
  const [q, setQ] = useState(() => params.get("q") ?? "");
  useEffect(() => {
    if ((params.get("q") ?? "") !== q) majParam("q", q || null);
  }, [q]);
  const domaine = estDomaine(params.get("domaine")) ? (params.get("domaine") as DomaineId) : null;
  const vue = params.get("vue") === "liste" ? "liste" : "grille";
  const ordreTris = domaine === "film" ? ORDRE_TRIS_FILMS : ORDRE_TRIS_MARQUES;
  const triParDefaut = ordreTris[0];
  const tri: Tri = ordreTris.includes(params.get("tri") as Tri) ? (params.get("tri") as Tri) : triParDefaut;

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

  const resultats = useMemo(() => {
    const termes = normaliser(q.trim()).split(/\s+/).filter(Boolean);
    return MARQUES.filter((m) => !domaine || m.domaine === domaine)
      .filter((m) => {
        if (!termes.length) return true;
        const texte = normaliser(
          [m.nom, m.origine, m.etiquette, m.realisation, m.titreOriginal].join(" "),
        );
        return termes.every((t) => texte.includes(t));
      })
      .sort(TRIS[tri].trier);
  }, [q, domaine, tri]);

  const affiches = resultats.slice(0, limite);
  const reste = resultats.length - affiches.length;

  useMeta(metaIndex(domaine));

  // Arrivée via « Chercher » / ⌘K depuis une autre page : /index#recherche
  useEffect(() => {
    if (window.location.hash === "#recherche") rechercheRef.current?.querySelector("input")?.focus();
  }, []);

  const allerARecherche = () => {
    defilerVers(rechercheRef.current, -window.innerHeight / 3);
    rechercheRef.current?.querySelector("input")?.focus({ preventScroll: true });
  };

  return (
    <>
      <Nav onChercher={allerARecherche} />

      <main className="overflow-x-clip">
        {/* ── En-tête ── */}
        <section className="relative isolate">
          <AuraAnimee className="absolute inset-x-0 -top-[300px] h-[680px] -z-10 md:-top-[420px] md:h-[900px]">
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-[300px] bg-gradient-to-b from-papier/0 to-papier" />
          </AuraAnimee>

          <Conteneur className="pt-[100px] md:pt-[140px]">
            <p className="t-cote-s md:t-cote-m">rework° / index</p>

            <div className="mt-2 flex flex-col gap-6 md:mt-[17px] lg:flex-row lg:items-start lg:justify-between">
              <h1 className="flex flex-wrap items-baseline gap-x-6">
                <TitreRevele texte="l'index" className="t-display-xl -ml-1.5 md:-ml-2" />
                <SerifRevele texte="classé, pas empilé." delai={dureeCascade("l'index") + 0.2} className="t-serif-m md:t-serif-l inline-block text-signal" />
              </h1>
              <p className="flex items-baseline gap-3 lg:mt-[30px] lg:flex-col lg:items-end lg:gap-1.5">
                <Compteur valeur={TOTAL_ENTREES} className="t-titre-l lg:t-display-l" />
                <span className="t-cote-s md:t-cote-m">entrées dans l’archive</span>
              </p>
            </div>

            {/* Recherche · vue · tri */}
            {/* Recherche et commandes sur une ligne dès lg ; empilées en dessous (sinon « Trier » déborde vers 768 px) */}
            <div className="mt-8 flex flex-col gap-4 md:mt-[60px] lg:flex-row lg:items-center lg:justify-between">
              <div ref={rechercheRef} className="w-full lg:max-w-[720px] lg:flex-1">
                <Recherche valeur={q} onChange={setQ} />
              </div>
              <div className="flex items-center justify-between gap-6 lg:justify-end lg:gap-[59px]">
                <div role="group" aria-label="Affichage" className="verre-pill flex rounded-pill p-[5px]">
                  {(["grille", "liste"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={vue === v}
                      aria-label={v === "grille" ? "Vue grille" : "Vue liste"}
                      onClick={() => majParam("vue", v === "liste" ? "liste" : null)}
                      className={cn(
                        "grid size-11 cursor-pointer place-items-center rounded-pill transition-colors duration-240 ease-rw md:size-[52px]",
                        vue === v ? "bg-encre text-papier" : "text-encre hover:bg-blanc",
                      )}
                    >
                      <Icone nom={v} taille={20} />
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const prochain = ordreTris[(ordreTris.indexOf(tri) + 1) % ordreTris.length];
                    majParam("tri", prochain === triParDefaut ? null : prochain);
                  }}
                  className="t-cote-m -my-3.5 min-w-0 cursor-pointer py-3.5 text-right transition-colors duration-240 ease-rw hover:text-signal sm:whitespace-nowrap"
                >
                  Trier : {TRIS[tri].label}
                </button>
              </div>
            </div>

            {/* Filtres par domaine — passent à la ligne (aucun défilement horizontal) */}
            <ul className="mt-6 flex flex-wrap gap-2 pt-1 pb-4 md:mt-9 md:gap-3">
              <li className="shrink-0">
                <Filtre
                  label="Tout"
                  compte={TOTAL_ENTREES}
                  couleur="var(--color-signal)"
                  ton="blanc"
                  actif={!domaine}
                  onClick={() => majParam("domaine", null)}
                />
              </li>
              {Object.values(DOMAINES).map((d) => (
                <li key={d.id} className="shrink-0">
                  <Filtre
                    label={d.nom}
                    compte={d.entrees}
                    couleur={d.couleur}
                    ton="blanc"
                    actif={domaine === d.id}
                    onClick={() => majParam("domaine", domaine === d.id ? null : d.id)}
                  />
                </li>
              ))}
            </ul>
          </Conteneur>
        </section>

        {/* ── Résultats ── */}
        <section aria-live="polite" className="pt-6 md:pt-12">
          <Conteneur>
            {resultats.length === 0 ? (
              <div className="flex flex-col items-start gap-6 py-16 md:py-24">
                <p className="t-serif-m md:t-serif-l">Rien dans l'archive{q && ` pour « ${q} »`}.</p>
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
                      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.25, ease: EASE_REVELE } }}
                      transition={{ duration: 0.6, ease: EASE_REVELE, delay: Math.min(i, 8) * 0.06 }}
                      className="w-full max-w-[400px]"
                    >
                      <Fiche marque={m} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            ) : (
              <div>
                <p className="t-cote-s md:t-cote-m text-signal">/ vue liste — même archive, autre lecture</p>
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
                        transition={{ duration: 0.5, ease: EASE_REVELE, delay: Math.min(i, 10) * 0.04 }}
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
                  <Bouton type="encre" onClick={() => setLimite((l) => l + PAR_PAGE)}>
                    {`Charger ${Math.min(reste, PAR_PAGE)} entrées de plus`}
                  </Bouton>
                )}
                <p className="t-cote-m text-graphite">
                  {String(affiches.length).padStart(3, "0")} / {String(resultats.length).padStart(3, "0")}
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
