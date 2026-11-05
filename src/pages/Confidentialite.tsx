import type { ReactNode } from "react";
import { Apparition } from "../components/Apparition";
import { EnTetePage } from "../components/EnTetePage";
import { Footer } from "../components/Footer";
import { Conteneur } from "../components/Grille";
import { Nav } from "../components/Nav";
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
      "Votre adresse e-mail. Rien d'autre : pas de nom, pas de profil, pas de revente, pas de publicité.",
  },
  {
    titre: "À quoi elle sert",
    texte:
      "À vous envoyer la lettre de rework°, une fois par semaine : les trios de la semaine et les nouvelles entrées. Et, une seule fois, l'e-mail qui confirme votre inscription.",
  },
  {
    titre: "Où elle est",
    texte:
      "Chez Brevo, le service qui envoie la lettre, hébergé dans l'Union européenne. Comme la plupart des lettres, Brevo indique si elle a été ouverte et quels liens ont été cliqués : ça nous sert à savoir ce qui intéresse, jamais à vous cibler.",
  },
  {
    titre: "Combien de temps",
    texte:
      "Tant que vous restez inscrit·e. Après votre désinscription, l'adresse ne reste que sur la liste de blocage de Brevo, pour qu'on ne vous écrive plus jamais.",
  },
  {
    titre: "Mesure d'audience",
    texte:
      "Le site compte ses visites avec Umami, sans cookies : ni votre adresse IP ni rien qui permette de vous identifier n'est conservé. On voit seulement des totaux : les pages lues, le pays, le type d'appareil, et le site d'où l'on arrive.",
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
        <EnTetePage pastille={cote} titre={titre} texte={sousTitre} />
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
      cote="Confidentialité"
      titre="Votre e-mail, rien d'autre."
      sousTitre="Ce que devient l'adresse laissée pour recevoir la lettre."
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
            fait, sans justification. Pour consulter, corriger ou supprimer votre adresse (RGPD), répondez simplement à une lettre : on s'en occupe à
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
      cote="La lettre"
      titre="C'est confirmé."
      sousTitre="Rendez-vous lundi."
    >
      <p className="t-texte-m md:t-texte-l max-w-[640px] text-carbone">
        La lettre arrive chaque lundi : les trios de la semaine et les nouvelles entrées. En attendant, le trio du jour est déjà en ligne.
      </p>
      <div className="mt-8 flex flex-wrap gap-3 md:mt-10">
        <Bouton href={LIENS.trio}>Le trio du jour</Bouton>
        <Bouton type="verre" href={LIENS.index}>
          Voir toutes les marques
        </Bouton>
      </div>
    </PageCourte>
  );
}
