import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Aura, AuraAnimee } from "../components/Aura";
import { Bandeau } from "../components/Bandeau";
import { Apparition } from "../components/Apparition";
import { Bouton } from "../components/Bouton";
import { Compteur } from "../components/Compteur";
import { Domaine } from "../components/Domaine";
import { Fiche } from "../components/Fiche";
import { Footer } from "../components/Footer";
import { Conteneur, Grille } from "../components/Grille";
import { Nav } from "../components/Nav";
import { Recherche } from "../components/Recherche";
import { SerifRevele, TitreRevele, dureeCascade } from "../components/Revele";
import { Tampon } from "../components/Tampon";
import { TrioConnexions } from "../components/TrioConnexions";
import { DOMAINES, TOTAL_ENTREES, nouvellesEntrees } from "../data/brands";
import { trioDeLaSemaine } from "../data/trios";
import { cn } from "../lib/cn";
import { LIENS } from "../lib/liens";
import { defilerVers, useFacteurParallax } from "../lib/mouvement";

const NOUVELLES = nouvellesEntrees(3);
// Calculé au chargement : le trio change de lui-même chaque lundi
const TRIO = trioDeLaSemaine();

function Cote({ children, className }: { children: string; className?: string }) {
  return <p className={cn("t-cote-s md:t-cote-m text-signal", className)}>{children}</p>;
}

function Signal({ children }: { children: string }) {
  return <em className="font-serif text-[1.17em] font-normal tracking-[-0.01em] text-signal italic">{children}</em>;
}

function Monogramme({ ton = "encre" }: { ton?: "encre" | "papier" }) {
  return (
    <span className={ton === "encre" ? "text-encre" : "text-papier"}>
      r<span className="text-signal">°</span>
    </span>
  );
}

