import type { ReactNode } from "react";
import { Apparition } from "../components/Apparition";
import { AuraAnimee } from "../components/Aura";
import { Footer } from "../components/Footer";
import { Conteneur } from "../components/Grille";
import { Nav } from "../components/Nav";
import { SerifRevele, TitreRevele, dureeCascade } from "../components/Revele";
import { metaConfidentialite, metaInscriptionConfirmee } from "../lib/meta";
import { useMeta } from "../lib/useMeta";
import { Bouton } from "../components/Bouton";
import { LIENS } from "../lib/liens";

const META = metaConfidentialite();
const META_CONFIRMEE = metaInscriptionConfirmee();

const SECTIONS = [
  {
    titre: "Ce qu'on garde",
    texte:
      "Ton adresse email. Rien d'autre : pas de nom, pas de profil, pas de revente, pas de publicité.",
  },
  {
    titre: "À quoi elle sert",
    texte:
      "À t'envoyer la lettre de rework°, une fois par semaine : le trio de la semaine et les nouvelles entrées de l'archive. Et, une seule fois, l'email qui confirme ton inscription.",
  },
  {
    titre: "Où elle est",
    texte:
      "Chez Brevo, le service qui envoie la lettre, hébergé dans l'Union européenne. Comme la plupart des lettres, Brevo indique si elle a été ouverte et quels liens ont été cliqués : ça nous sert à savoir ce qui intéresse, jamais à te cibler.",
  },
  {
    titre: "Combien de temps",
    texte:
      "Tant que tu restes inscrit·e. Après ta désinscription, l'adresse ne reste que sur la liste de blocage de Brevo, pour qu'on ne t'écrive plus jamais.",
  },
];

/** Gabarit commun aux deux pages courtes de la lettre */
function PageCourte({
  cote,
  titre,
  sousTitre,
  children,
}: {
  cote: string;
  titre: string;
  sousTitre: string;
  children: ReactNode;
}) {
  return (
    <>
      <Nav />
      <main className="overflow-x-clip">
        <section className="relative isolate">
          <AuraAnimee className="absolute inset-x-0 -top-[300px] -z-10 h-[680px] md:-top-[420px] md:h-[900px]">
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-[300px] bg-gradient-to-b from-papier/0 to-papier"
            />
          </AuraAnimee>
          <Conteneur className="pt-[100px] md:pt-[140px]">
            <p className="t-cote-s md:t-cote-m">{cote}</p>
            <h1 className="mt-2 md:mt-[17px]">
              <TitreRevele
                texte={titre}
                className="t-display-l -ml-1 block md:-ml-2"
              />
              <SerifRevele
                texte={sousTitre}
                delai={dureeCascade(titre) + 0.2}
                className="t-serif-m md:t-serif-l mt-2 block text-signal md:mt-3"
              />
            </h1>
          </Conteneur>
        </section>
        <Conteneur className="pt-12 md:pt-20">{children}</Conteneur>
        <div className="h-16 md:h-24" />
      </main>
      <Footer />
    </>
  );
}

// /confidentialite — ce que devient l'email laissé dans le formulaire de la lettre
export default function Confidentialite() {
  useMeta(META);
  return (
    <PageCourte
      cote="rework° / confidentialité"
      titre="ton email, rien d'autre."
      sousTitre="ce que devient ton adresse."
    >
      <div className="grid max-w-[760px] gap-10 md:gap-14">
        {SECTIONS.map((s) => (
          <Apparition key={s.titre}>
            <h2 className="t-cote-m text-signal">{`/ ${s.titre}`}</h2>
            <p className="t-texte-m md:t-texte-l mt-3 text-carbone">
              {s.texte}
            </p>
          </Apparition>
        ))}
        <Apparition>
          <h2 id="desinscription" className="t-cote-m scroll-mt-28 text-signal">
            / Se désinscrire
          </h2>
          <p className="t-texte-m md:t-texte-l mt-3 text-carbone">
            Un clic sur « Se désinscrire », en bas de chaque lettre, et c'est
            fait, sans justification. Pour consulter, corriger ou supprimer ton
            adresse (RGPD), réponds simplement à une lettre : on s'en occupe à
            la main.
          </p>
        </Apparition>
      </div>
    </PageCourte>
  );
}

// /inscription-confirmee — page d'arrivée après le clic dans l'email de confirmation (double opt-in Brevo)
export function InscriptionConfirmee() {
  useMeta(META_CONFIRMEE);
  return (
    <PageCourte
      cote="rework° / la lettre"
      titre="c'est confirmé."
      sousTitre="rendez-vous lundi."
    >
      <p className="t-texte-m md:t-texte-l max-w-[640px] text-carbone">
        La lettre arrive chaque lundi : le trio de la semaine, et ce qui vient
        d'entrer dans l'archive. En attendant, le trio de cette semaine est déjà
        en ligne.
      </p>
      <div className="mt-8 flex flex-wrap gap-3 md:mt-10">
        <Bouton href={LIENS.trio}>Le trio de la semaine</Bouton>
        <Bouton type="verre" href={LIENS.index}>
          Explorer l'archive
        </Bouton>
      </div>
    </PageCourte>
  );
}
