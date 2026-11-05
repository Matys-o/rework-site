import { useEffect, useState } from "react";

type FenetreIntro = Window & { __reworkIntroFini?: boolean };

/** Vrai une fois l'intro rework° terminée (ou sautée / déjà vue). Gère l'événement déjà passé avant le montage. */
export function useIntroFinie() {
  const [fini, setFini] = useState(() => typeof window !== "undefined" && !!(window as FenetreIntro).__reworkIntroFini);
  useEffect(() => {
    if ((window as FenetreIntro).__reworkIntroFini) {
      setFini(true);
      return;
    }
    const surFin = () => setFini(true);
    window.addEventListener("rework:intro-fin", surFin, { once: true });
    return () => window.removeEventListener("rework:intro-fin", surFin);
  }, []);
  return fini;
}
