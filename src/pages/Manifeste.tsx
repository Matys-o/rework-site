import { useEffect } from "react";
import { Apparition } from "../components/Apparition";
import { Aura } from "../components/Aura";
import { Bouton } from "../components/Bouton";
import { Footer } from "../components/Footer";
import { Conteneur } from "../components/Grille";
import { Nav } from "../components/Nav";
import { SerifRevele, TitreRevele, dureeCascade } from "../components/Revele";
import { Tampon } from "../components/Tampon";
import { TOTAL_ENTREES } from "../data/brands";
import { LIENS } from "../lib/liens";

const PRINCIPES = [
  { numero: "01", titre: "Curater", texte: `Choisir, c'est déjà écrire. ${TOTAL_ENTREES} entrées, pas 28 500.`, aura: "var(--color-aura-mode)" },
  { numero: "02", titre: "Contextualiser", texte: "Une marque sans son histoire n'est qu'un logo.", aura: "var(--color-aura-design)" },
  { numero: "03", titre: "Ralentir", texte: "Une nouvelle entrée par semaine. Pas une de plus.", aura: "var(--color-aura-tech)" },
  { numero: "04", titre: "Transmettre", texte: "Chaque fiche est faite pour être partagée, citée, reprise.", aura: "var(--color-aura-digital)" },
];

function Signal({ children }: { children: string }) {
  return <em className="font-serif text-[1.19em] font-normal tracking-[-0.01em] text-signal italic">{children}</em>;
}

// Manifeste — version sombre : l'encre devient le papier, les auras restent la lumière.
export default function Manifeste() {
  useEffect(() => {
    document.title = "Manifeste — rework°";
  }, []);

  return (
    <div className="bg-encre text-papier">
      <Nav surSombre />

      <main className="relative isolate overflow-x-clip">
        <Aura couleur="var(--color-signal)" className="-top-[300px] left-[48%] -z-10 h-[520px] w-[560px] opacity-90 md:h-[900px] md:w-[1000px]" />
        <Aura couleur="var(--color-aura-mode)" className="top-[200px] -left-[300px] -z-10 h-[500px] w-[560px] opacity-90 md:h-[700px] md:w-[800px]" />
        <Aura couleur="var(--color-aura-digital)" className="top-[1100px] left-[40%] -z-10 size-[500px] opacity-90 md:left-[62%] md:size-[700px]" />

        {/* ── Ouverture ── */}
        <Conteneur className="pt-[110px] md:pt-[150px]">
          <p className="t-cote-s md:t-cote-m text-signal">/ manifeste — rework° édition 3.0</p>
          <h1 className="mt-2 md:mt-[17px]">
            <TitreRevele texte="Pas de bruit." className="t-display-xxl -ml-1.5 block md:-ml-2.5" />
            <span className="t-serif-xl mt-2 block pl-[18%] md:-mt-[0.02em] md:pl-[37.5%] md:whitespace-nowrap">
              <SerifRevele texte="juste le signal." delai={dureeCascade("Pas de bruit.") + 0.2} className="inline-block" />
            </span>
          </h1>

          <p className="mt-14 max-w-[1180px] font-display text-[28px] leading-[1.05] font-bold tracking-[-0.015em] [font-variation-settings:'opsz'_14] md:mt-[147px] md:text-[clamp(36px,3.6vw,52px)] md:leading-[0.95] md:font-extrabold md:tracking-[-0.03em]">
            Rework n'est pas un magazine, c'est une <Signal>archive vivante</Signal>. Dans une ère de saturation visuelle,
            nous curatons <Signal>l'essentiel</Signal>. Nous explorons les intersections entre le design intemporel, la
            musique et la culture visuelle. Notre esthétique est <Signal>chaleureuse mais précise</Signal>, analogique
            mais contemporaine.
          </p>
        </Conteneur>

        {/* ── Principes : verre sur auras ── */}
        <Conteneur className="mt-14 md:mt-[120px]">
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 xl:grid-cols-4">
            {PRINCIPES.map((p, i) => (
              <Apparition as="li" rang={i} key={p.numero} className="relative isolate">
                <Aura couleur={p.aura} flou="douce" className="top-[60px] left-10 -z-10 size-[200px] md:size-[240px]" />
                <article className="verre flex h-[320px] flex-col rounded-[32px] p-[27px] md:h-[400px]">
                  <p className="t-cote-m text-signal">{p.numero}</p>
                  <h2 className="t-titre-l mt-auto">{p.titre}</h2>
                  <p className="t-texte-s mt-5 max-w-[250px]">{p.texte}</p>
                </article>
              </Apparition>
            ))}
          </ul>
        </Conteneur>

        {/* ── Définition ── */}
        <Conteneur className="mt-20 grid gap-6 md:mt-[140px] md:grid-cols-12 md:gap-x-5">
          <div className="md:col-span-5">
            <p className="t-display-l -ml-1.5 md:-ml-2">rework</p>
            <p className="t-cote-s md:t-cote-m mt-3 text-signal md:mt-4">/ri.wɜːrk/ — verbe</p>
          </div>
          <p className="font-serif text-[40px] leading-none tracking-[-0.01em] italic md:col-span-7 md:t-serif-l md:mt-2.5">
            reprendre, affiner, republier ce qui mérite d’être vu.
          </p>
        </Conteneur>

        <div className="mt-16 flex justify-center text-papier md:mt-[90px]">
          <Tampon
            texte="Rework archive · Paris · éd. 3.0 · "
            centre={
              <>
                r<span className="text-signal">°</span>
              </>
            }
            taille={268}
            className="max-md:scale-75"
          />
        </div>

        {/* ── Appel ── */}
        <Conteneur className="mt-16 flex flex-col items-center gap-[30px] pb-20 text-center md:mt-[56px] md:pb-[100px]">
          <h2 className="t-titre-m md:t-titre-l">Une marque manque à l’archive ?</h2>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-[18px]">
            <Bouton type="signal" href={LIENS.proposer}>
              Proposer une marque
            </Bouton>
            <Bouton type="verre" href={LIENS.ecrire} className="bg-blanc! text-encre">
              Écrire à la rédaction
            </Bouton>
          </div>
        </Conteneur>
      </main>

      <Footer />
    </div>
  );
}
