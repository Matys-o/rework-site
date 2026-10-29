import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router";
import { cn } from "../lib/cn";
import { LIENS } from "../lib/liens";
import { EASE_REVELE, navigation } from "../lib/mouvement";
import { Icone } from "./Icone";
import { Lien } from "./Lien";
import { Logo } from "./Logo";
import { Menu } from "./Menu";

const ENTREES = [
  { label: "Index", href: LIENS.index, actif: (p: string) => p === "/index" || p.startsWith("/marque/") },
  { label: "Domaines", href: LIENS.domaines, actif: () => false },
  { label: "Manifeste", href: LIENS.manifeste, actif: (p: string) => p === "/manifeste" },
  { label: "Contact", href: LIENS.contact, actif: () => false },
];

type NavProps = {
  className?: string;
  /** Action du bouton « Chercher » ; par défaut, ouvre la recherche de l'index */
  onChercher?: () => void;
  /** Page sombre : le verre est épaissi pour garder le logo lisible */
  surSombre?: boolean;
};

// Nav — verre pill, toujours flottante (fixe au scroll). Le bouton ≡ ouvre le menu plein écran. ⌘K / Ctrl+K = chercher.
export function Nav({ className, onChercher, surSombre = false }: NavProps) {
  const { pathname } = useLocation();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const fermerMenu = useCallback(() => setMenuOuvert(false), []);

  const chercher = useCallback(() => {
    if (onChercher) onChercher();
    else navigation.aller(LIENS.recherche);
  }, [onChercher]);

  // Se rétracte quand on descend, revient quand on remonte ; le verre s'épaissit après 100 px
  const reduit = useReducedMotion();
  const { scrollY } = useScroll();
  const [cachee, setCachee] = useState(false);
  const [opaque, setOpaque] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => {
    const delta = y - (scrollY.getPrevious() ?? y);
    setOpaque(y > 100);
    if (y < 160) setCachee(false);
    else if (delta > 4) setCachee(true);
    else if (delta < -4) setCachee(false);
  });
  const visible = !cachee || menuOuvert || reduit;

  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setMenuOuvert(false);
        chercher();
      }
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [chercher]);

  return (
    <>
      <motion.header
        className={cn("fixed inset-x-4 top-4 z-50 mx-auto max-w-[1280px] md:top-6", className)}
        style={{ viewTransitionName: "nav" }}
        initial={false}
        animate={{ y: visible ? 0 : "-140%" }}
        transition={{ duration: 0.45, ease: EASE_REVELE }}
      >
        <nav
          className={cn(
            "verre-pill relative flex h-[60px] items-center justify-between rounded-pill pr-[7px] pl-[19px] md:h-[76px] md:pr-3 md:pl-[30px]",
            surSombre && "bg-papier/90!",
          )}
        >
          {/* Verre plus opaque après 100 px : un voile dont seule l'opacité varie */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 rounded-pill bg-papier/80"
            initial={false}
            animate={{ opacity: opaque ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />
          {/* py + marge négative : zone tactile de 44 px sans changer la mise en page */}
          <a
            href={LIENS.accueil}
            aria-label="rework° — accueil"
            aria-current={pathname === "/" ? "page" : undefined}
            className="-my-2.5 py-2.5"
          >
            <Logo className="text-[24px] md:text-[30px]" />
          </a>

          <ul className="hidden items-center gap-9 lg:flex">
            {ENTREES.map((l) => (
              <li key={l.label}>
                <Lien href={l.href} actif={l.actif(pathname)}>
                  {l.label}
                </Lien>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={chercher}
              className="hidden h-[52px] cursor-pointer items-center gap-2.5 rounded-pill bg-encre px-[18px] text-papier transition-colors duration-240 ease-rw hover:bg-signal md:flex"
            >
              <Icone nom="recherche" />
              <span className="text-[15px] leading-[1.5] font-medium">Chercher</span>
              <kbd className="t-cote-s font-mono">⌘K</kbd>
            </button>
            <button
              type="button"
              onClick={() => setMenuOuvert(true)}
              aria-label="Ouvrir le menu"
              aria-expanded={menuOuvert}
              className="grid size-11 cursor-pointer place-items-center rounded-pill bg-encre text-papier transition-[background-color,box-shadow] duration-240 ease-rw hover:bg-signal md:size-[52px] md:bg-blanc md:text-encre md:hover:bg-blanc md:hover:shadow-repos"
            >
              <Icone nom="menu" taille={22} className="size-5 md:size-[22px]" />
            </button>
          </div>
        </nav>
      </motion.header>
      <Menu ouvert={menuOuvert} onFermer={fermerMenu} />
    </>
  );
}
