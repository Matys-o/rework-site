import { useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { defilerVers, lenis, navigation } from "../lib/mouvement";

/**
 * Navigation interne du site :
 *  · intercepte les clics sur les liens internes et navigue côté client, avec View Transition
 *    (fondu + montée 400 ms entre les pages, couverture partagée fiche → page marque — voir index.css) ;
 *  · remet le scroll en haut à chaque changement de page (ou va à l'ancre #…).
 * Sans View Transitions (navigateur ancien) ou en mouvement réduit : navigation simple, sans animation.
 */
export function Navigation() {
  const naviguer = useNavigate();
  const { pathname, hash } = useLocation();
  const reduit = useReducedMotion();
  const precedent = useRef(pathname);

  useEffect(() => {
    const aller = (vers: string) => naviguer(vers, { viewTransition: !reduit });
    navigation.definir(aller);

    const surClic = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const lien = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!lien || lien.target === "_blank" || lien.hasAttribute("download")) return;
      const url = new URL(lien.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      const memePage = url.pathname === window.location.pathname && url.search === window.location.search;
      if (memePage && url.hash) {
        // Ancre sur la page courante : défilement fluide
        e.preventDefault();
        defilerVers(document.getElementById(url.hash.slice(1)));
        return;
      }
      e.preventDefault();
      if (memePage && !url.hash) return;
      aller(url.pathname + url.search + url.hash);
    };

    document.addEventListener("click", surClic);
    return () => {
      document.removeEventListener("click", surClic);
      navigation.definir(null);
    };
  }, [naviguer, reduit]);

  // Changement de page : en haut, ou sur l'ancre. useLayoutEffect = avant la capture de la View Transition.
  useLayoutEffect(() => {
    if (precedent.current === pathname) return;
    precedent.current = pathname;
    if (hash) requestAnimationFrame(() => defilerVers(document.getElementById(hash.slice(1))));
    else lenis.haut();
  }, [pathname, hash]);

  return null;
}
