import { BandeauRew, BoxRew } from "../components/Rew/AccueilRew";
import { useEffect } from "react";
import { Apparition } from "../components/Apparition";
import { Bouton } from "../components/Bouton";
import { Fiche, FicheDossier } from "../components/Fiche";
import { Footer } from "../components/Footer";
import { Conteneur } from "../components/Grille";
import { MurMarques } from "../components/MurMarques";
import { Nav } from "../components/Nav";
import { TrioConnexions } from "../components/TrioConnexions";
import {
  DOMAINES,
  MARQUES,
  TOTAL_ENTREES,
  nouvellesEntrees,
  type Domaine,
  type Marque,
} from "../data/brands";
import { trioDeLaSemaine } from "../data/trios";
import { LIENS, lienDomaine } from "../lib/liens";
import { lienTrio, metaAccueil } from "../lib/meta";
import { useMeta } from "../lib/useMeta";

// Accueil v3 — « le mur de marques » (maquette Figma 1135:902). L'ancien accueil reste dans AccueilV2.tsx.

const META = metaAccueil();
// Calculé au chargement, même source que la page Trios : lundi, jeudi, samedi
const TRIO = trioDeLaSemaine();
const NOUVELLES = nouvellesEntrees(5);

const imageLocale = (m: Marque) =>
  !!m.image?.startsWith("/images/") && !m.video;

/** Image d'une tuile univers : l'entrée la plus récente du domaine qui a une photo locale */
const imageUnivers = (d: Domaine) =>
  [...MARQUES].reverse().find((m) => m.domaine === d.id && imageLocale(m));

const TITRE_SECTION =
  "font-display text-[28px] leading-[1.1] font-bold tracking-[-0.02em] [font-variation-settings:'opsz'_14]";

/** Rangée de fiches : défile horizontalement en mobile / tablette, grille de 5 en desktop */
const RANGEE =
  "-mx-(--marge) mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-(--marge) px-(--marge) pb-4 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-5 lg:overflow-visible lg:px-0";
const CELLULE = "w-[78vw] max-w-[320px] shrink-0 snap-start lg:w-auto lg:max-w-none";

