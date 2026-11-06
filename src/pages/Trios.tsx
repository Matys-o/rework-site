import { Navigate, useParams } from "react-router";
import { Apparition } from "../components/Apparition";
import { Bouton } from "../components/Bouton";
import { EnTetePage, TITRE_PAGE } from "../components/EnTetePage";
import { Footer } from "../components/Footer";
import { Conteneur } from "../components/Grille";
import { Nav } from "../components/Nav";
import { TrioConnexions } from "../components/TrioConnexions";
import { triosAVenir, triosPublies, type Trio } from "../data/trios";
import { cn } from "../lib/cn";
import { LIENS } from "../lib/liens";
import { lienTrio, metaTrio, metaTrios } from "../lib/meta";
import { useMeta } from "../lib/useMeta";

const META_TRIOS = metaTrios();

/** Même phrase que sur l'accueil */
const EXPLICATION =
  "Trois fois par semaine, on relie un film à deux marques. Les bulles au-dessus des cartes expliquent le lien entre chaque entrée.";

const coteTrio = (trio: Trio) =>
  `/ Le trio du ${trio.jour} — semaine ${trio.numero} · ${trio.annee}`;

/** Titre + sous-titre d'un trio, lien vers sa page dédiée */
function EnTeteTrio({
  trio,
  grand,
  courant,
}: {
  trio: Trio;
  grand: boolean;
  courant: boolean;
}) {
  return (
    <>
      <p className="t-cote-s md:t-cote-m text-signal">
        {coteTrio(trio)}
        {courant && " · en ce moment"}
      </p>
      <h2 className="mt-2">
        <a
          href={lienTrio(trio)}
          className="transition-colors duration-240 ease-rw hover:text-signal"
        >
          <span
            className={cn(
              TITRE_PAGE,
              "block md:-ml-1",
              !grand && "text-[clamp(34px,4.4vw,60px)]",
            )}
          >
            {trio.titre}
          </span>
        </a>
        <span className="mt-2 block font-serif text-[clamp(26px,3vw,40px)] leading-none tracking-[-0.02em] italic">
          {trio.intro}
        </span>
      </h2>
    </>
  );
}

/** /trios/2026-W44, /trios/2026-W45-jeudi — page d'un trio (partageable, avec ses propres métadonnées) ; les trios à venir ne sont pas accessibles */
export function TrioPage() {
  const { semaine } = useParams();
  const trio = triosPublies().find(
    (t) => t.id.toLowerCase() === semaine?.toLowerCase(),
  );
  useMeta(trio ? metaTrio(trio) : null);
  if (!trio) return <Navigate to={LIENS.trios} replace />;

  return (
    <>
      <Nav />
      <main className="overflow-x-clip">
        <EnTetePage
          avant={
            <a
              href={LIENS.trios}
              className="verre-pill t-cote-m inline-flex h-11 items-center rounded-pill px-[15px] transition-colors duration-240 ease-rw hover:bg-blanc md:pr-[18px] md:pl-4"
            >
              ← <span className="ml-1.5">Tous les trios</span>
            </a>
          }
          pastille={coteTrio(trio).slice(2)}
          titre={trio.titre}
        >
          <p className="mt-2 font-serif text-[clamp(28px,3.2vw,46px)] leading-none tracking-[-0.02em] italic">
            {trio.intro}
          </p>
          <p className="mt-5 max-w-[720px] text-[16px] leading-[1.5] text-graphite md:text-[18px]">
            {EXPLICATION}
          </p>
          <div className="mt-10 md:mt-12">
            <TrioConnexions trio={trio} numerote />
          </div>
          <div className="mt-12 flex justify-center md:mt-16">
            <Bouton type="verre" href={LIENS.trios}>
              Tous les trios
            </Bouton>
          </div>
        </EnTetePage>
        <div className="h-16 md:h-24" />
      </main>
      <Footer />
    </>
  );
}

// Tous les trios déjà publiés, du plus récent au plus ancien (les suivants restent une surprise)
export default function Trios() {
  const publies = triosPublies();
  const aVenir = triosAVenir();
  const courant = publies[0]?.id;

  useMeta(META_TRIOS);

  return (
    <>
      <Nav />

      <main className="overflow-x-clip">
        <EnTetePage
          pastille="Lundi · jeudi · samedi"
          titre="Les trios"
          texte={EXPLICATION}
        />

        {publies.map((trio, i) => (
          <section
            key={trio.id}
            id={trio.id}
            className="scroll-mt-28 pt-16 md:pt-[120px]"
          >
            <Conteneur>
              <Apparition>
                <EnTeteTrio
                  trio={trio}
                  grand={i === 0}
                  courant={trio.id === courant}
                />
              </Apparition>
              <div className="mt-10 md:mt-12">
                <TrioConnexions trio={trio} numerote />
              </div>
            </Conteneur>
          </section>
        ))}

        {aVenir > 0 && (
          <Conteneur className="pt-16 md:pt-24">
            <p className="t-cote-m text-graphite">
              {aVenir} {aVenir > 1 ? "trios déjà prêts" : "trio déjà prêt"} pour
              les prochains jours — un nouveau le lundi, le jeudi et le samedi.
            </p>
          </Conteneur>
        )}

        <div className="h-16 md:h-24" />
      </main>

      <Footer />
    </>
  );
}
