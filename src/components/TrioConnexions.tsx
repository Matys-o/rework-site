import type { CSSProperties } from "react";
import { DOMAINES } from "../data/brands";
import type { Trio } from "../data/trios";
import { cn } from "../lib/cn";
import { Apparition } from "./Apparition";
import { Aura } from "./Aura";
import { Fiche } from "./Fiche";

/** Phrase de liaison posée sur le fil — « R°328 → R°004 » puis la phrase */
type LiaisonProps = { de: string; vers: string; texte: string; className?: string; style?: CSSProperties };

function Liaison({ de, vers, texte, className, style }: LiaisonProps) {
  return (
    <p className={cn("verre rounded-[18px] bg-papier/70 px-4 py-3 text-left", className)} style={style}>
      <span className="t-cote-s block text-signal">
        {de} → {vers}
      </span>
      <span className="t-texte-s mt-1 block text-carbone">{texte}</span>
    </p>
  );
}

// Fil en pointillés — esprit « connexions » Are.na : chaque fiche descend sur un fil commun,
// la phrase de liaison est posée sur le fil, entre les deux fiches qu'elle relie.
const FIL = "border-encre/45 border-dashed";

/**
 * Trio — film → marque → marque, reliés par deux phrases.
 * Desktop (lg) : 3 fiches côte à côte, fil horizontal dessous. Mobile / tablette : fiches empilées, fil vertical.
 * Auras : une par entrée, à la couleur de son domaine, qui se mélangent derrière les fiches.
 */
export function TrioConnexions({ trio }: { trio: Trio }) {
  const [a, b, c] = trio.items;
  return (
    // --g : gouttière des fiches, partagée avec le calcul de position du fil desktop
    <div className="relative isolate" style={{ "--g": "clamp(24px, 3vw, 40px)" } as CSSProperties}>
      <div aria-hidden className="absolute -inset-x-[10%] -inset-y-[6%] -z-10">
        <Aura couleur={DOMAINES[a.domaine].couleur} className="top-[2%] left-0 aspect-square w-[55%] max-w-[700px] opacity-80" />
        <Aura couleur={DOMAINES[b.domaine].couleur} className="top-[34%] left-[24%] aspect-square w-[55%] max-w-[700px] opacity-80 lg:top-[8%]" />
        <Aura couleur={DOMAINES[c.domaine].couleur} className="top-[66%] right-0 aspect-square w-[55%] max-w-[700px] opacity-80 lg:top-[2%]" />
      </div>

      <ol className="grid justify-items-center gap-x-(--g) lg:grid-cols-3">
        {trio.items.map((m, i) => (
          <li key={m.slug} className="contents">
            <Apparition rang={i} className="w-full max-w-[400px] justify-self-center">
              <Fiche marque={m} />
            </Apparition>
            {/* Mobile / tablette : fil vertical et phrase posée dessus */}
            {i < 2 && (
              <div className="relative flex w-full max-w-[400px] justify-center py-7 lg:hidden">
                <span aria-hidden className={cn("absolute inset-y-0 left-1/2 border-l-[1.5px]", FIL)} />
                <Liaison de={m.cote} vers={trio.items[i + 1].cote} texte={trio.liens[i]} className="relative w-full max-w-[340px]" />
              </div>
            )}
          </li>
        ))}
      </ol>

      {/* Desktop : branches sous chaque fiche (centres de colonne), fil horizontal, phrases au milieu des gouttières */}
      <div className="relative mt-2 hidden h-[150px] lg:block">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            aria-hidden
            className="absolute top-0"
            style={{ left: `calc((100% - 2 * var(--g)) / 6 * ${2 * i + 1} + var(--g) * ${i})` }}
          >
            <span className="absolute -top-1 -left-[3.5px] size-[7px] rounded-full bg-signal" />
            <span className={cn("absolute top-0 left-0 h-[72px] border-l-[1.5px]", FIL)} />
          </span>
        ))}
        <span
          aria-hidden
          className={cn("absolute top-[72px] border-t-[1.5px]", FIL)}
          style={{ left: "calc((100% - 2 * var(--g)) / 6)", right: "calc((100% - 2 * var(--g)) / 6)" }}
        />
        {[0, 1].map((i) => (
          <Liaison
            key={i}
            de={trio.items[i].cote}
            vers={trio.items[i + 1].cote}
            texte={trio.liens[i]}
            className="absolute top-[72px] w-[min(320px,30%)] -translate-x-1/2 -translate-y-1/2"
            // Milieu de la gouttière entre deux fiches
            style={{ left: `calc((100% - 2 * var(--g)) / 3 * ${i + 1} + var(--g) * ${i + 0.5})` }}
          />
        ))}
      </div>
    </div>
  );
}
