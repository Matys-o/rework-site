import { useEffect } from "react";
import { Apparition } from "../components/Apparition";
import { AuraAnimee } from "../components/Aura";
import { Footer } from "../components/Footer";
import { Conteneur } from "../components/Grille";
import { Nav } from "../components/Nav";
import { SerifRevele, TitreRevele, dureeCascade } from "../components/Revele";
import { TrioConnexions } from "../components/TrioConnexions";
import { semaineIso, triosAVenir, triosPublies } from "../data/trios";

// Archive des trios — ceux déjà publiés, du plus récent au plus ancien (les semaines à venir restent une surprise)
export default function Trios() {
  const publies = triosPublies();
  const aVenir = triosAVenir();
  const courante = semaineIso();

  useEffect(() => {
    document.title = "Les trios — rework°";
  }, []);

  return (
    <>
      <Nav />

      <main className="overflow-x-clip">
        <section className="relative isolate">
          <AuraAnimee className="absolute inset-x-0 -top-[300px] -z-10 h-[680px] md:-top-[420px] md:h-[900px]">
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-[300px] bg-gradient-to-b from-papier/0 to-papier" />
          </AuraAnimee>

          <Conteneur className="pt-[100px] md:pt-[140px]">
            <p className="t-cote-s md:t-cote-m">rework° / trios</p>
            <h1 className="mt-2 flex flex-wrap items-baseline gap-x-6 md:mt-[17px]">
              <TitreRevele texte="les trios" className="t-display-xl -ml-1.5 md:-ml-2" />
              <SerifRevele
                texte="un fil, trois entrées."
                delai={dureeCascade("les trios") + 0.2}
                className="t-serif-m md:t-serif-l inline-block text-signal"
              />
            </h1>
            <p className="t-texte-m md:t-texte-l mt-6 max-w-[640px] text-carbone md:mt-8">
              Chaque semaine, un film, une marque, puis une autre marque, reliés par un fil commun : une esthétique, une
              matière, une époque, une idée.
            </p>
          </Conteneur>
        </section>

        {publies.map((trio, i) => (
          <section key={trio.semaine} id={trio.semaine} className="scroll-mt-28 pt-16 md:pt-[120px]">
            <Conteneur>
              <Apparition>
                <p className="t-cote-s md:t-cote-m text-signal">
                  {`/ semaine ${trio.numero} · ${trio.annee}`}
                  {trio.semaine === courante && " — cette semaine"}
                </p>
                <h2 className="mt-[7px] md:mt-[13px]">
                  <span className={i === 0 ? "t-titre-l md:t-display-l block md:-ml-2" : "t-titre-l md:t-display-m block md:-ml-1.5"}>
                    {trio.titre}
                  </span>
                  <span className="t-serif-m mt-1.5 block md:mt-2.5">{trio.intro}</span>
                </h2>
              </Apparition>
              <div className="mt-10 md:mt-14">
                <TrioConnexions trio={trio} />
              </div>
            </Conteneur>
          </section>
        ))}

        {aVenir > 0 && (
          <Conteneur className="pt-16 md:pt-24">
            <p className="t-cote-m text-graphite">
              {aVenir} {aVenir > 1 ? "trios à venir" : "trio à venir"} — un par semaine, chaque lundi.
            </p>
          </Conteneur>
        )}

        <div className="h-16 md:h-24" />
      </main>

      <Footer />
    </>
  );
}
