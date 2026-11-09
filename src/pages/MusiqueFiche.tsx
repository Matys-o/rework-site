import { useEffect, type ReactNode } from "react";
import { useParams } from "react-router";
import { Apparition } from "../components/Apparition";
import { Aura } from "../components/Aura";
import { Bouton } from "../components/Bouton";
import { EnTetePage } from "../components/EnTetePage";
import { Footer } from "../components/Footer";
import { Conteneur } from "../components/Grille";
import {
  AvecRaison,
  CarteArtiste,
  CarteSortie,
  LiensEcoute,
  TitreSectionMusique,
} from "../components/Musique";
import { Nav } from "../components/Nav";
import { SerifRevele, TitreRevele, dureeCascade } from "../components/Revele";
import {
  ARTISTES,
  SORTIES,
  TYPES_SORTIE,
  UNIVERS_MUSIQUE,
  artiste,
  artistesDe,
  genre,
  genreEtEnfants,
  lienArtiste,
  lienGenre,
  nomGenre,
  nomLabel,
  nomMood,
  origineArtiste,
  sortie,
  sortiesDe,
  sousGenres,
  trouverArtiste,
  trouverGenre,
  trouverSortie,
} from "../data/musique";
import { cn } from "../lib/cn";
import { metaArtiste, metaGenre, metaSortie } from "../lib/metaMusique";
import { useMeta } from "../lib/useMeta";

// Fiches de l'univers Musique : artiste, album (ou EP, single, mixtape), genre.
// Un champ vide n'est jamais affiché.

const TITRE_FICHE =
  "font-display leading-[0.86] font-extrabold tracking-[-0.06em] [font-variation-settings:'opsz'_96] break-words";

function Retour({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="verre-pill t-cote-m inline-flex h-11 items-center rounded-pill pr-[15px] pl-[15px] transition-colors duration-240 ease-rw hover:bg-blanc md:pr-[18px] md:pl-4"
    >
      ← <span className="ml-1.5">{children}</span>
    </a>
  );
}

/** Lien vers une page genre, en pastille */
function PastilleGenre({ id, sombre }: { id: string; sombre?: boolean }) {
  const g = genre(id);
  if (!g) return null;
  return (
    <a
      href={lienGenre(g.slug)}
      className={cn(
        "t-cote-s inline-flex min-h-9 items-center rounded-pill px-3.5 transition-colors duration-240 ease-rw",
        sombre
          ? "bg-encre text-papier hover:bg-signal"
          : "border border-encre/15 bg-blanc hover:border-encre",
      )}
    >
      {g.nom}
    </a>
  );
}

/** Méta en bandeau verre : seulement les lignes renseignées */
function Metas({
  items,
}: {
  items: { label: string; valeur: ReactNode | null | undefined }[];
}) {
  const pleins = items.filter(
    (i) => i.valeur !== null && i.valeur !== undefined && i.valeur !== "",
  );
  return (
    <dl className="verre mt-8 grid grid-cols-[110px_1fr] gap-x-0 gap-y-6 rounded-[24px] p-5 md:mt-11 md:flex md:rounded-[32px] md:p-0">
      {pleins.map((item, i) => (
        <div
          key={item.label}
          className={cn(
            "contents md:block md:min-w-0 md:flex-1 md:pr-5",
            i === 0
              ? "md:py-[27px] md:pl-[31px]"
              : "md:my-[27px] md:border-l md:border-encre md:pl-6",
          )}
        >
          <dt className="t-cote-s self-center text-graphite">{item.label}</dt>
          <dd className="t-titre-s min-w-0 md:mt-3.5">{item.valeur}</dd>
        </div>
      ))}
    </dl>
  );
}

function Introuvable({
  quoi,
  retour,
}: {
  quoi: string;
  retour: { href: string; label: string };
}) {
  useEffect(() => {
    document.title = `${quoi} introuvable — rework°`;
  }, []);
  return (
    <>
      <Nav />
      <main className="overflow-x-clip">
        <Conteneur className="flex min-h-[70vh] flex-col items-start justify-center gap-8 pt-32 pb-20">
          <p className="t-cote-m text-signal">/ fiche introuvable</p>
          <h1 className="t-display-l">{quoi} introuvable.</h1>
          <p className="t-serif-m">
            Cette entrée n'existe pas ou a été retirée.
          </p>
          <Bouton type="encre" href={retour.href}>
            {retour.label}
          </Bouton>
        </Conteneur>
      </main>
      <Footer />
    </>
  );
}

// ── Artiste ──

