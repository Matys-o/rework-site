import { cn } from "../lib/cn";

// Pictogrammes Rework — trait 1,75 · bouts ronds (DA 07). Tracés repris des assets Figma.
const TRACES = {
  fleche: <path d="M3 9H14.25M9.75 13.5L14.25 9L9.75 4.5" />,
  "fleche-diag": <path d="M5.25 12.75L12.75 5.25M12.75 12V5.25H6" />,
  recherche: (
    <>
      <path d="M13.125 8.25C13.125 10.9424 10.9424 13.125 8.25 13.125C5.55761 13.125 3.375 10.9424 3.375 8.25C3.375 5.55761 5.55761 3.375 8.25 3.375C10.9424 3.375 13.125 5.55761 13.125 8.25Z" />
      <path d="M12 12L15.375 15.375" />
    </>
  ),
  menu: <path d="M3 6.75H15M3 11.25H10.5" />,
  fermer: <path d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5" />,
  grille: (
    <>
      <rect x="3" y="3" width="4.875" height="4.875" rx="1.125" />
      <rect x="10.125" y="3" width="4.875" height="4.875" rx="1.125" />
      <rect x="3" y="10.125" width="4.875" height="4.875" rx="1.125" />
      <rect x="10.125" y="10.125" width="4.875" height="4.875" rx="1.125" />
    </>
  ),
  liste: <path d="M3 4.5H15M3 9H15M3 13.5H15" />,
} as const;

export type IconeNom = keyof typeof TRACES;

type IconeProps = {
  nom: IconeNom;
  taille?: number;
  className?: string;
};

export function Icone({ nom, taille = 18, className }: IconeProps) {
  return (
    <svg
      aria-hidden
      width={taille}
      height={taille}
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
    >
      {TRACES[nom]}
    </svg>
  );
}

/** Flèche → qui devient ↗ au survol du parent `.group` */
export function FlecheSurvol({ taille = 18, className }: { taille?: number; className?: string }) {
  return (
    <span className={cn("relative inline-grid shrink-0", className)} style={{ width: taille, height: taille }}>
      <Icone
        nom="fleche"
        taille={taille}
        className="col-start-1 row-start-1 transition duration-240 ease-rw group-hover:translate-x-1 group-hover:opacity-0"
      />
      <Icone
        nom="fleche-diag"
        taille={taille}
        className="col-start-1 row-start-1 -translate-x-1 translate-y-1 opacity-0 transition duration-240 ease-rw group-hover:translate-0 group-hover:opacity-100"
      />
    </span>
  );
}
