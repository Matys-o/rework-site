import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, type CSSProperties } from "react";
import { useParams } from "react-router";
import { Apparition } from "../components/Apparition";
import { Aura } from "../components/Aura";
import { Bouton } from "../components/Bouton";
import { Fiche, RangFilm } from "../components/Fiche";
import { Footer } from "../components/Footer";
import { Conteneur } from "../components/Grille";
import { Nav } from "../components/Nav";
import { SerifRevele, TitreRevele, dureeCascade } from "../components/Revele";
import { MediaCouverture } from "../components/MediaCouverture";
import { Tampon } from "../components/Tampon";
import { DOMAINES, MARQUES, metaMarque, trouverMarque, voisins, type DomaineId, type Marque } from "../data/brands";
import { cn } from "../lib/cn";
import { LIENS, lienMarque } from "../lib/liens";
import { metaFiche } from "../lib/meta";
import { useFacteurParallax } from "../lib/mouvement";
import { useMeta } from "../lib/useMeta";

/** Aura secondaire en haut à gauche — une couleur voisine de celle du domaine */
const AURA_VOISINE: Record<DomaineId, DomaineId> = { mode: "digital", design: "digital", tech: "design", digital: "mode", film: "mode" };

/**
 * Taille du nom en Display : 260 px max, réduite pour tenir dans la colonne.
 * Les noms très longs passent sur deux lignes (taille calée sur le mot le plus long).
 */
function tailleTitre(titre: string) {
  const RATIO = 0.47; // largeur moyenne d'un caractère en em (Bricolage ExtraBold, −6 %)
  const uneLigne = 1000 / (titre.length * RATIO);
  const k = uneLigne >= 120 ? titre.length * RATIO : Math.max(...titre.split(" ").map((m) => m.length)) * RATIO;
  return { "--k": k } as CSSProperties;
}

/** 3 autres marques du même domaine : celles qui suivent dans l'archive (par id), en bouclant */
function aLireEnsuite(marque: Marque) {
  const memeDomaine = MARQUES.filter((m) => m.domaine === marque.domaine);
  const i = memeDomaine.indexOf(marque);
  return [1, 2, 3].map((k) => memeDomaine[(i + k) % memeDomaine.length]).filter((m) => m !== marque);
}

/** « https://www.vitra.com/fr » → « vitra.com » */
const domaineSite = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

function Voisin({ marque, sens }: { marque: Marque; sens: "precedent" | "suivant" }) {
  const suivant = sens === "suivant";
  return (
    <a
      href={lienMarque(marque.slug)}
      aria-label={`${suivant ? "Entrée suivante" : "Entrée précédente"} : ${marque.nom}`}
      className={cn(
        "group verre-pill flex h-[72px] min-w-0 items-center gap-5 rounded-pill px-6 transition-colors duration-240 ease-rw hover:bg-blanc md:h-24 md:gap-8 md:px-[31px] xl:gap-[78px]",
        suivant ? "flex-row-reverse justify-start text-right" : "justify-start",
      )}
    >
      <span className="t-cote-m shrink-0 whitespace-pre text-graphite transition-colors duration-240 ease-rw group-hover:text-signal">
        {suivant ? `${marque.cote}  →` : `←  ${marque.cote}`}
      </span>
      <span className="t-titre-m tronque min-w-0 max-md:text-[22px]">{marque.nom}</span>
    </a>
  );
}

