import { Navigate, useParams } from "react-router";
import { Apparition } from "../components/Apparition";
import { AuraAnimee } from "../components/Aura";
import { Bouton } from "../components/Bouton";
import { Footer } from "../components/Footer";
import { Conteneur } from "../components/Grille";
import { Nav } from "../components/Nav";
import { SerifRevele, TitreRevele, dureeCascade } from "../components/Revele";
import { TrioConnexions } from "../components/TrioConnexions";
import { semaineIso, triosAVenir, triosPublies, type Trio } from "../data/trios";
import { LIENS } from "../lib/liens";
import { lienTrio, metaTrio, metaTrios } from "../lib/meta";
import { useMeta } from "../lib/useMeta";

const META_TRIOS = metaTrios();

/** Titre + intro d'un trio, lien vers sa page dédiée */
function EnTeteTrio({ trio, grand, courant }: { trio: Trio; grand: boolean; courant: boolean }) {
  return (
    <>
      <p className="t-cote-s md:t-cote-m text-signal">
        {`/ semaine ${trio.numero} · ${trio.annee}`}
        {courant && " — cette semaine"}
      </p>
      <h2 className="mt-[7px] md:mt-[13px]">
        <a href={lienTrio(trio)} className="transition-colors duration-240 ease-rw hover:text-signal">
          <span className={grand ? "t-titre-l md:t-display-l block md:-ml-2" : "t-titre-l md:t-display-m block md:-ml-1.5"}>{trio.titre}</span>
        </a>
        <span className="t-serif-m mt-1.5 block md:mt-2.5">{trio.intro}</span>
      </h2>
    </>
  );
}

/** /trios/2026-W44 — page d'un trio (partageable, avec ses propres métadonnées) ; les semaines à venir ne sont pas accessibles */
export function TrioPage() {
  const { semaine } = useParams();
  const trio = triosPublies().find((t) => t.semaine.toLowerCase() === semaine?.toLowerCase());
  useMeta(trio ? metaTrio(trio) : null);
  if (!trio) return <Navigate to={LIENS.trios} replace />;

  return (
    <>
      <Nav />
      <main className="overflow-x-clip">
        <section className="relative isolate">
          <AuraAnimee className="absolute inset-x-0 -top-[300px] -z-10 h-[680px] md:-top-[420px] md:h-[900px]">
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-[300px] bg-gradient-to-b from-papier/0 to-papier" />
          </AuraAnimee>
          <Conteneur className="pt-[100px] md:pt-[140px]">
            <a href={LIENS.trios} className="verre-pill t-cote-m inline-flex h-11 items-center rounded-pill px-[15px] transition-colors duration-240 ease-rw hover:bg-blanc md:pr-[18px] md:pl-4">
              ← <span className="ml-1.5">tous les trios</span>
            </a>
            <p className="t-cote-s md:t-cote-m mt-7 text-signal md:mt-12">
              {`/ le trio de la semaine — semaine ${trio.numero} · ${trio.annee}`}
            </p>
            <h1 className="mt-2 md:mt-[13px]">
              <TitreRevele texte={trio.titre} className="t-display-l block md:-ml-2" />
              <SerifRevele texte={trio.intro} delai={dureeCascade(trio.titre) + 0.2} className="t-serif-m md:t-serif-l mt-2 block md:mt-3" />
            </h1>
            <div className="mt-12 md:mt-16">
              <TrioConnexions trio={trio} />
            </div>
            <div className="mt-12 flex justify-center md:mt-16">
              <Bouton type="verre" href={LIENS.trios}>
                L'archive des trios
              </Bouton>
            </div>
          </Conteneur>
        </section>
        <div className="h-16 md:h-24" />
      </main>
      <Footer />
    </>
  );
}

// Archive des trios — ceux déjà publiés, du plus récent au plus ancien (les semaines à venir restent une surprise)
export default function Trios() {
  const publies = triosPublies();
  const aVenir = triosAVenir();
  const courante = semaineIso();

  useMeta(META_TRIOS);

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
                <EnTeteTrio trio={trio} grand={i === 0} courant={trio.semaine === courante} />
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
