import type { CSSProperties } from "react";
import { MARQUES } from "../../data/brands";
import { dateCourte, formatPrix, type Produit } from "../../data/dressing";
import { cn } from "../../lib/cn";
import { lienMarque } from "../../lib/liens";

const SLUG_MARQUE = new Map(MARQUES.map((m) => [m.id, m.slug]));
export const ficheMarque = (p: Pick<Produit, "brandId">) => {
  const slug = p.brandId !== null ? SLUG_MARQUE.get(p.brandId) : undefined;
  return slug ? lienMarque(slug) : undefined;
};

/**
 * Carte produit du Dressing : image officielle, marque (→ fiche rework°), nom exact, couleur, prix constaté et date,
 * bouton « Voir la pièce ↗ » vers la page produit officielle. Toutes les données viennent de products.json.
 */
export function CartePiece({
  produit,
  compacte,
  libelleBouton = "Voir la pièce ↗",
  raison,
  className,
  style,
}: {
  produit: Pick<
    Produit,
    | "brandId"
    | "brandName"
    | "name"
    | "color"
    | "price"
    | "checkedAt"
    | "url"
    | "img"
  > & { retailer?: string; horsArchive?: boolean };
  compacte?: boolean;
  libelleBouton?: string;
  raison?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const fiche = ficheMarque(produit);
  return (
    <article
      className={cn(
        "flex gap-4 rounded-[22px] border border-encre/8 bg-blanc p-3 pr-4 text-encre shadow-repos",
        compacte && "flex-col gap-3 pr-3",
        className,
      )}
      style={style}
    >
      <a
        href={produit.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "relative block shrink-0 overflow-hidden rounded-[14px] bg-papier",
          compacte
            ? "aspect-[4/5] w-full"
            : "aspect-[4/5] w-[104px] md:w-[120px]",
        )}
        tabIndex={-1}
        aria-hidden
      >
        {produit.img && (
          <img
            src={produit.img}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-contain"
          />
        )}
      </a>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="t-cote-s text-graphite">
          {fiche ? (
            <a
              href={fiche}
              className="text-encre underline decoration-encre/20 underline-offset-2 transition-colors hover:text-signal"
            >
              {produit.brandName}
            </a>
          ) : (
            <span className="text-encre">{produit.brandName}</span>
          )}
          {produit.horsArchive && " · hors archive"}
        </p>
        <h4
          className="mt-1 text-[15px] leading-[1.3] font-medium"
          translate="no"
        >
          {produit.name}
        </h4>
        <p className="mt-0.5 text-[13px] text-graphite">{produit.color}</p>
        {raison && (
          <p className="mt-1.5 font-serif text-[16px] leading-[1.25] italic">
            {raison}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-3 gap-y-2 pt-3">
          <p>
            <span className="block text-[18px] leading-none font-medium tabular-nums">
              {formatPrix(produit.price)}
            </span>
            <span className="t-cote-s mt-1 block text-graphite">
              Prix constaté le {dateCourte(produit.checkedAt)}
              {produit.retailer && ` · chez ${produit.retailer}`}
            </span>
          </p>
          <a
            href={produit.url}
            target="_blank"
            rel="noopener noreferrer"
            className="t-cote-s inline-flex min-h-11 items-center rounded-pill bg-encre px-4 text-papier transition-colors duration-240 ease-rw hover:bg-signal"
          >
            {libelleBouton}
          </a>
        </div>
      </div>
    </article>
  );
}
