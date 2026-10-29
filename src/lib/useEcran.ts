import { useSyncExternalStore } from "react";

/** Vrai si la media query correspond (ex. "(min-width: 768px)") */
export function useEcran(requete: string) {
  return useSyncExternalStore(
    (notifier) => {
      const mql = window.matchMedia(requete);
      mql.addEventListener("change", notifier);
      return () => mql.removeEventListener("change", notifier);
    },
    () => window.matchMedia(requete).matches,
    () => false,
  );
}
