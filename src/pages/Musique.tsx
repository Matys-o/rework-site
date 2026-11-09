import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSearchParams } from "react-router";
import { Apparition } from "../components/Apparition";
import { Bouton } from "../components/Bouton";
import { EnTetePage } from "../components/EnTetePage";
import { Footer } from "../components/Footer";
import { Conteneur } from "../components/Grille";
import { Icone } from "../components/Icone";
import {
  CarteArtiste,
  CarteSortie,
  OngletsMusique,
  TitreSectionMusique,
} from "../components/Musique";
import { Nav } from "../components/Nav";
import { Recherche } from "../components/Recherche";
import { TiroirFiltres, type SectionTiroir } from "../components/TiroirFiltres";
import {
  ARTISTES,
  CLES_FILTRES_MUSIQUE,
  GENRES,
  LABELS,
  MOODS,
  PERIODES,
  SELECTION,
  SORTIES,
  TITRES_FILTRES_MUSIQUE,
  TYPES_SORTIE,
  UNIVERS_MUSIQUE,
  anneeArtiste,
  artiste,
  attributsArtiste,
  attributsSortie,
  chercherMusique,
  correspondMusique,
  genre,
  genreEtEnfants,
  genresRacines,
  libelleMusique,
  lienArtiste,
  lienGenre,
  lienSortie,
  nomGenre,
  nomsArtistes,
  normaliser,
  origineArtiste,
  scoreArtiste,
  scoreSortie,
  sortie,
  sousGenres,
  type Artiste,
  type AttributsMusique,
  type CleFiltreMusique,
  type SelectionMusique,
  type Sortie,
} from "../data/musique";
import { cn } from "../lib/cn";
import { metaMusique } from "../lib/metaMusique";
import { EASE_REVELE } from "../lib/mouvement";
import { useMeta } from "../lib/useMeta";

const definis = <T,>(liste: (T | undefined)[]) =>
  liste.filter((x): x is T => !!x);

// ── Lignes compactes (résultats de recherche, « À découvrir ») ──

