import { useEffect } from "react";
import { useLocation } from "react-router";
import Accueil from "../../pages/Accueil";
import { rew, useRew } from "../../lib/rew/client";
import { Orbe } from "./CarteRew";

/** /rew (lien partageable) : l'accueil, avec REW ouvert par-dessus */
export function RouteRew() {
  useEffect(() => {
    rew.ouvrir();
  }, []);
  return <Accueil />;
}

/** Mobile, hors accueil : petit bouton rond noir avec l'orbe, en bas à droite */
export function BoutonRewMobile() {
  const { pathname } = useLocation();
  const { ouvert } = useRew();
  if (pathname === "/" || pathname === "/rew" || ouvert) return null;
  return (
    <button
      type="button"
      onClick={() => rew.ouvrir()}
      aria-label="Parler à REW, ton curateur culturel"
      className="fixed right-4 bottom-[max(16px,env(safe-area-inset-bottom))] z-50 grid size-14 cursor-pointer place-items-center rounded-full bg-encre shadow-levee md:hidden"
    >
      <Orbe taille={30} />
    </button>
  );
}
