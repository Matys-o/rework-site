import { useEffect } from "react";
import { useLocation } from "react-router";
import { rew, useRew } from "../../lib/rew/client";
import { Orbe } from "./CarteRew";

/**
 * Bouton flottant REW, sur toutes les pages : petite pastille en verre en bas à droite, qui ouvre le panneau sur place
 * (remplace l'entrée REW du menu). Masqué quand le panneau est ouvert. Ouvre aussi REW quand l'adresse porte ?rew=1.
 */
export function BoutonRew() {
  const { search } = useLocation();
  const { ouvert } = useRew();
  useEffect(() => {
    if (new URLSearchParams(search).get("rew") === "1") rew.ouvrir();
  }, [search]);
  if (ouvert) return null;
  return (
    <button
      type="button"
      onClick={() => rew.ouvrir()}
      aria-label="Parler à REW, ton curateur culturel"
      className="verre-pill t-cote-s fixed right-4 bottom-[max(16px,env(safe-area-inset-bottom))] z-50 inline-flex h-11 cursor-pointer items-center gap-2 rounded-pill pr-4 pl-3 text-encre shadow-pill transition-[translate,box-shadow] duration-240 ease-rw hover:-translate-y-0.5 hover:shadow-levee md:right-6 md:bottom-6"
    >
      <Orbe taille={16} />
      REW
    </button>
  );
}
