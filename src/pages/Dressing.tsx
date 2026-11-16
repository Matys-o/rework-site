// Dressing : des tenues repérées sur Pinterest et Cosmos, recomposées avec les marques de l'archive, un budget au choix par pièce.
// /dressing (tenues + sélection de la semaine), /dressing/:slug (fiche tenue, ?b=1-2-2-3), /dressing/selections (archive).
import { useMemo, type CSSProperties } from "react";
import { Navigate, useParams, useSearchParams } from "react-router";
import { Apparition } from "../components/Apparition";
import { CartePiece } from "../components/Dressing/CartePiece";
import { EnTetePage } from "../components/EnTetePage";
import { FicheDossier } from "../components/Fiche";
import { Footer } from "../components/Footer";
import { Conteneur } from "../components/Grille";
import { Nav } from "../components/Nav";
import { Orbe } from "../components/Rew/CarteRew";
import { DOMAINES } from "../data/brands";
import {
  NIVEAUX_BUDGET,
  SIGNES,
  STYLES,
  TENUES_PUBLIEES,
  TENUE_PAR_SLUG,
  choixDepuisUrl,
  choixVersUrl,
  formatPrix,
  fourchette,
  lienTenue,
  niveauProche,
  niveauxDispo,
  produitDispo,
  tenuesProches,
  totalChoix,
  type Choix,
  type NiveauBudget,
  type Tenue,
} from "../data/dressing";
import {
  selectionCourante,
  selectionsPubliees,
  type Selection,
} from "../data/selections";
import { cn } from "../lib/cn";
import { LIENS } from "../lib/liens";
import { metaDressing, metaSelections, metaTenue } from "../lib/meta";
import { rew } from "../lib/rew/client";
import { useMeta } from "../lib/useMeta";

const PHRASE =
  "Des tenues repérées sur Pinterest et Cosmos, recomposées avec les marques de l'archive. Choisis ton budget pièce par pièce.";
const GENRES = [
  { id: "", label: "Tous" },
  { id: "homme", label: "Homme" },
  { id: "femme", label: "Femme" },
] as const;

const fourchetteTexte = (t: Tenue) => {
  const f = fourchette(t);
  return f.min === f.max
    ? formatPrix(f.min)
    : `de ${formatPrix(f.min)} à ${formatPrix(f.max)}`;
};
const saisonGenre = (t: Tenue) =>
  [t.genre === "homme" ? "Homme" : "Femme", t.saison]
    .filter(Boolean)
    .join(" · ");

function Chip({
  actif,
  onClick,
  children,
}: {
  actif: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      className={cn(
        "t-cote-s min-h-11 cursor-pointer rounded-pill border px-4 transition-colors duration-240 ease-rw",
        actif
          ? "border-encre bg-encre text-papier"
          : "border-encre/15 bg-blanc/60 text-encre hover:border-encre/40",
      )}
    >
      {children}
    </button>
  );
}

/** Carte de tenue : la fiche à onglet du site, image de la tenue en couverture */
function CarteTenue({ t }: { t: Tenue }) {
  return (
    <FicheDossier
      onglet={t.id}
      domaine={DOMAINES.mode}
      meta={saisonGenre(t)}
      titre={t.style}
      description={`${t.phrase} ${fourchetteTexte(t)}.`}
      image={t.image}
      initiale={t.style[0]}
      pastille={t.credit}
      href={lienTenue(t.slug)}
      className="max-w-none"
    />
  );
}

// ── Sélection de la semaine ──

export function SelectionSemaine({
  selection,
  titreNiveau = "h2",
}: {
  selection: Selection;
  titreNiveau?: "h2" | "h3";
}) {
  const Titre = titreNiveau;
  return (
    <section aria-label={`Les sélections de la semaine ${selection.numero}`}>
      <p className="t-cote-s md:t-cote-m text-signal">
        / Les sélections de la semaine — semaine {selection.numero}
      </p>
      <Titre className="mt-2 font-display text-[clamp(30px,4vw,52px)] leading-[0.95] font-semibold tracking-[-0.03em]">
        {selection.theme}
      </Titre>
      <p className="mt-2 max-w-[640px] font-serif text-[clamp(20px,2.2vw,28px)] leading-[1.15] italic">
        {selection.phrase}
      </p>
      <div className="-mx-[var(--marge)] mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-[var(--marge)] pb-3 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0 xl:grid-cols-4">
        {selection.produits.map((p) => (
          <CartePiece
            key={p.id}
            produit={p}
            compacte
            libelleBouton="Voir ↗"
            className="w-[68vw] max-w-[280px] shrink-0 snap-start md:w-auto md:max-w-none"
          />
        ))}
      </div>
    </section>
  );
}

// ── /dressing ──