export default function Accueil() {
  const [requete, setRequete] = useState("");
  const rechercheRef = useRef<HTMLDivElement>(null);
  const conceptRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const manifesteRef = useRef<HTMLDivElement>(null);
  // 0 en mouvement réduit, 0.5 en mobile (parallax réduit de moitié), 1 sinon
  const facteurParallax = useFacteurParallax();
  const reduit = facteurParallax === 0;

  useEffect(() => {
    document.title = "rework° — archive vivante de la culture contemporaine";
  }, []);

  // Parallax du hero : auras 0.3x, « l'archive » 0.6x, « vivante » 0.8x (+ glisse à gauche), recherche 1x.
  // Le hero s'estompe (→ 0.3) et rétrécit (→ 0.96) en sortant.
  const { scrollY } = useScroll();
  const { scrollYProgress: sortieHero } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const vitesse = (facteur: number) => (v: number) => v * (1 - facteur) * facteurParallax;
  const yAuras = useTransform(scrollY, vitesse(0.3));
  const yArchive = useTransform(scrollY, vitesse(0.6));
  const yVivante = useTransform(scrollY, vitesse(0.8));
  const xVivante = useTransform(scrollY, (v) => v * -0.12 * facteurParallax);
  const opaciteHero = useTransform(sortieHero, [0, 1], reduit ? [1, 1] : [1, 0.3]);
  const echelleHero = useTransform(sortieHero, [0, 1], reduit ? [1, 1] : [1, 0.96]);

  // Bandeau manifeste : ses auras montent plus lentement
  const { scrollYProgress: passageManifeste } = useScroll({ target: manifesteRef, offset: ["start end", "end start"] });
  const yAurasManifeste = useTransform(passageManifeste, [0, 1], [-140 * facteurParallax, 140 * facteurParallax]);

  // Arrivée depuis une autre page sur /#domaines, /#manifeste… : la section n'existe qu'après le rendu
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
  }, []);

  const allerARecherche = () => {
    defilerVers(rechercheRef.current, -window.innerHeight / 3);
    rechercheRef.current?.querySelector("input")?.focus({ preventScroll: true });
  };

  return (
    <>
      <Nav onChercher={allerARecherche} />

      <main className="overflow-x-clip">
        {/* ── Couverture ── */}
        <section ref={heroRef} className="relative isolate">
          {/* Aura signal sous le titre : ne repasse jamais derrière « vivante » (rouge sur rouge) */}
          <AuraAnimee
            className="absolute inset-x-0 top-0 bottom-[37px] -z-10 md:bottom-[62px]"
            parallaxY={yAuras}
            signal="top-[60%] left-[60%] aspect-square w-[22%] max-w-[320px]"
          />

          <motion.div style={{ opacity: opaciteHero, scale: echelleHero }} className="origin-top will-change-transform">
          <Conteneur className="pt-[100px] md:pt-[140px]">
            <div className="t-cote-s md:t-cote-m flex justify-between text-encre">
              <p>
                <span className="md:hidden">R°{TOTAL_ENTREES} entités — v.3.0</span>
                <span className="hidden md:inline">Base de données v.3.0</span>
              </p>
              <p className="hidden md:block">R°{TOTAL_ENTREES} entités — mode · design · tech · digital · film</p>
            </div>

            <h1 className="mt-0 md:mt-[11px]">
              <motion.span style={{ y: yArchive }} className="t-display-xxl relative -ml-2 block">
                <TitreRevele texte="l'archive" />
              </motion.span>
              <motion.span
                style={{ y: yVivante, x: xVivante }}
                className="t-serif-xl relative mt-2 block pl-[37%] text-signal [text-shadow:0_0_24px_rgba(255,240,235,.9),0_0_48px_rgba(255,240,235,.6)] min-[900px]:-mt-[0.41em] min-[900px]:pl-[50%]"
              >
                <SerifRevele texte="vivante" delai={dureeCascade("l'archive") + 0.2} className="inline-block" />
              </motion.span>
              <span className="mt-[34px] block max-w-[330px] font-display text-[clamp(32px,10vw,40px)] leading-none font-bold tracking-[-0.02em] [font-variation-settings:'opsz'_14] md:mt-[29px] md:max-w-none md:text-[clamp(48px,5vw,64px)] md:leading-[0.95] md:font-extrabold md:tracking-[-0.03em]">
                <TitreRevele texte="de la culture contemporaine." delai={0.35} />
              </span>
            </h1>

            <Grille className="mt-11 items-start md:mt-[70px]">
              <div ref={rechercheRef} className="col-span-4 md:col-span-7">
                <Recherche
                  valeur={requete}
                  onChange={setRequete}
                  onSubmit={() =>
                    window.location.assign(requete.trim() ? `${LIENS.index}?q=${encodeURIComponent(requete.trim())}` : LIENS.index)
                  }
                />
              </div>
              <p className="t-texte-m hidden pt-2 text-carbone md:col-span-4 md:col-start-8 md:block lg:col-span-3 lg:col-start-8">
                Le répertoire sélectif de la culture contemporaine. {TOTAL_ENTREES} entités classées par domaine et par
                esthétique — pas empilées.
              </p>
              <div className="hidden -mt-11 justify-self-end text-encre lg:col-span-2 lg:col-start-11 lg:block">
                <Tampon texte={`R°${TOTAL_ENTREES} entités · éd. 3.0 · Paris · `} centre={<Monogramme />} />
              </div>
            </Grille>

            <div className="mt-5 flex items-center justify-between md:mt-[76px]">
              <ul className="flex flex-wrap gap-2 md:gap-3">
                {[
                  { n: TOTAL_ENTREES, label: "entités" },
                  { n: Object.keys(DOMAINES).length, label: "domaines" },
                  { n: 1, label: "signal" },
                ].map((s) => (
                  <li
                    key={s.label}
                    className="verre-pill t-cote-s md:t-cote-m flex h-9 items-center gap-[0.5em] rounded-pill px-3 md:h-12 md:px-5"
                  >
                    <Compteur valeur={s.n} /> {s.label}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => defilerVers(conceptRef.current)}
                className="t-cote-m group -my-3.5 hidden cursor-pointer items-center gap-1.5 py-3.5 md:flex"
              >
                défiler <span className="transition-transform duration-240 ease-rw group-hover:translate-y-1">↓</span>
              </button>
            </div>
          </Conteneur>
          </motion.div>

          <div className="relative mt-[39px] md:mt-[33px]">
            <Bandeau className="-ml-[60px] w-[calc(100%+120px)] -rotate-2 md:-ml-[100px] md:w-[calc(100%+200px)]" />
          </div>
        </section>

        {/* ── Le trio de la semaine ── */}
        <section id="trio" className="scroll-mt-28 pt-[76px] md:pt-[126px]">
          <Conteneur>
            <Apparition>
              <Cote>{`/ le trio de la semaine — semaine ${TRIO.numero}`}</Cote>
              <div className="mt-[7px] flex flex-col gap-6 md:mt-[13px] lg:flex-row lg:items-end lg:justify-between">
                <h2>
                  <span className="t-titre-l md:t-display-l block md:-ml-2">{TRIO.titre}</span>
                  <span className="t-serif-m md:t-serif-l mt-1.5 block md:mt-[11px] md:pl-[12%]">{TRIO.intro}</span>
                </h2>
                <div className="shrink-0 lg:mb-2">
                  <Bouton type="verre" href={LIENS.trios}>
                    Tous les trios
                  </Bouton>
                </div>
              </div>
            </Apparition>
            <div className="mt-10 md:mt-16">
              <TrioConnexions trio={TRIO} />
            </div>
          </Conteneur>
        </section>

        {/* ── 01 — Le concept ── */}
        <section ref={conceptRef} id="concept" className="scroll-mt-28 pt-[76px] md:pt-[126px]">
          <Conteneur>
            <Apparition>
              <Cote>/ 01 — le concept</Cote>
            </Apparition>
            <Apparition rang={1}>
            <Grille className="mt-[17px] md:mt-[23px]">
              <p className="col-span-4 font-display text-[30px] leading-[1.05] font-bold tracking-[-0.015em] [font-variation-settings:'opsz'_14] md:col-span-10 md:text-[clamp(40px,4vw,58px)] md:leading-[0.95] md:font-extrabold md:tracking-[-0.03em]">
                Rework n'est pas une base de données. C'est une <Signal>archive vivante</Signal>, au croisement de la
                mode, du design, de la tech, du digital et du cinéma<span className="hidden md:inline"> — une lecture curatée de ce qui compte</span>
                . Pas de bruit. <Signal>Juste le signal.</Signal>
              </p>
            </Grille>
            </Apparition>
            <Apparition rang={2} className="mt-6 flex items-end justify-between md:mt-[60px]">
              <div className="flex flex-col items-start gap-[11px] md:flex-row md:gap-6">
                <Bouton type="encre" href={LIENS.index}>
                  Explorer l'archive
                </Bouton>
                <Bouton type="verre" href={LIENS.manifeste}>
                  Lire le manifeste
                </Bouton>
              </div>
              <div className="mr-[-25px] -mt-[120px] hidden text-signal lg:block">
                <Tampon texte="Archive vivante · pas de bruit · " centre="R°" taille={210} />
              </div>
            </Apparition>
          </Conteneur>
        </section>

        {/* ── 02 — Domaines ── */}
        <section id="domaines" className="scroll-mt-28 pt-[57px] md:pt-[127px]">
          <Conteneur>
            <Apparition>
            <Cote>/ 02 — domaines</Cote>
            <h2 className="mt-[7px] md:mt-[13px]">
              <span className="t-titre-l md:t-display-l block md:-ml-2">Cinq lectures</span>
              <span className="mt-0.5 block font-serif text-[36px] leading-none tracking-[-0.01em] italic md:t-serif-l md:mt-[11px] md:pl-[43.75%]">
                de la culture actuelle.
              </span>
            </h2>
            </Apparition>
            {/* 5 domaines : 1 colonne (mobile) · 2 + 2 + 1 large (tablette) · 3 + 2 (desktop) */}
            <ul className="mt-7 grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:gap-5 xl:grid-cols-6">
              {Object.values(DOMAINES).map((d, i) => (
                <Apparition as="li" rang={i} key={d.id} className={cn(i < 3 ? "xl:col-span-2" : "xl:col-span-3", i === 4 && "sm:col-span-2 xl:col-span-3")}>
                  <Domaine domaine={d} compte={d.entrees} />
                </Apparition>
              ))}
            </ul>
          </Conteneur>
        </section>

        {/* ── 03 — Nouvelles entrées ── */}
        <section id="nouvelles" className="scroll-mt-28 pt-[41px] md:pt-[110px]">
          <Conteneur>
            <Apparition>
            <Cote>/ 03 — nouvelles entrées</Cote>
            <div className="mt-[7px] flex items-end justify-between gap-6 md:mt-[13px]">
              <h2>
                <span className="block font-display text-[clamp(30px,9.4vw,36px)] leading-none font-bold tracking-[-0.02em] [font-variation-settings:'opsz'_14] md:hidden">
                  Ce qui vient d'entrer.
                </span>
                <span className="t-display-l -ml-2 hidden md:block">Ce qui vient d'entrer</span>
                <span className="t-serif-l mt-1.5 hidden md:block">dans l'archive.</span>
              </h2>
              <div className="mb-1 hidden md:block">
                <Bouton type="verre" href={LIENS.index}>{`Tout l’index (${TOTAL_ENTREES})`}</Bouton>
              </div>
            </div>
            </Apparition>
            <ul className="mt-[26px] grid justify-items-center gap-y-[30px] md:mt-16 md:grid-cols-2 md:gap-x-10 xl:grid-cols-3">
              {NOUVELLES.map((m, i) => (
                <Apparition as="li" rang={i} key={m.slug} className={cn("w-full max-w-[400px]", i === 1 && "xl:mt-[60px]", i === 2 && "max-md:hidden")}>
                  <Fiche marque={m} />
                </Apparition>
              ))}
            </ul>
          </Conteneur>
        </section>

        {/* ── Manifeste ── */}
        <section id="manifeste" className="scroll-mt-28 px-3 pt-[51px] md:px-6 md:pt-[112px]">
          <div
            ref={manifesteRef}
            className="relative isolate mx-auto h-[400px] max-w-[1392px] overflow-hidden rounded-[32px] bg-encre text-papier md:h-[600px] md:rounded-[48px]"
          >
            <motion.div aria-hidden className="absolute inset-0 -z-10" style={{ y: yAurasManifeste }}>
              <Aura couleur="var(--color-signal)" className="-top-[120px] left-[140px] size-[360px] md:-top-[180px] md:right-[-48px] md:left-auto md:size-[620px]" />
              <Aura couleur="var(--color-aura-mode)" className="top-[300px] -left-[160px] hidden h-[520px] w-[560px] md:block" />
            </motion.div>

            <Apparition className="flex h-full flex-col px-6 pt-8 pb-[27px] md:px-14 md:pt-16 md:pb-[77px]">
              <p className="t-cote-s md:t-cote-m text-signal">
                rework /ri.wɜːrk/<span className="hidden md:inline"> — verbe</span>
              </p>
              <p className="mt-5 max-w-[310px] font-serif text-[40px] leading-none tracking-[-0.01em] italic md:t-serif-l md:mt-8 md:max-w-[1000px]">
                reprendre, affiner, republier ce qui mérite d’être vu.
              </p>
              <div className="mt-auto flex items-end justify-between">
                <Bouton type="signal" href={LIENS.manifeste}>
                  Lire le manifeste
                </Bouton>
                <div className="-mb-[22px] hidden text-papier lg:block">
                  <Tampon texte="Rework archive · Paris · éd. 3.0 · " centre={<Monogramme ton="papier" />} taille={210} />
                </div>
              </div>
            </Apparition>
          </div>
        </section>

        <div className="h-10 md:h-20" />
      </main>

      <Footer />
    </>
  );
}