function LigneMusique({
  href,
  image,
  carre,
  titre,
  meta,
  pastille,
}: {
  href: string;
  image?: string;
  carre?: boolean;
  titre: string;
  meta: string;
  pastille: string;
}) {
  return (
    <a
      href={href}
      className="group verre flex min-h-[84px] items-center gap-4 rounded-[24px] p-2.5 pr-5 transition-colors duration-240 ease-rw hover:bg-blanc"
    >
      <span
        className={cn(
          "relative size-16 shrink-0 overflow-hidden bg-brume",
          carre ? "rounded-[14px]" : "rounded-full",
        )}
      >
        {image && (
          <img
            src={image}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="t-titre-s block truncate" translate="no">
          {titre}
        </span>
        <span className="t-cote-s mt-1 block truncate text-graphite">
          {meta}
        </span>
      </span>
      <span className="t-cote-s hidden shrink-0 text-graphite sm:block">
        {pastille}
      </span>
      <span
        aria-hidden
        className="t-cote-m text-graphite transition-colors duration-240 ease-rw group-hover:text-signal"
      >
        →
      </span>
    </a>
  );
}

const ligneArtiste = (a: Artiste) => (
  <LigneMusique
    href={lienArtiste(a.slug)}
    image={a.image}
    titre={a.nom}
    meta={[origineArtiste(a), nomGenre(a.genres[0])]
      .filter(Boolean)
      .join(" · ")}
    pastille="Artiste"
  />
);
const ligneSortie = (s: Sortie) => (
  <LigneMusique
    href={lienSortie(s.slug)}
    image={s.cover}
    carre
    titre={s.titre}
    meta={[nomsArtistes(s), s.annee].filter(Boolean).join(" · ")}
    pastille={TYPES_SORTIE[s.type]}
  />
);

// ── Accueil Musique ──

function ResultatsGroupes({ q }: { q: string }) {
  const r = useMemo(() => chercherMusique(q), [q]);
  const total =
    r.artistes.length + r.sorties.length + r.genres.length + r.labels.length;
  if (!total)
    return (
      <div className="flex flex-col items-start gap-5 py-12">
        <p className="t-serif-m md:t-serif-l">Rien pour « {q} ».</p>
        <p className="t-texte-m max-w-[560px] text-graphite">
          Essayez un nom d'artiste, un titre d'album, une ville ou un genre : «
          techno », « rap français », « Cologne »…
        </p>
        <div className="flex flex-wrap gap-2">
          {genresRacines().map((g) => (
            <a
              key={g.id}
              href={lienGenre(g.slug)}
              className="t-cote-s verre-pill inline-flex min-h-10 items-center rounded-pill px-4 hover:bg-blanc"
            >
              {g.nom}
            </a>
          ))}
        </div>
      </div>
    );
  const groupe = (titre: string, n: number, contenu: ReactNode) =>
    n > 0 && (
      <section className="mt-10 first:mt-0">
        <p className="t-cote-s md:t-cote-m text-signal">
          / {titre} <span className="text-graphite">· {n}</span>
        </p>
        <div className="mt-4">{contenu}</div>
      </section>
    );
  return (
    <div aria-live="polite">
      {groupe(
        "Artistes",
        r.artistes.length,
        <ul className="grid gap-2.5 md:grid-cols-2">
          {r.artistes.slice(0, 8).map((a) => (
            <li key={a.id}>{ligneArtiste(a)}</li>
          ))}
        </ul>,
      )}
      {groupe(
        "Albums",
        r.sorties.length,
        <ul className="grid gap-2.5 md:grid-cols-2">
          {r.sorties.slice(0, 10).map((s) => (
            <li key={s.id}>{ligneSortie(s)}</li>
          ))}
        </ul>,
      )}
      {groupe(
        "Genres",
        r.genres.length,
        <ul className="flex flex-wrap gap-2">
          {r.genres.map((g) => (
            <li key={g.id}>
              <a
                href={lienGenre(g.slug)}
                className="t-cote-m verre-pill inline-flex min-h-11 items-center rounded-pill px-5 hover:bg-blanc"
              >
                {g.nom} →
              </a>
            </li>
          ))}
        </ul>,
      )}
      {groupe(
        "Labels",
        r.labels.length,
        <ul className="grid gap-2.5 md:grid-cols-2">
          {r.labels.map((l) => (
            <li key={l.id}>
              <a
                href={`/musique/albums?label=${l.id}`}
                className="group verre flex min-h-[64px] items-center justify-between gap-4 rounded-[24px] px-5 py-3 transition-colors duration-240 ease-rw hover:bg-blanc"
              >
                <span className="t-titre-s" translate="no">
                  {l.nom}
                </span>
                <span className="t-cote-s text-graphite group-hover:text-signal">
                  {l.artistes.length} artiste{l.artistes.length > 1 ? "s" : ""}{" "}
                  · {l.sorties.length} sortie{l.sorties.length > 1 ? "s" : ""} →
                </span>
              </a>
            </li>
          ))}
        </ul>,
      )}
    </div>
  );
}

export function MusiqueAccueil() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(() => params.get("q") ?? "");
  useEffect(() => {
    if ((params.get("q") ?? "") !== q)
      setParams(q ? { q } : {}, { replace: true });
  }, [q]);
  useMeta(metaMusique("accueil"));

  const aLaUne = definis(SELECTION.aLaUne.map(artiste));
  const aDecouvrir = definis(SELECTION.aDecouvrir.map(artiste));
  const essentiels = definis(SELECTION.essentiels.map(sortie));
  const loupe = genre(SELECTION.genreLoupe.genre);
  const idsLoupe = loupe ? genreEtEnfants(loupe.id) : [];
  const artistesLoupe = ARTISTES.filter((a) =>
    a.genres.some((g) => idsLoupe.includes(g)),
  );
  const sortiesLoupe = SORTIES.filter((s) =>
    s.genres.some((g) => idsLoupe.includes(g)),
  ).slice(0, 4);
  const [une, ...autresUne] = aLaUne;

  return (
    <>
      <Nav />
      <main className="overflow-x-clip">
        <EnTetePage
          pastille={`Univers ${UNIVERS_MUSIQUE.numero} · Musique`}
          titre="Musique."
          texte={`${ARTISTES.length} artistes et ${SORTIES.length} sorties choisis par la rédaction. Pas de lecteur : on vous dit pourquoi écouter, puis on vous envoie écouter.`}
        >
          <div className="mt-8 md:mt-[60px]">
            <Recherche
              valeur={q}
              onChange={setQ}
              aide="Chercher un artiste, un album, un genre, un label…"
            />
          </div>
          <div className="mt-6 pb-4 md:mt-9">
            <OngletsMusique actif="accueil" />
          </div>
        </EnTetePage>

        {q.trim() ? (
          <section className="pt-6 md:pt-12">
            <Conteneur>
              <ResultatsGroupes q={q} />
            </Conteneur>
          </section>
        ) : (
          <>
            {/* ── À la une ── */}
            {une && (
              <section className="pt-8 md:pt-16">
                <Conteneur>
                  <TitreSectionMusique
                    titre="À la une"
                    lien={{
                      href: "/musique/artistes",
                      label: "Tous les artistes",
                    }}
                  />
                  <Apparition className="mt-6">
                    <a
                      href={lienArtiste(une.slug)}
                      className="group relative isolate grid overflow-hidden rounded-[32px] bg-encre text-papier md:grid-cols-12 md:rounded-[40px]"
                    >
                      <div className="relative h-[300px] overflow-hidden md:col-span-7 md:h-[520px]">
                        <img
                          src={une.image}
                          alt={une.nom}
                          className="size-full object-cover transition-[scale] duration-700 ease-rw group-hover:scale-[1.03]"
                        />
                      </div>
                      <div className="flex flex-col justify-between gap-8 p-6 md:col-span-5 md:p-10">
                        <div>
                          <p className="t-cote-s text-[var(--color-aura-musique)]">
                            {une.cote} · {origineArtiste(une)}
                          </p>
                          <h2
                            className="mt-3 font-display text-[clamp(48px,7vw,96px)] leading-[0.9] font-extrabold tracking-[-0.05em]"
                            translate="no"
                          >
                            {une.nom}
                          </h2>
                          <p className="mt-2 font-serif text-[26px] italic md:text-[32px]">
                            {une.genres.map(nomGenre).join(" · ")}
                          </p>
                          <p className="t-texte-m mt-6 text-papier/80">
                            {une.description}
                          </p>
                        </div>
                        <span className="t-cote-m inline-flex items-center gap-2 group-hover:text-[var(--color-aura-musique)]">
                          Ouvrir la fiche →
                        </span>
                      </div>
                    </a>
                  </Apparition>
                  <ul className="mt-10 grid justify-items-center gap-y-[30px] md:grid-cols-2 md:gap-x-8 md:gap-y-[52px] xl:grid-cols-4">
                    {autresUne.map((a, i) => (
                      <Apparition
                        as="li"
                        rang={i}
                        key={a.id}
                        className="w-full max-w-[400px]"
                      >
                        <CarteArtiste artiste={a} />
                      </Apparition>
                    ))}
                  </ul>
                </Conteneur>
              </section>
            )}

            {/* ── À découvrir ── */}
            <section className="pt-16 md:pt-[120px]">
              <Conteneur>
                <TitreSectionMusique titre="À découvrir">
                  <h2 className="t-titre-l md:t-display-l mt-2.5">
                    Moins connus, à écouter maintenant.
                  </h2>
                </TitreSectionMusique>
                <ul className="mt-6 grid gap-2.5 md:mt-9 md:grid-cols-2">
                  {aDecouvrir.map((a, i) => (
                    <Apparition as="li" rang={i % 4} key={a.id}>
                      {ligneArtiste(a)}
                    </Apparition>
                  ))}
                </ul>
              </Conteneur>
            </section>

            {/* ── Albums essentiels ── */}
            <section className="pt-16 md:pt-[120px]">
              <Conteneur>
                <TitreSectionMusique
                  titre="Albums essentiels"
                  lien={{ href: "/musique/albums", label: "Tous les albums" }}
                >
                  <h2 className="t-titre-l md:t-display-l mt-2.5">
                    Ceux qu'on réécoute.
                  </h2>
                </TitreSectionMusique>
                <ul className="mt-6 grid justify-items-center gap-y-[30px] md:mt-9 md:grid-cols-2 md:gap-x-8 md:gap-y-[52px] xl:grid-cols-4">
                  {essentiels.map((s, i) => (
                    <Apparition
                      as="li"
                      rang={i % 4}
                      key={s.id}
                      className="w-full max-w-[400px]"
                    >
                      <CarteSortie sortie={s} />
                    </Apparition>
                  ))}
                </ul>
              </Conteneur>
            </section>

            {/* ── Genre à la loupe ── */}
            {loupe && (
              <section className="pt-16 md:pt-[120px]">
                <Conteneur>
                  <div className="relative isolate overflow-hidden rounded-[32px] bg-encre p-6 text-papier md:rounded-[40px] md:p-12">
                    <div
                      aria-hidden
                      className="absolute -top-40 -right-40 -z-10 size-[520px] rounded-full bg-[var(--color-aura-musique)] opacity-30 blur-[120px]"
                    />
                    <p className="t-cote-s md:t-cote-m text-[var(--color-aura-musique)]">
                      / Genre à la loupe
                    </p>
                    <div className="mt-4 grid gap-8 md:grid-cols-12 md:gap-x-10">
                      <div className="md:col-span-6">
                        <h2 className="font-display text-[clamp(48px,8vw,120px)] leading-[0.88] font-extrabold tracking-[-0.05em]">
                          {loupe.nom}.
                        </h2>
                        <p className="t-texte-m md:t-texte-l mt-6 text-papier/80">
                          {SELECTION.genreLoupe.texte}
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                          <Bouton type="signal" href={lienGenre(loupe.slug)}>
                            Explorer le genre
                          </Bouton>
                        </div>
                      </div>
                      <div className="md:col-span-6">
                        <p className="t-cote-s text-papier/60">
                          {artistesLoupe.length} artistes
                        </p>
                        <ul className="mt-3 flex flex-col gap-2">
                          {artistesLoupe.slice(0, 4).map((a) => (
                            <li key={a.id}>
                              <a
                                href={lienArtiste(a.slug)}
                                className="group flex items-center gap-4 rounded-[20px] border border-papier/15 p-2 pr-4 transition-colors duration-240 ease-rw hover:bg-papier/10"
                              >
                                <img
                                  src={a.image}
                                  alt=""
                                  loading="lazy"
                                  className="size-12 rounded-full object-cover"
                                />
                                <span
                                  className="t-titre-s flex-1 truncate"
                                  translate="no"
                                >
                                  {a.nom}
                                </span>
                                <span className="t-cote-s text-papier/60">
                                  {origineArtiste(a)}
                                </span>
                              </a>
                            </li>
                          ))}
                        </ul>
                        <ul className="mt-4 grid grid-cols-4 gap-2">
                          {sortiesLoupe.map((s) => (
                            <li key={s.id}>
                              <a
                                href={lienSortie(s.slug)}
                                className="block overflow-hidden rounded-[14px]"
                                aria-label={`${s.titre} — ${nomsArtistes(s)}`}
                              >
                                <img
                                  src={s.cover}
                                  alt=""
                                  loading="lazy"
                                  className="aspect-square w-full object-cover transition-[scale] duration-500 ease-rw hover:scale-105"
                                />
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </Conteneur>
              </section>
            )}

            {/* ── Tous les genres ── */}
            <section className="pt-16 md:pt-[120px]">
              <Conteneur>
                <TitreSectionMusique
                  titre="Par genre"
                  lien={{ href: "/musique/genres", label: "Tous les genres" }}
                />
                <ul className="mt-6 flex flex-wrap gap-2 md:gap-3">
                  {GENRES.map((g) => (
                    <li key={g.id}>
                      <a
                        href={lienGenre(g.slug)}
                        className={cn(
                          "inline-flex min-h-11 items-center rounded-pill px-5 transition-colors duration-240 ease-rw",
                          g.parent
                            ? "t-cote-s verre-pill hover:bg-blanc"
                            : "t-cote-m bg-encre text-papier hover:bg-signal",
                        )}
                      >
                        {g.nom}
                      </a>
                    </li>
                  ))}
                </ul>
              </Conteneur>
            </section>
          </>
        )}
        <div className="h-16 md:h-24" />
      </main>
      <Footer />
    </>
  );
}

// ── Listes filtrables : artistes et albums ──

const PAR_PAGE = 24;
type TriMusique = "pertinence" | "nom" | "annee";
const LIBELLES_TRI: Record<TriMusique, string> = {
  pertinence: "pertinence",
  nom: "A → Z",
  annee: "année ↓",
};
const ORDRE_TRIS: TriMusique[] = ["pertinence", "nom", "annee"];

type Entree<T> = {
  x: T;
  a: AttributsMusique;
  score: number;
  nom: string;
  annee: number | null;
};

function ListeMusique({ genreListe }: { genreListe: "artistes" | "albums" }) {
  const albums = genreListe === "albums";
  const cles = CLES_FILTRES_MUSIQUE.filter((k) => albums || k !== "type");
  const [params, setParams] = useSearchParams();
  const [limite, setLimite] = useState(PAR_PAGE);
  const [ouvert, setOuvert] = useState(false);
  const [q, setQ] = useState(() => params.get("q") ?? "");
  useEffect(() => {
    if ((params.get("q") ?? "") !== q) maj("q", q || null);
  }, [q]);
  useMeta(metaMusique(genreListe));

  const tri: TriMusique = ORDRE_TRIS.includes(params.get("tri") as TriMusique)
    ? (params.get("tri") as TriMusique)
    : "pertinence";
  const cleUrl = cles.map((k) => params.get(k) ?? "").join("|");
  const selection = useMemo(
    () =>
      Object.fromEntries(
        CLES_FILTRES_MUSIQUE.map((k) => [
          k,
          cles.includes(k)
            ? (params.get(k) ?? "").split(",").filter(Boolean)
            : [],
        ]),
      ) as SelectionMusique,
    [cleUrl],
  );
  const nbFiltres = cles.reduce((n, k) => n + selection[k].length, 0);

  const maj = (cle: string, valeur: string | null) => {
    setParams(
      (p) => {
        const s = new URLSearchParams(p);
        if (valeur) s.set(cle, valeur);
        else s.delete(cle);
        return s;
      },
      { replace: true },
    );
    setLimite(PAR_PAGE);
  };
  const basculer = (cle: string, v: string) => {
    const k = cle as CleFiltreMusique;
    const liste = selection[k].includes(v)
      ? selection[k].filter((x) => x !== v)
      : [...selection[k], v];
    maj(k, liste.join(",") || null);
  };
  const effacer = () => {
    setParams(
      (p) => {
        const s = new URLSearchParams(p);
        CLES_FILTRES_MUSIQUE.forEach((k) => s.delete(k));
        return s;
      },
      { replace: true },
    );
    setLimite(PAR_PAGE);
  };

  const base = useMemo(() => {
    const nq = normaliser(q);
    const liste: Entree<Artiste | Sortie>[] = albums
      ? SORTIES.map((s) => ({
          x: s,
          a: attributsSortie(s),
          score: scoreSortie(s, nq),
          nom: s.titre,
          annee: s.annee,
        }))
      : ARTISTES.map((a) => ({
          x: a,
          a: attributsArtiste(a),
          score: scoreArtiste(a, nq),
          nom: a.nom,
          annee: anneeArtiste(a),
        }));
    return liste.filter((e) => e.score > 0);
  }, [q, albums]);

  const resultats = useMemo(() => {
    const r = base.filter((e) => correspondMusique(e.a, selection));
    const ordre = (e: Entree<Artiste | Sortie>) => e.x.id;
    return r.sort((x, y) =>
      tri === "nom"
        ? x.nom.localeCompare(y.nom, "fr")
        : tri === "annee"
          ? (y.annee ?? 0) - (x.annee ?? 0)
          : y.score - x.score || ordre(x) - ordre(y),
    );
  }, [base, selection, tri]);

  // Compteurs : pour chaque filtre, les entrées qui passent tous les AUTRES filtres
  const comptes = useMemo(() => {
    const c = Object.fromEntries(
      cles.map((k) => [k, {} as Record<string, number>]),
    ) as Record<string, Record<string, number>>;
    for (const e of base)
      for (const k of cles) {
        if (!correspondMusique(e.a, selection, k)) continue;
        const valeurs = new Set(
          k === "genre"
            ? e.a.genre.flatMap((g) => [
                g,
                genre(g)?.parent,
                genre(genre(g)?.parent ?? "")?.parent,
              ])
            : e.a[k],
        );
        for (const v of valeurs) if (v) c[k][v] = (c[k][v] ?? 0) + 1;
      }
    return c;
  }, [base, selection, cleUrl]);

  const parFrequence = (k: CleFiltreMusique) => (ids: string[]) =>
    ids
      .filter((v) => base.some((e) => e.a[k].includes(v)))
      .sort((x, y) => (comptes[k]?.[y] ?? 0) - (comptes[k]?.[x] ?? 0));
  const origines = [...new Set(base.flatMap((e) => e.a.origine))];
  const sections: SectionTiroir[] = cles.map((k) => ({
    cle: k,
    titre: TITRES_FILTRES_MUSIQUE[k],
    groupes:
      k === "genre"
        ? genresRacines().map((r) => ({
            titre: r.nom,
            options: [
              r,
              ...sousGenres(r.id).flatMap((g) => [g, ...sousGenres(g.id)]),
            ].map((g) => ({
              id: g.id,
              label: g.parent ? g.nom : `Tout ${g.nom.toLowerCase()}`,
            })),
          }))
        : [
            {
              options:
                k === "type"
                  ? Object.entries(TYPES_SORTIE).map(([id, label]) => ({
                      id,
                      label,
                    }))
                  : k === "origine"
                    ? parFrequence("origine")(origines).map((p) => ({
                        id: p,
                        label: p,
                      }))
                    : k === "periode"
                      ? PERIODES
                      : k === "mood"
                        ? MOODS
                        : parFrequence("label")(LABELS.map((l) => l.id)).map(
                            (id) => ({
                              id,
                              label: libelleMusique("label", id),
                            }),
                          ),
            },
          ],
    note:
      k === "genre"
        ? "Un genre inclut ses sous-genres."
        : k === "mood"
          ? "Ambiances choisies par la rédaction, deux ou trois par entrée."
          : undefined,
  }));

  const affiches = resultats.slice(0, limite);
  const reste = resultats.length - affiches.length;
  const mot = albums ? "sortie" : "artiste";

  return (
    <>
      <Nav />
      <main className="overflow-x-clip">
        <EnTetePage
          pastille={`Univers ${UNIVERS_MUSIQUE.numero} · Musique`}
          titre={
            albums
              ? `${SORTIES.length} albums, EP et singles`
              : `${ARTISTES.length} artistes`
          }
          texte={
            albums
              ? "Cherchez par titre, artiste ou label, puis affinez par format, genre, période ou ambiance."
              : "Cherchez par nom, ville ou genre, puis affinez par origine, période, ambiance ou label."
          }
        >
          <div className="mt-8 flex flex-col gap-4 md:mt-[60px] lg:flex-row lg:items-center lg:justify-between">
            <div className="w-full lg:max-w-[720px] lg:flex-1">
              <Recherche
                valeur={q}
                onChange={setQ}
                aide={
                  albums
                    ? "Chercher un album, un artiste, un label…"
                    : "Chercher un artiste, une ville, un genre…"
                }
              />
            </div>
            <div className="flex items-center justify-between gap-6 lg:justify-end lg:gap-[59px]">
              <button
                type="button"
                onClick={() => setOuvert(true)}
                aria-haspopup="dialog"
                className={cn(
                  "inline-flex min-h-[54px] shrink-0 cursor-pointer items-center gap-2.5 rounded-pill py-[11px] pr-[18px] pl-4 transition-colors duration-240 ease-rw md:min-h-[62px]",
                  nbFiltres
                    ? "bg-encre text-papier"
                    : "verre-pill text-encre hover:bg-blanc",
                )}
              >
                <Icone nom="filtres" taille={20} />
                <span className="t-cote-m">Filtres</span>
                {nbFiltres > 0 && (
                  <span className="t-cote-s text-signal">{nbFiltres}</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  const prochain =
                    ORDRE_TRIS[
                      (ORDRE_TRIS.indexOf(tri) + 1) % ORDRE_TRIS.length
                    ];
                  maj("tri", prochain === "pertinence" ? null : prochain);
                }}
                className="t-cote-m -my-3.5 cursor-pointer py-3.5 text-right transition-colors duration-240 ease-rw hover:text-signal sm:whitespace-nowrap"
              >
                Trier : {LIBELLES_TRI[tri]}
              </button>
            </div>
          </div>
          <div className="mt-6 pb-4 md:mt-9">
            <OngletsMusique actif={genreListe} />
          </div>
          {nbFiltres > 0 && (
            <div className="flex flex-wrap items-center gap-2 pb-2">
              <span className="t-cote-s mr-1 text-graphite">
                {resultats.length} résultat{resultats.length > 1 ? "s" : ""}
              </span>
              {cles.flatMap((k) =>
                selection[k].map((v) => (
                  <button
                    key={`${k}-${v}`}
                    type="button"
                    onClick={() => basculer(k, v)}
                    aria-label={`Retirer le filtre ${libelleMusique(k, v)}`}
                    className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-pill border border-encre bg-encre py-1.5 pr-2.5 pl-3.5 text-papier transition-colors duration-240 ease-rw hover:bg-carbone"
                  >
                    <span className="t-cote-s">{libelleMusique(k, v)}</span>
                    <Icone nom="fermer" taille={14} />
                  </button>
                )),
              )}
              <button
                type="button"
                onClick={effacer}
                className="t-cote-s ml-1 cursor-pointer py-2 underline underline-offset-4 transition-colors duration-240 ease-rw hover:text-signal"
              >
                Tout effacer
              </button>
            </div>
          )}
        </EnTetePage>

        <TiroirFiltres
          ouvert={ouvert}
          onFermer={() => setOuvert(false)}
          sections={sections}
          selection={selection}
          comptes={comptes}
          voir={
            resultats.length === 0
              ? `Aucun${albums ? "e sortie" : " artiste"}`
              : `Voir ${resultats.length} ${mot}${resultats.length > 1 ? "s" : ""}`
          }
          onBasculer={basculer}
          onEffacer={effacer}
        />

        <section aria-live="polite" className="pt-6 md:pt-12">
          <Conteneur>
            {resultats.length === 0 ? (
              <div className="flex flex-col items-start gap-5 py-16 md:py-24">
                <p className="t-serif-m md:t-serif-l">
                  Aucun{albums ? "e sortie" : " artiste"}
                  {q && ` pour « ${q} »`}
                  {nbFiltres > 0 && " avec ces filtres"}.
                </p>
                <p className="t-texte-m max-w-[560px] text-graphite">
                  {nbFiltres > 0
                    ? "Retirez un filtre (les pastilles au-dessus) ou élargissez la période."
                    : "Vérifiez l'orthographe, ou cherchez un genre ou une ville."}
                </p>
                <div className="flex flex-wrap gap-3">
                  {nbFiltres > 0 && (
                    <Bouton type="encre" onClick={effacer}>
                      Retirer les filtres
                    </Bouton>
                  )}
                  {q && (
                    <Bouton type="verre" onClick={() => setQ("")}>
                      Effacer la recherche
                    </Bouton>
                  )}
                  <Bouton
                    type="verre"
                    href={albums ? "/musique/artistes" : "/musique/albums"}
                  >
                    {albums ? "Voir les artistes" : "Voir les albums"}
                  </Bouton>
                </div>
              </div>
            ) : (
              <ul className="grid justify-items-center gap-y-[30px] md:grid-cols-2 md:gap-x-10 md:gap-y-[52px] xl:grid-cols-3">
                <AnimatePresence mode="popLayout" initial={false}>
                  {affiches.map((e, i) => (
                    <motion.li
                      key={e.x.id}
                      layout
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{
                        opacity: 0,
                        scale: 0.94,
                        transition: { duration: 0.25, ease: EASE_REVELE },
                      }}
                      transition={{
                        duration: 0.6,
                        ease: EASE_REVELE,
                        delay: Math.min(i, 8) * 0.06,
                      }}
                      className="w-full max-w-[400px]"
                    >
                      {albums ? (
                        <CarteSortie sortie={e.x as Sortie} />
                      ) : (
                        <CarteArtiste artiste={e.x as Artiste} />
                      )}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
            {resultats.length > 0 && (
              <div className="mt-16 flex flex-col items-center gap-[27px] md:mt-[100px]">
                {reste > 0 && (
                  <Bouton
                    type="encre"
                    onClick={() => setLimite((l) => l + PAR_PAGE)}
                  >
                    {`Charger ${Math.min(reste, PAR_PAGE)} de plus`}
                  </Bouton>
                )}
                <p className="t-cote-m text-graphite">
                  {String(affiches.length).padStart(3, "0")} /{" "}
                  {String(resultats.length).padStart(3, "0")}
                </p>
              </div>
            )}
          </Conteneur>
        </section>
        <div className="h-10" />
      </main>
      <Footer />
    </>
  );
}

export const MusiqueArtistes = () => <ListeMusique genreListe="artistes" />;
export const MusiqueAlbums = () => <ListeMusique genreListe="albums" />;

// ── Tous les genres ──

export function MusiqueGenres() {
  useMeta(metaMusique("genres"));
  const compte = (id: string) => {
    const ids = genreEtEnfants(id);
    return {
      artistes: ARTISTES.filter((a) => a.genres.some((g) => ids.includes(g)))
        .length,
      sorties: SORTIES.filter((s) => s.genres.some((g) => ids.includes(g)))
        .length,
    };
  };
  return (
    <>
      <Nav />
      <main className="overflow-x-clip">
        <EnTetePage
          pastille={`Univers ${UNIVERS_MUSIQUE.numero} · Musique`}
          titre={`${GENRES.length} genres`}
          texte="Trois grandes familles, et les scènes qui en sont nées. Chaque genre est expliqué en deux phrases, avec ses artistes et ses albums."
        >
          <div className="mt-8 pb-4 md:mt-[60px]">
            <OngletsMusique actif="genres" />
          </div>
        </EnTetePage>
        <section className="pt-6 md:pt-12">
          <Conteneur className="flex flex-col gap-6 md:gap-10">
            {genresRacines().map((r, i) => {
              const c = compte(r.id);
              return (
                <Apparition
                  key={r.id}
                  rang={i}
                  className="verre rounded-[32px] p-6 md:rounded-[40px] md:p-10"
                >
                  <div className="grid gap-6 md:grid-cols-12 md:gap-x-10">
                    <div className="md:col-span-5">
                      <p className="t-cote-s text-graphite">
                        {c.artistes} artistes · {c.sorties} sorties
                      </p>
                      <h2 className="mt-2">
                        <a
                          href={lienGenre(r.slug)}
                          className="t-titre-l md:t-display-l transition-colors duration-240 ease-rw hover:text-signal"
                        >
                          {r.nom}
                        </a>
                      </h2>
                      <p className="t-texte-m mt-4 text-carbone">
                        {r.description}
                      </p>
                    </div>
                    <ul className="flex flex-col gap-2 md:col-span-7">
                      {sousGenres(r.id).map((g) => (
                        <li key={g.id}>
                          <a
                            href={lienGenre(g.slug)}
                            className="group flex flex-col gap-1 rounded-[20px] bg-blanc/60 px-5 py-4 transition-colors duration-240 ease-rw hover:bg-blanc"
                          >
                            <span className="flex items-baseline justify-between gap-4">
                              <span className="t-titre-s">{g.nom}</span>
                              <span className="t-cote-s shrink-0 text-graphite group-hover:text-signal">
                                {compte(g.id).artistes} artistes →
                              </span>
                            </span>
                            <span className="t-texte-s line-clamp-2 text-graphite">
                              {g.description}
                            </span>
                            {sousGenres(g.id).length > 0 && (
                              <span className="t-cote-s mt-1 text-carbone">
                                Comprend :{" "}
                                {sousGenres(g.id)
                                  .map((x) => x.nom)
                                  .join(", ")}
                              </span>
                            )}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Apparition>
              );
            })}
          </Conteneur>
        </section>
        <div className="h-16 md:h-24" />
      </main>
      <Footer />
    </>
  );
}