export default function Dressing() {
  useMeta(metaDressing());
  const [params, setParams] = useSearchParams();
  const genre = params.get("genre") ?? "";
  const style = params.get("style") ?? "";
  const selection = selectionCourante();
  const tenues = TENUES_PUBLIEES.filter(
    (t) => (!genre || t.genre === genre) && (!style || t.style === style),
  );
  const filtrer = (cle: string, v: string) => {
    const p = new URLSearchParams(params);
    if (v) p.set(cle, v);
    else p.delete(cle);
    setParams(p, { replace: true, preventScrollReset: true });
  };

  return (
    <>
      <Nav />
      <main className="overflow-x-clip">
        <EnTetePage titre="Dressing" texte={PHRASE}>
          <div
            className="mt-7 flex flex-wrap gap-2 md:mt-9"
            role="group"
            aria-label="Filtrer les tenues"
          >
            {GENRES.map((g) => (
              <Chip
                key={g.id}
                actif={genre === g.id}
                onClick={() => filtrer("genre", g.id)}
              >
                {g.label}
              </Chip>
            ))}
            <span aria-hidden className="mx-1 w-px self-stretch bg-encre/15" />
            {STYLES.map((s) => (
              <Chip
                key={s}
                actif={style === s}
                onClick={() => filtrer("style", style === s ? "" : s)}
              >
                {s}
              </Chip>
            ))}
          </div>
        </EnTetePage>

        {selection && (
          <Conteneur className="pt-14 md:pt-20">
            <Apparition>
              <SelectionSemaine selection={selection} />
              <a
                href={LIENS.selections}
                className="t-cote-s mt-4 inline-flex min-h-11 items-center text-graphite underline underline-offset-4 transition-colors hover:text-signal"
              >
                Sélections précédentes →
              </a>
            </Apparition>
          </Conteneur>
        )}

        <Conteneur className="pt-16 pb-24 md:pt-24 md:pb-32">
          <p className="t-cote-s md:t-cote-m text-signal">
            / Les tenues — {tenues.length}
          </p>
          {tenues.length ? (
            <div className="mt-6 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {tenues.map((t) => (
                <CarteTenue key={t.slug} t={t} />
              ))}
            </div>
          ) : (
            <p className="mt-6 text-graphite">
              Aucune tenue pour ce filtre pour l'instant.
            </p>
          )}
        </Conteneur>
      </main>
      <Footer />
    </>
  );
}

// ── /dressing/:slug ──

function SelecteurNiveau({
  piece,
  choix,
  onChoix,
  nom,
}: {
  piece: Tenue["pieces"][number];
  choix: NiveauBudget | null;
  onChoix: (n: NiveauBudget) => void;
  nom: string;
}) {
  const dispo = niveauxDispo(piece);
  return (
    <div
      role="radiogroup"
      aria-label={`Budget pour : ${nom}`}
      className="verre-pill inline-flex rounded-pill p-1"
    >
      {NIVEAUX_BUDGET.map((n) => {
        const ok = dispo.includes(n);
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={choix === n}
            disabled={!ok}
            onClick={() => onChoix(n)}
            title={ok ? undefined : "Pas encore de pièce à ce budget"}
            className={cn(
              "t-cote-s min-h-11 min-w-12 rounded-pill px-3 transition-colors duration-200 ease-rw",
              choix === n ? "bg-encre text-papier" : "text-encre",
              ok
                ? "cursor-pointer hover:bg-encre/8"
                : "cursor-not-allowed text-encre/25 line-through",
              choix === n && "hover:bg-encre",
            )}
          >
            {SIGNES[n]}
          </button>
        );
      })}
    </div>
  );
}