export function ArtistePage() {
  const { slug } = useParams();
  const a = trouverArtiste(slug);
  useMeta(a ? metaArtiste(a) : null);
  if (!a)
    return (
      <Introuvable
        quoi="Artiste"
        retour={{ href: "/musique/artistes", label: "Tous les artistes" }}
      />
    );

  const titre = `${a.nom}.`;
  const sorties = sortiesDe(a);
  const proches = a.proches
    .map((p) => ({ ...p, a: artiste(p.id) }))
    .filter((p) => p.a);
  const taille =
    titre.length > 14
      ? "text-[clamp(44px,9vw,150px)]"
      : "text-[clamp(56px,13vw,220px)]";

  return (
    <>
      <Nav />
      <main className="overflow-x-clip">
        <section className="relative isolate">
          <Aura
            couleur={UNIVERS_MUSIQUE.couleur}
            className="-top-[120px] left-[15%] -z-10 h-[460px] w-[480px] md:-top-[260px] md:left-[36%] md:h-[900px] md:w-[1100px]"
          />
          <Aura
            couleur="var(--color-signal)"
            flou="douce"
            className="top-[200px] left-[62%] -z-10 size-[160px] md:top-[300px] md:left-[72%] md:size-[320px]"
          />
          <Conteneur className="pt-24 md:pt-32">
            <Retour href="/musique/artistes">Tous les artistes</Retour>
            <p className="t-cote-s md:t-cote-m mt-7 md:mt-12">
              {a.cote} · Artiste{a.pays ? ` · ${origineArtiste(a)}` : ""}
            </p>
            <h1
              className={cn(TITRE_FICHE, taille, "mt-1 -ml-1 md:-ml-2")}
              translate="no"
            >
              <TitreRevele texte={titre} traduire={false} />
            </h1>
            <p className="t-serif-l mt-3 italic">
              <SerifRevele
                texte={a.genres.map(nomGenre).join(" · ")}
                delai={dureeCascade(titre) + 0.2}
                className="inline-block"
              />
            </p>

            <Metas
              items={[
                { label: "Origine", valeur: origineArtiste(a) || null },
                { label: "Début", valeur: a.debut ? String(a.debut) : null },
                {
                  label: "Ambiance",
                  valeur: a.moods.map(nomMood).join(", ") || null,
                },
                {
                  label: "Labels",
                  valeur:
                    a.labels
                      .map((l) => nomLabel(l))
                      .filter(Boolean)
                      .join(", ") || null,
                },
                {
                  label: "Sorties",
                  valeur: sorties.length
                    ? `${sorties.length} dans l'archive`
                    : null,
                },
              ]}
            />

            <figure className="relative isolate mt-[30px] h-[380px] overflow-hidden rounded-[32px] bg-brume md:mt-14 md:h-[600px] md:rounded-[40px]">
              <img
                src={a.image}
                alt={a.nom}
                className="absolute inset-0 size-full object-cover"
                fetchPriority="high"
              />
            </figure>
          </Conteneur>
        </section>

        <section className="pt-10 md:pt-[100px]">
          <Conteneur className="grid gap-y-6 md:grid-cols-12 md:gap-x-5">
            <div className="md:col-span-5">
              <p className="t-cote-s md:t-cote-m text-signal">
                / Pourquoi l'écouter
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {a.genres.map((g) => (
                  <PastilleGenre key={g} id={g} sombre />
                ))}
              </div>
            </div>
            <div className="flex flex-col items-start gap-8 md:col-span-7">
              <p className="t-texte-m md:t-texte-l text-carbone">
                {a.description}
              </p>
              <LiensEcoute liens={a.liens} />
            </div>
          </Conteneur>
        </section>

        {sorties.length > 0 && (
          <section className="pt-16 md:pt-[120px]">
            <Conteneur>
              <TitreSectionMusique
                titre={`Discographie choisie · ${sorties.length}`}
              />
              <ul className="mt-6 grid justify-items-center gap-y-[30px] md:mt-9 md:grid-cols-2 md:gap-x-8 md:gap-y-[52px] xl:grid-cols-4">
                {sorties.map((s, i) => (
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
        )}

        {proches.length > 0 && (
          <section className="pt-16 md:pt-[120px]">
            <Conteneur>
              <TitreSectionMusique titre="Artistes proches">
                <h2 className="t-titre-l md:t-display-l mt-2.5">
                  Si vous aimez {a.nom}.
                </h2>
              </TitreSectionMusique>
              <ul className="mt-6 grid justify-items-center gap-y-10 md:mt-9 md:grid-cols-2 md:gap-x-10 xl:grid-cols-3">
                {proches.slice(0, 3).map((p, i) => (
                  <Apparition
                    as="li"
                    rang={i}
                    key={p.id}
                    className="flex w-full justify-center"
                  >
                    <AvecRaison raison={p.raison}>
                      <CarteArtiste artiste={p.a!} />
                    </AvecRaison>
                  </Apparition>
                ))}
              </ul>
            </Conteneur>
          </section>
        )}
        <div className="h-16 md:h-24" />
      </main>
      <Footer />
    </>
  );
}

// ── Album / EP / single ──

export function SortiePage() {
  const { slug } = useParams();
  const s = trouverSortie(slug);
  useMeta(s ? metaSortie(s) : null);
  if (!s)
    return (
      <Introuvable
        quoi="Album"
        retour={{ href: "/musique/albums", label: "Tous les albums" }}
      />
    );

  const auteurs = artistesDe(s);
  const principal = auteurs[0];
  const autres = principal
    ? sortiesDe(principal).filter((x) => x.id !== s.id)
    : [];
  const proches = s.proches
    .map((p) => ({ ...p, s: sortie(p.id) }))
    .filter((p) => p.s && !autres.includes(p.s));
  const titre = s.titre;
  const taille =
    titre.length > 22
      ? "text-[clamp(40px,6vw,88px)]"
      : titre.length > 10
        ? "text-[clamp(48px,7.5vw,120px)]"
        : "text-[clamp(56px,10vw,150px)]";

  return (
    <>
      <Nav />
      <main className="overflow-x-clip">
        <section className="relative isolate">
          <Aura
            couleur={UNIVERS_MUSIQUE.couleur}
            className="-top-[160px] left-[5%] -z-10 h-[460px] w-[480px] md:-top-[260px] md:left-[10%] md:h-[900px] md:w-[900px]"
          />
          <Conteneur className="pt-24 md:pt-32">
            <Retour href="/musique/albums">Tous les albums</Retour>
            <div className="mt-7 grid gap-8 md:mt-12 md:grid-cols-12 md:gap-x-10">
              <figure className="relative aspect-square overflow-hidden rounded-[28px] bg-brume shadow-levee md:col-span-5 md:rounded-[36px]">
                <img
                  src={s.cover}
                  alt={`Pochette de ${s.titre}`}
                  className="size-full object-cover"
                  fetchPriority="high"
                />
              </figure>
              <div className="flex flex-col md:col-span-7 md:justify-end">
                <p className="t-cote-s md:t-cote-m">
                  {s.cote} · {TYPES_SORTIE[s.type]}
                  {s.annee ? ` · ${s.annee}` : ""}
                </p>
                <h1
                  className={cn(TITRE_FICHE, taille, "mt-2 -ml-1")}
                  translate="no"
                >
                  <TitreRevele texte={titre} traduire={false} />
                </h1>
                {auteurs.length > 0 && (
                  <p className="mt-3 font-serif text-[28px] leading-[1.05] italic md:text-[40px]">
                    par{" "}
                    {auteurs.map((a, i) => (
                      <span key={a.id}>
                        {i > 0 && " & "}
                        <a
                          href={lienArtiste(a.slug)}
                          className="underline decoration-1 underline-offset-[6px] transition-colors duration-240 ease-rw hover:text-signal"
                          translate="no"
                        >
                          {a.nom}
                        </a>
                      </span>
                    ))}
                  </p>
                )}
                <p className="t-texte-m md:t-texte-l mt-6 text-carbone">
                  {s.description}
                </p>
                <LiensEcoute liens={s.liens} className="mt-8" />
              </div>
            </div>

            <Metas
              items={[
                { label: "Format", valeur: TYPES_SORTIE[s.type] },
                { label: "Sortie", valeur: s.annee ? String(s.annee) : null },
                { label: "Label", valeur: nomLabel(s.label) ?? null },
                {
                  label: "Genres",
                  valeur: s.genres.length ? (
                    <span className="flex flex-wrap gap-1.5">
                      {s.genres.map((g) => (
                        <a
                          key={g}
                          href={lienGenre(genre(g)?.slug ?? g)}
                          className="hover:text-signal"
                        >
                          {nomGenre(g)}
                          {g !== s.genres[s.genres.length - 1] && ","}
                        </a>
                      ))}
                    </span>
                  ) : null,
                },
                {
                  label: "Ambiance",
                  valeur: s.moods.map(nomMood).join(", ") || null,
                },
              ]}
            />
          </Conteneur>
        </section>

        {autres.length > 0 && principal && (
          <section className="pt-16 md:pt-[120px]">
            <Conteneur>
              <TitreSectionMusique
                titre={`Du même artiste · ${principal.nom}`}
                lien={{
                  href: lienArtiste(principal.slug),
                  label: "La fiche artiste",
                }}
              />
              <ul className="mt-6 grid justify-items-center gap-y-[30px] md:mt-9 md:grid-cols-2 md:gap-x-8 md:gap-y-[52px] xl:grid-cols-4">
                {autres.slice(0, 4).map((x, i) => (
                  <Apparition
                    as="li"
                    rang={i}
                    key={x.id}
                    className="w-full max-w-[400px]"
                  >
                    <CarteSortie sortie={x} />
                  </Apparition>
                ))}
              </ul>
            </Conteneur>
          </section>
        )}

        {proches.length > 0 && (
          <section className="pt-16 md:pt-[120px]">
            <Conteneur>
              <TitreSectionMusique titre="Albums proches">
                <h2 className="t-titre-l md:t-display-l mt-2.5">
                  À écouter ensuite.
                </h2>
              </TitreSectionMusique>
              <ul className="mt-6 grid justify-items-center gap-y-10 md:mt-9 md:grid-cols-2 md:gap-x-10 xl:grid-cols-3">
                {proches.slice(0, 3).map((p, i) => (
                  <Apparition
                    as="li"
                    rang={i}
                    key={p.id}
                    className="flex w-full justify-center"
                  >
                    <AvecRaison raison={p.raison}>
                      <CarteSortie sortie={p.s!} />
                    </AvecRaison>
                  </Apparition>
                ))}
              </ul>
            </Conteneur>
          </section>
        )}
        <div className="h-16 md:h-24" />
      </main>
      <Footer />
    </>
  );
}

// ── Genre ──

export function GenrePage() {
  const { slug } = useParams();
  const g = trouverGenre(slug);
  useMeta(g ? metaGenre(g) : null);
  if (!g)
    return (
      <Introuvable
        quoi="Genre"
        retour={{ href: "/musique/genres", label: "Tous les genres" }}
      />
    );

  const ids = genreEtEnfants(g.id);
  const artistes = ARTISTES.filter((a) =>
    a.genres.some((x) => ids.includes(x)),
  );
  const sorties = SORTIES.filter((s) =>
    s.genres.some((x) => ids.includes(x)),
  ).sort((x, y) => (y.annee ?? 0) - (x.annee ?? 0));
  const parent = g.parent ? genre(g.parent) : undefined;
  const enfants = sousGenres(g.id);

  return (
    <>
      <Nav />
      <main className="overflow-x-clip">
        <EnTetePage
          avant={
            <Retour href={parent ? lienGenre(parent.slug) : "/musique/genres"}>
              {parent ? parent.nom : "Tous les genres"}
            </Retour>
          }
          pastille={parent ? `Genre · sous-genre de ${parent.nom}` : "Genre"}
          titre={`${g.nom}.`}
          texte={g.description}
        >
          {enfants.length > 0 && (
            <div className="mt-8 md:mt-10">
              <p className="t-cote-s text-graphite">Sous-genres</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {enfants.map((e) => (
                  <PastilleGenre key={e.id} id={e.id} />
                ))}
              </div>
            </div>
          )}
          <p className="t-cote-m mt-8 pb-2 text-graphite">
            {artistes.length} artiste{artistes.length > 1 ? "s" : ""} ·{" "}
            {sorties.length} sortie{sorties.length > 1 ? "s" : ""}
          </p>
        </EnTetePage>

        {artistes.length > 0 && (
          <section className="pt-8 md:pt-14">
            <Conteneur>
              <TitreSectionMusique
                titre="Artistes"
                lien={{
                  href: `/musique/artistes?genre=${g.id}`,
                  label: "Filtrer la liste",
                }}
              />
              <ul className="mt-6 grid justify-items-center gap-y-[30px] md:mt-9 md:grid-cols-2 md:gap-x-10 md:gap-y-[52px] xl:grid-cols-3">
                {artistes.map((a, i) => (
                  <Apparition
                    as="li"
                    rang={i % 3}
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

        {sorties.length > 0 && (
          <section className="pt-16 md:pt-[120px]">
            <Conteneur>
              <TitreSectionMusique
                titre="Albums"
                lien={{
                  href: `/musique/albums?genre=${g.id}`,
                  label: "Filtrer la liste",
                }}
              />
              <ul className="mt-6 grid justify-items-center gap-y-[30px] md:mt-9 md:grid-cols-2 md:gap-x-8 md:gap-y-[52px] xl:grid-cols-4">
                {sorties.slice(0, 8).map((s, i) => (
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
        )}
        <div className="h-16 md:h-24" />
      </main>
      <Footer />
    </>
  );
}
