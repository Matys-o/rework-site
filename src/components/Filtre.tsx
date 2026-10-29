import { cn } from "../lib/cn";
import { Compteur } from "./Compteur";

type FiltreProps = {
  label: string;
  compte?: number;
  couleur?: string;
  actif?: boolean;
  /** Fond au repos : verre (défaut) ou blanc cerclé d'encre (menu) */
  ton?: "verre" | "blanc";
  href?: string;
  onClick?: () => void;
};

// Filtre — Défaut (verre) · Survol (blanc) · Actif (encre)
export function Filtre({ label, compte, couleur = "var(--color-signal)", actif = false, ton = "verre", href, onClick }: FiltreProps) {
  const classes = cn(
    "inline-flex min-h-11 cursor-pointer items-center gap-2.5 rounded-pill py-[11px] pr-[18px] pl-3.5 transition-colors duration-240 ease-rw",
    actif
      ? "border border-encre bg-encre text-papier"
      : ton === "blanc"
        ? "border border-encre bg-blanc text-encre shadow-pill transition-[translate,box-shadow] hover:-translate-y-0.5 hover:shadow-repos"
        : "verre-pill text-encre hover:border-encre/15 hover:bg-blanc",
  );
  const contenu = (
    <>
      <span aria-hidden className="size-2.5 rounded-full" style={{ background: couleur }} />
      <span className="t-cote-m">{label}</span>
      {compte !== undefined && (
        <span className={cn("t-cote-s", actif ? "text-papier" : "text-graphite")}>
          <Compteur valeur={compte} chiffres={3} />
        </span>
      )}
    </>
  );

  return href ? (
    <a href={href} onClick={onClick} className={cn("group", classes)}>
      {contenu}
    </a>
  ) : (
    <button type="button" aria-pressed={actif} onClick={onClick} className={cn("group", classes)}>
      {contenu}
    </button>
  );
}