export function TenuePage() {
  const { slug = "" } = useParams();
  const t = TENUE_PAR_SLUG.get(slug);
  const [params, setParams] = useSearchParams();
  useMeta(t ? metaTenue(t) : null);
  const choix: Choix = useMemo(
    () => (t ? choixDepuisUrl(t, params.get("b")) : []),
    [t, params],
  );
  if (!t || !TENUES_PUBLIEES.includes(t))
    return <Navigate to={LIENS.dressing} replace />;

  const changer = (c: Choix) => {
    const p = new URLSearchParams(params);
    p.set("b", choixVersUrl(c));
    setParams(p, { replace: true, preventScrollReset: true });
  };
  const tout = (n: NiveauBudget) =>
    changer(t.pieces.map((p) => niveauProche(p, n)));
  const total = totalChoix(t, choix);
  const proches = tenuesProches(t);

  return (
    <>
      <Nav />
      <main className="overflow-x-clip">
        <Conteneur className="pt-[96px] md:pt-[128px]">
          <a
            href={LIENS.dressing}
            className="t-cote-s inline-flex min-h-11 items-center text-graphite transition-colors hover:text-signal"
          >
            ← Dressing
          </a>
          <div className="mt-3 grid gap-8 md:mt-5 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-12">
            {/* Image de la tenue, sticky sur desktop */}
            <figure className="md:sticky md:top-24 md:self-start">
              <div className="relative overflow-hidden rounded-dossier bg-brume">
                {t.image ? (
                  <img
                    src={t.image}
                    alt={`Tenue ${t.style} : ${t.pieces.map((p) => p.description.toLowerCase()).join(", ")}`}
                    className="block aspect-[4/5] w-full object-cover md:aspect-auto md:max-h-[78vh]"
                  />
                ) : (
                  <div className="grid aspect-[4/5] place-items-center text-graphite">
                    Image à venir
                  </div>
                )}
              </div>
              <figcaption className="t-cote-s mt-3 text-graphite">
                Image : {t.credit} —{" "}
                <a
                  href={t.imageSource}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 transition-colors hover:text-signal"
                >
                  voir l'original ↗
                </a>
              </figcaption>
            </figure>

            <div>
              <p className="t-cote-s md:t-cote-m text-signal">
                R° {t.id} — {saisonGenre(t)}
              </p>
              <h1 className="mt-2 font-display text-[clamp(40px,6vw,84px)] leading-[0.9] font-semibold tracking-[-0.04em]">
                {t.style}
              </h1>
              <p className="mt-3 font-serif text-[clamp(22px,2.4vw,32px)] leading-[1.1] italic">
                {t.phrase}
              </p>

              {/* Raccourcis + total, panneau en verre */}
              <div className="verre sticky top-[76px] z-20 mt-7 flex flex-wrap items-center justify-between gap-3 rounded-[22px] p-3 md:top-24">
                <div
                  className="flex flex-wrap gap-1.5"
                  role="group"
                  aria-label="Choisir le même budget pour toutes les pièces"
                >
                  {NIVEAUX_BUDGET.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => tout(n)}
                      className="t-cote-s min-h-11 cursor-pointer rounded-pill border border-encre/15 bg-blanc/70 px-3.5 transition-colors duration-200 ease-rw hover:border-encre"
                    >
                      Tout en {SIGNES[n]}
                    </button>
                  ))}
                </div>
                <p className="pr-1 text-right" aria-live="polite">
                  <span className="t-cote-s block text-graphite">
                    Total de la tenue
                  </span>
                  <span className="text-[24px] leading-none font-medium tabular-nums">
                    {formatPrix(total)}
                  </span>
                </p>
              </div>

              <ol className="mt-6 flex flex-col gap-7">
                {t.pieces.map((p, i) => {
                  const n = choix[i];
                  const produit = n ? produitDispo(p.options[n]) : undefined;
                  return (
                    <li key={i}>
                      <div className="flex flex-wrap items-end justify-between gap-3">
                        <div className="min-w-0">
                          <p className="t-cote-s text-signal">
                            {String(i + 1).padStart(2, "0")} — {p.role}
                          </p>
                          <p className="mt-1 text-[17px] leading-[1.3]">
                            {p.description}
                          </p>
                        </div>
                        <SelecteurNiveau
                          piece={p}
                          nom={p.role}
                          choix={n}
                          onChoix={(v) =>
                            changer(choix.map((c, j) => (j === i ? v : c)))
                          }
                        />
                      </div>
                      <div className="mt-3 grid">
                        {produit ? (
                          <CartePiece
                            key={produit.id}
                            produit={produit}
                            className="dressing-fondu [grid-area:1/1]"
                          />
                        ) : (
                          <p className="rounded-[22px] border border-dashed border-encre/15 p-4 text-[14px] text-graphite">
                            Pièce encore en recherche : aucune référence
                            vérifiée pour l'instant.
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>

              <div className="mt-10 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    rew.ouvrir({
                      texte: `Propose-moi une variante de la tenue « ${t.style} » du Dressing (${t.id}, ${t.genre}) : ${t.pieces.map((p) => p.description.toLowerCase()).join(", ")}. Budget : `,
                    })
                  }
                  className="t-cote-s inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-pill bg-encre px-5 text-papier transition-colors duration-240 ease-rw hover:bg-signal"
                >
                  <Orbe taille={14} /> Demander à REW une variante
                </button>
              </div>
            </div>
          </div>
        </Conteneur>

        {proches.length > 0 && (
          <Conteneur className="pt-20 pb-24 md:pt-28 md:pb-32">
            <p className="t-cote-s md:t-cote-m text-signal">/ Tenues proches</p>
            <div className="mt-6 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {proches.map((x) => (
                <CarteTenue key={x.slug} t={x} />
              ))}
            </div>
          </Conteneur>
        )}
      </main>
      <Footer />
    </>
  );
}

// ── /dressing/selections ──

export function SelectionsPage() {
  useMeta(metaSelections());
  const liste = selectionsPubliees();
  return (
    <>
      <Nav />
      <main className="overflow-x-clip">
        <EnTetePage
          titre="Les sélections"
          texte="Chaque semaine, six à huit pièces autour d'un thème de saison, de marques différentes et à tous les budgets."
        />
        <Conteneur className="flex flex-col gap-20 pt-14 pb-24 md:gap-28 md:pt-20 md:pb-32">
          {liste.map((s, i) => (
            <Apparition key={s.semaine}>
              <div style={{ "--i": i } as CSSProperties}>
                <SelectionSemaine selection={s} />
              </div>
            </Apparition>
          ))}
          <a
            href={LIENS.dressing}
            className="t-cote-s inline-flex min-h-11 items-center text-graphite underline underline-offset-4 hover:text-signal"
          >
            ← Retour au Dressing
          </a>
        </Conteneur>
      </main>
      <Footer />
    </>
  );
}

