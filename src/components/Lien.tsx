import type { AnchorHTMLAttributes } from "react";
import { cn } from "../lib/cn";

type LienProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  ton?: "encre" | "papier";
  /** Page courante : le signal ° reste allumé */
  actif?: boolean;
};

// Lien — le signal ° apparaît au survol (et reste allumé sur la page courante)
export function Lien({ ton = "encre", actif = false, className, children, ...props }: LienProps) {
  return (
    <a
      aria-current={actif ? "page" : undefined}
      className={cn(
        "group inline-flex items-center gap-[5px] py-1.5 transition-colors duration-240 ease-rw",
        ton === "encre"
          ? cn("text-[15px] leading-[1.5] font-medium hover:text-encre", actif ? "text-encre" : "text-carbone")
          : cn("t-texte-m hover:text-papier", actif ? "text-papier" : "text-papier/85"),
        className,
      )}
      {...props}
    >
      {children}
      <span
        aria-hidden
        className={cn(
          "size-[7px] rounded-full bg-signal transition duration-240 ease-rw group-hover:scale-100 group-hover:opacity-100",
          actif ? "scale-100 opacity-100" : "scale-50 opacity-0",
        )}
      />
    </a>
  );
}
