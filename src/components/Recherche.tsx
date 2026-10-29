import { useId } from "react";
import { cn } from "../lib/cn";
import { useEcran } from "../lib/useEcran";
import { Icone } from "./Icone";

type RechercheProps = {
  valeur: string;
  onChange: (valeur: string) => void;
  onSubmit?: () => void;
  className?: string;
};

// Recherche — clic = focus : liseré signal, bouton rouge. 60 px en mobile, 84 px en desktop.
export function Recherche({ valeur, onChange, onSubmit, className }: RechercheProps) {
  const id = useId();
  const large = useEcran("(min-width: 768px)");
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className={cn(
        "group verre flex h-[60px] w-full max-w-[720px] items-center gap-3 rounded-pill pr-[5px] pl-[19px] md:h-[84px] md:gap-4 md:pr-2.5 md:pl-7",
        "transition-[background-color,border-color] duration-240 ease-rw",
        "focus-within:border-[1.5px] focus-within:border-signal focus-within:bg-blanc",
        className,
      )}
    >
      <label htmlFor={id} className="sr-only">
        Chercher dans l'archive
      </label>
      <Icone nom="recherche" taille={24} className="size-5 text-encre md:size-6" />
      <input
        id={id}
        type="search"
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        placeholder={large ? "Chercher une marque, un film, une ville…" : "Chercher…"}
        autoComplete="off"
        className="t-texte-m md:t-texte-l min-w-0 flex-1 truncate bg-transparent text-encre caret-signal outline-none placeholder:text-graphite [&::-webkit-search-cancel-button]:hidden"
      />
      <button
        type="submit"
        aria-label="Lancer la recherche"
        className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-pill bg-encre text-blanc transition-colors duration-240 ease-rw group-focus-within:bg-signal md:size-16"
      >
        <Icone nom="fleche" taille={22} />
      </button>
    </form>
  );
}