export default function Accueil() {
  useMeta(META);

  // Arrivée depuis une autre page sur /#domaines, /#trio… : la section n'existe qu'après le rendu
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id)
      requestAnimationFrame(() =>
        document.getElementById(id)?.scrollIntoView(),
      );
  }, []);

  return (
    <>
      <Nav flou />

      <main className="overflow-x-clip">
        {/* ── Le mur de marques ── le panneau est lu en premier ; le mur, décoratif, est posé derrière */}
        <section className="relative isolate flex justify-center overflow-hidden px-4 pt-[92px] pb-[150px] sm:pt-[150px] lg:min-h-[940px] lg:pt-[220px] lg:pb-[230px]">
          <div className="verre relative flex w-full flex-col items-center rounded-[28px] bg-blanc/78! px-5 pt-7 pb-6 text-center sm:w-[80%] md:rounded-[36px] md:px-10 md:pt-[43px] md:pb-[38px] lg:w-[800px]">
            <p className="t-cote-s flex items-center gap-2 rounded-pill bg-blanc px-3.5 py-2">
              <span aria-hidden className="size-2.5 rounded-full bg-signal" />
              Mis à jour chaque semaine
            </p>
            <h1 className="mt-5 max-w-[720px] font-display text-[clamp(40px,11vw,68px)] leading-[0.92] font-extrabold tracking-[-0.05em] [font-variation-settings:'opsz'_96] md:mt-[22px]">
              {TOTAL_ENTREES} marques et films{" "}
              <br className="hidden sm:block" />à découvrir.
            </h1>
            <p className="mt-5 max-w-[620px] text-[17px] leading-[1.5] md:mt-6 md:text-[20px]">
              Vous cherchez une marque ? Elle est ici.<br />Rework est là pour vous aider à trouver l'inspiration.
            </p>
            <div className="mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center md:mt-10">
              <Bouton
                type="encre"
                href={LIENS.index}
                className="justify-center"
              >
                Voir toutes les marques
              </Bouton>
              <Bouton
                type="contour"
                href={LIENS.hasard}
                className="justify-center"
              >
                Une marque au hasard
              </Bouton>
            </div>
            <BandeauRew className="mt-5 md:mt-7" />
            <p className="t-cote-s mt-5 text-graphite">
              Gratuit · sans inscription
            </p>
          </div>

          <div className="absolute inset-0 -z-10">
            <MurMarques className="absolute inset-0" />
            {/* Voile papier : transition douce vers la suite de la page */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-linear-to-b from-papier/15 via-papier/35 via-75% to-papier"
            />
          </div>
        </section>

        <BoxRew />

        {/* ── Les 5 univers ── */}
        <section id="domaines" className="scroll-mt-28 pt-6 md:pt-[60px]">
          <Conteneur>
            <Apparition>
              <h2 className={TITRE_SECTION}>
                {Object.keys(DOMAINES).length} univers
              </h2>
              <p className="t-texte-m mt-1 text-graphite">
                Choisissez par où commencer.
              </p>
            </Apparition>
            <ul className={RANGEE}>
              {Object.values(DOMAINES).map((d, i) => {
                const image = imageUnivers(d);
                return (
                  <Apparition as="li" rang={i} key={d.id} className={CELLULE}>
                    <FicheDossier
                      href={lienDomaine(d.id)}
                      onglet={d.numero}
                      domaine={d}
                      meta={`${d.entrees} entrées`}
                      titre={d.id === "film" ? "Films" : d.nom}
                      description={d.description}
                      image={image?.image}
                    />
                  </Apparition>
                );
              })}
            </ul>
          </Conteneur>
        </section>

        {/* ── Le trio du jour ── */}
        <section id="trio" className="scroll-mt-28 pt-[90px] md:pt-[180px]">
          <Conteneur>
            <Apparition>
              <p className="t-cote-s md:t-cote-m text-signal">{`/ Le trio du jour — ${TRIO.jour} · semaine ${TRIO.numero}`}</p>
              <h2 className="mt-2">
                <a
                  href={lienTrio(TRIO)}
                  className="transition-colors duration-240 ease-rw hover:text-signal"
                >
                  <span className="block font-display text-[clamp(40px,6vw,84px)] leading-none font-extrabold tracking-[-0.05em] [font-variation-settings:'opsz'_96] md:-ml-1">
                    {TRIO.titre}
                  </span>
                </a>
                <span className="mt-2 block font-serif text-[clamp(28px,3.2vw,46px)] leading-none tracking-[-0.02em] italic">
                  {TRIO.intro}
                </span>
              </h2>
              <div className="mt-5 flex flex-col items-start gap-5 lg:flex-row lg:items-end lg:justify-between">
                <p className="max-w-[720px] text-[16px] leading-[1.5] text-graphite md:text-[18px]">
                  Le trio, c'est quoi ? Trois fois par semaine, on relie un film
                  à deux marques. Les bulles au-dessus des cartes expliquent le
                  lien entre chaque entrée.
                </p>
                <Bouton type="verre" href={LIENS.trios} className="shrink-0">
                  Tous les trios
                </Bouton>
              </div>
            </Apparition>
            <div className="mt-10 md:mt-12">
              <TrioConnexions trio={TRIO} numerote />
            </div>
          </Conteneur>
        </section>

        {/* ── Ajoutées cette semaine ── */}
        <section id="nouvelles" className="scroll-mt-28 pt-[70px] md:pt-[90px]">
          <Conteneur>
            <Apparition className="flex items-end justify-between gap-4">
              <h2 className={TITRE_SECTION}>Ajoutées cette semaine</h2>
              <a
                href={LIENS.index}
                className="shrink-0 text-[15px] font-medium transition-colors duration-240 ease-rw hover:text-signal"
              >
                Voir les {TOTAL_ENTREES} →
              </a>
            </Apparition>
            <ul className={RANGEE}>
              {NOUVELLES.map((m, i) => (
                <Apparition as="li" rang={i} key={m.slug} className={CELLULE}>
                  <Fiche marque={m} />
                </Apparition>
              ))}
            </ul>
          </Conteneur>
        </section>

        <div className="h-20 md:h-28" />
      </main>

      <Footer />
    </>
  );
}
