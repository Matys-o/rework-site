import { Apparition } from "../components/Apparition";
import { Bouton } from "../components/Bouton";
import { EnTetePage, TITRE_SECTION } from "../components/EnTetePage";
import { Footer } from "../components/Footer";
import { Conteneur } from "../components/Grille";
import { Nav } from "../components/Nav";
import { STATS } from "../data/archive";
import { LIENS } from "../lib/liens";
import { metaManifeste } from "../lib/meta";
import { useMeta } from "../lib/useMeta";

const META = metaManifeste();

// Tuiles de couleur, comme les univers de l'accueil (couleurs d'aura du site)
const POINTS = [
  {
    numero: "01",
    titre: "Une sélection",
    texte: `${STATS.total} références (marques, films, musique) choisies une par une. Pas un annuaire.`,
    couleur: "var(--color-aura-mode)",
  },
  {
    numero: "02",
    titre: "Une fiche par entrée",
    texte:
      "Ce qu'elle fait, d'où elle vient, son année de création et le lien vers son site.",
    couleur: "var(--color-aura-design)",
  },
  {
    numero: "03",
    titre: "Mis à jour chaque semaine",
    texte:
      "De nouvelles entrées chaque semaine, et un trio le lundi, le jeudi et le samedi.",
    couleur: "var(--color-aura-tech)",
  },
  {
    numero: "04",
    titre: "Gratuit",
    texte: "Sans inscription. La lettre du lundi est facultative.",
    couleur: "var(--color-aura-digital)",
  },
];

// À propos (route /manifeste conservée) — même langage que l'accueil : phrases simples, tuiles de couleur.
export default function Manifeste() {
  useMeta(META);

  return (
    <>
      <Nav />

      <main className="overflow-x-clip">
        <EnTetePage
          pastille="À propos"
          titre="Rework, c'est quoi ?"
          texte="Une sélection de marques et de films : mode, design, tech, digital et cinéma. Pour chaque entrée : ce qu'elle fait, d'où elle vient, et le lien vers son site."
        >
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center md:mt-10">
            <Bouton type="encre" href={LIENS.index} className="justify-center">
              Voir toutes les marques
            </Bouton>
            <Bouton
              type="contour"
              href={LIENS.trios}
              className="justify-center"
            >
              Voir les trios
            </Bouton>
          </div>
        </EnTetePage>

        {/* ── Comment ça marche ── */}
        <section className="pt-16 md:pt-[120px]">
          <Conteneur>
            <Apparition>
              <h2 className={TITRE_SECTION}>Comment ça marche</h2>
            </Apparition>
            <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-5 xl:grid-cols-4">
              {POINTS.map((p, i) => (
                <Apparition as="li" rang={i} key={p.numero}>
                  <article
                    className="flex h-full min-h-[240px] flex-col rounded-[22px] p-6 md:min-h-[300px]"
                    style={{ backgroundColor: p.couleur }}
                  >
                    <p className="t-cote-s">{p.numero}</p>
                    <h3 className="mt-auto font-display text-[clamp(28px,2.6vw,36px)] leading-none font-extrabold tracking-[-0.04em] [font-variation-settings:'opsz'_96]">
                      {p.titre}
                    </h3>
                    <p className="mt-3 text-[16px] leading-[1.45]">{p.texte}</p>
                  </article>
                </Apparition>
              ))}
            </ul>
          </Conteneur>
        </section>

        {/* ── Proposer ── */}
        <section className="pt-16 pb-20 md:pt-[120px] md:pb-[110px]">
          <Conteneur>
            <Apparition className="verre flex flex-col items-center rounded-[28px] bg-blanc/78! px-6 py-10 text-center md:rounded-[36px] md:py-14">
              <h2 className={TITRE_SECTION}>Une marque manque ?</h2>
              <p className="mt-2 max-w-[520px] text-[17px] leading-[1.5] text-graphite">
                Envoyez-la nous : si elle a sa place, elle aura sa fiche.
              </p>
              <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Bouton
                  type="encre"
                  href={LIENS.proposer}
                  className="justify-center"
                >
                  Proposer une marque
                </Bouton>
                <Bouton
                  type="contour"
                  href={LIENS.ecrire}
                  className="justify-center"
                >
                  Écrire à la rédaction
                </Bouton>
              </div>
            </Apparition>
          </Conteneur>
        </section>
      </main>

      <Footer />
    </>
  );
}