export default function MarquePage() {
  const { slug } = useParams();
  const marque = trouverMarque(slug);

  useMeta(marque ? metaFiche(marque) : null);
  useEffect(() => {
    if (!marque) document.title = "Fiche introuvable — rework°";
  }, [marque]);

  // Parallax opposé : le grand titre descend (plus lent que la page), l'image hero monte et passe de 1.1 à 1
  // Facteur : 0 en mouvement réduit, 0.5 en mobile, 1 sinon
  const facteur = useFacteurParallax();
  const reduit = facteur === 0;
  const { scrollY } = useScroll();
  const yTitre = useTransform(scrollY, (v) => v * 0.28 * facteur);
  const imageRef = useRef<HTMLElement>(null);
  const { scrollYProgress: passageImage } = useScroll({ target: imageRef, offset: ["start end", "end start"] });
  const yImage = useTransform(passageImage, [0, 1], [70 * facteur, -70 * facteur]);
  const echelleImage = useTransform(passageImage, [0, 0.5], reduit ? [1, 1] : [1.1, 1]);

  if (!marque) return <Introuvable />;

  const domaine = DOMAINES[marque.domaine];
  const numero = marque.cote.replace("R°", "");
  const titre = `${marque.nom}.`;
  const { precedent, suivant } = voisins(marque);
  const film = marque.domaine === "film";
  // Sous-titre serif : le titre original d'un film quand il diffère du titre français, sinon l'étiquette
  const sousTitre = (film && marque.titreOriginal !== marque.nom && marque.titreOriginal) || marque.etiquette || domaine.nom;

  return (
    <>
      <Nav />

      <main className="overflow-x-clip">
        {/* ── En-tête ── */}
        <section className="relative isolate">
          <Aura couleur={domaine.couleur} className="-top-[120px] left-[15%] -z-10 h-[460px] w-[480px] md:-top-[260px] md:left-[36%] md:h-[900px] md:w-[1100px]" />
          <Aura couleur="var(--color-signal)" flou="douce" className="top-[200px] left-[62%] -z-10 size-[160px] md:top-[300px] md:left-[72%] md:size-[320px]" />
          <Aura couleur={DOMAINES[AURA_VOISINE[marque.domaine]].couleur} className="-top-[200px] -left-[300px] -z-10 hidden h-[600px] w-[700px] md:block" />

          <Conteneur className="pt-24 md:pt-32">
            <a
              href={LIENS.index}
              className="verre-pill t-cote-m inline-flex h-11 items-center rounded-pill pr-[15px] pl-[15px] transition-colors duration-240 ease-rw hover:bg-blanc md:pr-[18px] md:pl-4"
            >
              ← <span className="ml-1.5 hidden md:inline">retour à l’</span>index
            </a>

            <div className="relative">
              <p className="t-cote-s md:t-cote-m mt-7 md:mt-12">
                {marque.cote} · {metaMarque(marque)}
              </p>
              {marque.rang && (
                <p className="t-cote-s md:t-cote-m mt-1 text-signal">
                  <RangFilm rang={marque.rang} />
                </p>
              )}
              <motion.h1
                style={{ ...tailleTitre(titre), y: yTitre }}
                className={cn(
                  "mt-0.5 -ml-2 font-display leading-[0.86] font-extrabold tracking-[-0.06em] [font-variation-settings:'opsz'_96] md:-ml-2.5",
                  // Largeur utile = viewport − 2 marges (− 296 px de tampon dès lg) ; 260 px max
                  "text-[length:min(260px,calc((100vw_-_2*var(--marge))/var(--k)))]",
                  "lg:max-w-[calc(100%_-_240px)] lg:text-[length:min(260px,calc((min(100vw,1440px)_-_2*var(--marge)_-_296px)/var(--k)))]",
                )}
              >
                <TitreRevele texte={titre} />
              </motion.h1>
              <p className="mt-4 font-serif text-[clamp(30px,9vw,36px)] leading-none tracking-[-0.01em] text-balance italic md:t-serif-l md:mt-1.5 lg:max-w-[calc(100%_-_240px)]">
                <SerifRevele texte={sousTitre} delai={dureeCascade(titre) + 0.2} className="inline-block" />
              </p>
              <div className="absolute top-[3px] right-[3px] hidden text-encre lg:block">
                <Tampon
                  texte={`Entrée n°${numero} · ${domaine.nom} · ${marque.annee || "—"} · `}
                  centre={numero}
                  taille={214}
                />
              </div>
            </div>

            {/* Méta */}
            <dl className="verre mt-8 grid grid-cols-[120px_1fr] gap-x-0 gap-y-[30px] rounded-[24px] p-5 md:mt-11 md:grid-cols-5 md:gap-y-0 md:rounded-[32px] md:p-0">
              {[
                { label: film ? "Sortie" : "Fondation", valeur: marque.annee ? String(marque.annee) : "—" },
                { label: film ? "Pays" : "Origine", valeur: marque.origine || "—" },
                film
                  ? { label: "Réalisation", valeur: marque.realisation || "—" }
                  : { label: "Domaine", valeur: domaine.nom, desktop: true },
                { label: film ? "Genre" : "Étiquette", valeur: marque.etiquette || "—" },
              ].map((item, i) => (
                <div
                  key={item.label}
                  className={cn(
                    "contents md:block md:pr-5",
                    i === 0 ? "md:py-[27px] md:pl-[31px]" : "md:my-[27px] md:border-l md:border-encre md:pl-6",
                    item.desktop && "max-md:hidden",
                  )}
                >
                  <dt className={cn("t-cote-s self-center text-graphite md:pt-0.5", item.desktop && "max-md:hidden")}>{item.label}</dt>
                  <dd className={cn("t-titre-s truncate md:mt-3.5", item.desktop && "max-md:hidden")}>{item.valeur}</dd>
                </div>
              ))}
              <div className="contents md:my-[27px] md:block md:border-l md:border-encre md:pr-5 md:pl-6">
                <dt className="t-cote-s self-center text-graphite md:pt-0.5">{film ? "Fiche" : "Site"}</dt>
                {/* Cible tactile ≥ 44 px : py-3 sur le lien, logé dans le padding du dd (sinon rogné par truncate) ;
                    marges négatives et md:mt-0.5 (= 14 px − 12 px) : position du texte inchangée */}
                <dd className="t-titre-s -my-3 truncate py-3 whitespace-nowrap md:mt-0.5">
                  {marque.url ? (
                    <a
                      href={marque.url}
                      target="_blank"
                      rel="noreferrer"
                      className="-my-3 block truncate py-3 transition-colors duration-240 ease-rw hover:text-signal"
                    >
                      {domaineSite(marque.url)}
                      <span className="hidden md:inline"> ↗</span>
                    </a>
                  ) : (
                    <span className="text-graphite">—</span>
                  )}
                </dd>
              </div>
            </dl>

            {/* Couverture : la photo, posée sur « aura + initiale » (fond pendant le chargement, secours en cas d'erreur) */}
            <figure
              ref={imageRef}
              className="relative isolate mt-[30px] h-[420px] overflow-hidden rounded-[32px] bg-brume md:mt-14 md:h-[660px] md:rounded-[40px]"
              // Élément partagé avec la couverture de la fiche cliquée (View Transition)
              style={{ viewTransitionName: `couverture-${marque.slug}`, viewTransitionClass: "couverture" } as CSSProperties}
            >
              <motion.div className="absolute inset-0 isolate will-change-transform" style={{ y: yImage, scale: echelleImage }}>
                <Aura couleur={domaine.couleur} className="top-[60px] left-1/2 -z-10 size-[280px] -translate-x-1/2 md:top-20 md:h-[560px] md:w-[700px]" />
                <Aura couleur="var(--color-signal)" flou="douce" className="top-[300px] left-[59%] -z-10 hidden size-[300px] md:block" />
                <span
                  aria-hidden
                  className="absolute inset-x-0 -top-2.5 text-center font-serif text-[420px] leading-[0.85] tracking-[-0.03em] italic opacity-85 md:-top-[30px] md:text-[560px]"
                >
                  {marque.nom.charAt(0)}
                </span>
                {/* Débord de 80 px en haut et en bas : le parallax (±70 px) ne découvre jamais le bord de la photo */}
                {marque.image && (
                  <span className="absolute inset-x-0 -inset-y-20">
                    <MediaCouverture src={marque.image} video={marque.video} alt={marque.nom} prioritaire />
                  </span>
                )}
              </motion.div>
              {marque.etiquette && (
                <figcaption className="verre-pill t-titre-s absolute bottom-8 left-8 hidden h-[68px] items-center rounded-pill px-[25px] md:flex">
                  {marque.etiquette} — {marque.annee || domaine.nom}
                </figcaption>
              )}
            </figure>
          </Conteneur>
        </section>

        {/* ── 01 — La marque ── */}
        <section className="pt-10 md:pt-[120px]">
          <Conteneur className="grid gap-y-4 md:grid-cols-12 md:gap-x-5">
            <div className="md:col-span-6">
              <p className="t-cote-s md:t-cote-m text-signal">/ 01 — {film ? "le film" : "la marque"}</p>
              <h2 className="mt-2.5 md:mt-[13px]">
                <span className="t-titre-l md:t-display-l md:-ml-2 md:block">{marque.origine || domaine.nom}{marque.annee ? "," : "."}</span>{" "}
                {marque.annee > 0 && <span className="t-titre-l md:t-serif-l md:mt-1.5 md:block">{marque.annee}.</span>}
              </h2>
            </div>
            <div className="flex flex-col items-start gap-8 md:col-span-6 md:pt-10">
              <p className="t-texte-m md:t-texte-l text-carbone">{marque.description}</p>
              {marque.url && (
                <Bouton type="encre" href={marque.url} externe>
                  {film ? "Voir sur Letterboxd" : "Visiter le site"}
                </Bouton>
              )}
            </div>
          </Conteneur>
        </section>

        {/* ── À lire ensuite ── */}
        <section className="hidden pt-20 md:block">
          <Conteneur>
            <p className="t-cote-m text-signal">/ à lire ensuite</p>
            <ul className="mt-[23px] grid justify-items-center gap-x-10 gap-y-[52px] md:grid-cols-2 xl:grid-cols-3">
              {aLireEnsuite(marque).map((m, i) => (
                <Apparition as="li" rang={i} key={m.slug} className="w-full max-w-[400px]">
                  <Fiche marque={m} />
                </Apparition>
              ))}
            </ul>
          </Conteneur>
        </section>

        {/* ── Précédent / suivant ── */}
        <nav aria-label="Autres entrées"className="pt-12 md:pt-[52px]">
          <Conteneur className="grid gap-3 md:grid-cols-2 md:gap-10">
            <Voisin marque={precedent} sens="precedent" />
            <Voisin marque={suivant} sens="suivant" />
          </Conteneur>
        </nav>

        <div className="h-16" />
      </main>

      <Footer />
    </>
  );
}

function Introuvable() {
  return (
    <>
      <Nav />
      <main className="overflow-x-clip">
        <Conteneur className="flex min-h-[70vh] flex-col items-start justify-center gap-8 pt-32 pb-20">
          <p className="t-cote-m text-signal">/ fiche introuvable</p>
          <h1 className="t-display-l">Pas dans l'archive.</h1>
          <p className="t-serif-m">Cette entrée n'a pas (encore) de dossier.</p>
          <Bouton type="encre" href={LIENS.index}>
            Retour à l'index
          </Bouton>
        </Conteneur>
      </main>
      <Footer />
    </>
  );
}
