import { motion, useScroll, useTransform } from "motion/react";
import { useRef, useState, type FormEvent } from "react";
import { TOTAL_ENTREES } from "../data/brands";
import { LIENS as ROUTES } from "../lib/liens";
import { useFacteurParallax } from "../lib/mouvement";
import { Aura } from "./Aura";
import { Icone } from "./Icone";
import { Lien } from "./Lien";
import { Logo } from "./Logo";

const COLONNES = [
  {
    titre: "Archive",
    liens: ["Index", "Domaines", "Trios", "Nouvelles entrées", "Au hasard"],
  },
  { titre: "Rework", liens: ["Manifeste", "Contact", "Proposer une marque"] },
  { titre: "Ailleurs", liens: ["Instagram", "Are.na", "Twitter"] },
];

// Instagram, Are.na, Twitter : pas encore d'URL → affichés sans lien
const LIENS: Record<string, string> = {
  Index: ROUTES.index,
  Domaines: ROUTES.domaines,
  Trios: ROUTES.trios,
  "Nouvelles entrées": ROUTES.nouvelles,
  "Au hasard": ROUTES.hasard,
  Manifeste: ROUTES.manifeste,
  Contact: ROUTES.ecrire,
  "Proposer une marque": ROUTES.proposer,
};

const COLONNES_MOBILE = [
  ["Index", "Domaines", "Trios", "Manifeste", "Contact"],
  ["Instagram", "Are.na", "Twitter"],
];

function LienFooter({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const href = LIENS[label];
  if (!href)
    return (
      <span
        className={`t-texte-m inline-block text-papier/60 ${className ?? "py-1.5"}`}
      >
        {label}
      </span>
    );
  return (
    <Lien ton="papier" href={href} className={className}>
      {label}
    </Lien>
  );
}

type EtatInscription =
  "repos" | "envoi" | "confirmation" | "deja" | "email" | "erreur";

const MESSAGES: Record<Exclude<EtatInscription, "repos" | "envoi">, string> = {
  confirmation:
    "Presque. Un email de confirmation t'attend : un clic, et tu es dans la liste.",
  deja: "Tu es déjà dans la liste. Rendez-vous lundi.",
  email: "Cette adresse ne ressemble pas à un email. On réessaie ?",
  erreur: "Le signal ne passe pas. Réessaie dans un instant.",
};

// Lettre hebdomadaire : POST /api/subscribe (Pages Function → Brevo, double opt-in). La clé Brevo ne quitte jamais le serveur.
function Inscription() {
  const [etat, setEtat] = useState<EtatInscription>("repos");
  const reussi = etat === "confirmation" || etat === "deja";

  async function envoyer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const donnees = new FormData(e.currentTarget);
    setEtat("envoi");
    try {
      const r = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: donnees.get("email"),
          site: donnees.get("site"),
        }),
      });
      const { code } = (await r.json()) as { code?: string };
      setEtat(
        code === "confirmation" || code === "deja" || code === "email"
          ? code
          : "erreur",
      );
    } catch {
      setEtat("erreur");
    }
  }

  return (
    <>
      <form
        onSubmit={envoyer}
        className="verre-pill mt-5 flex h-14 items-center rounded-pill bg-blanc/5 py-[5px] pr-[5px] pl-[19px] [border-color:rgb(255_255_255/0.25)] md:mt-8 md:h-[68px] md:py-2 md:pr-2 md:pl-[27px]"
      >
        <label htmlFor="newsletter" className="sr-only">
          Adresse e-mail
        </label>
        <input
          id="newsletter"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="ton@email.com"
          disabled={reussi}
          aria-describedby="newsletter-note"
          onChange={() =>
            etat !== "repos" && etat !== "envoi" && !reussi && setEtat("repos")
          }
          className="t-texte-s md:t-texte-m min-w-0 flex-1 bg-transparent text-papier caret-signal outline-none placeholder:text-papier/60 disabled:opacity-60"
        />
        {/* Champ piège pour les robots, invisible et hors tabulation */}
        <input
          type="text"
          name="site"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="absolute -left-[9999px] size-px opacity-0"
        />
        <button
          type="submit"
          aria-label="S'inscrire"
          disabled={etat === "envoi" || reussi}
          className="grid h-11 cursor-pointer place-items-center rounded-pill bg-signal text-encre transition-colors duration-240 ease-rw hover:bg-papier disabled:cursor-default disabled:hover:bg-signal max-md:w-11 md:h-[52px] md:px-[34px]"
        >
          <Icone nom="fleche" taille={20} className="md:hidden" />
          <span className="hidden text-[14px] leading-[1.5] font-semibold md:inline">
            {etat === "envoi" ? "Envoi…" : reussi ? "Inscrit·e" : "S'inscrire"}
          </span>
        </button>
      </form>
      <p id="newsletter-note" className="t-cote-s mt-3 text-papier/60 md:mt-4">
        Une entrée par semaine. Désinscription en un clic.{" "}
        <a
          href={ROUTES.confidentialite}
          className="underline underline-offset-2 transition-colors duration-240 ease-rw hover:text-papier"
        >
          Confidentialité
        </a>
      </p>
      <p
        role="status"
        aria-live="polite"
        className={`t-texte-s mt-2 min-h-[1.5em] ${etat === "email" || etat === "erreur" ? "text-signal" : "text-papier"}`}
      >
        {etat !== "repos" && etat !== "envoi" ? MESSAGES[etat] : ""}
      </p>
    </>
  );
}

// Footer — encre + auras
export function Footer() {
  // Les auras montent plus lentement que le contenu
  const ref = useRef<HTMLElement>(null);
  const facteur = useFacteurParallax();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end end"],
  });
  const yAuras = useTransform(scrollYProgress, [0, 1], [-160 * facteur, 0]);

  return (
    <footer
      ref={ref}
      id="contact"
      className="relative isolate overflow-hidden rounded-t-[32px] bg-encre text-papier md:rounded-t-[48px]"
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ y: yAuras }}
      >
        <Aura
          couleur="var(--color-signal)"
          className="-top-[120px] -right-[130px] size-[360px] opacity-70 md:-top-[200px] md:-right-[160px] md:h-[560px] md:w-[620px]"
        />
        <Aura
          couleur="var(--color-aura-digital)"
          className="top-[260px] -left-[140px] size-[320px] opacity-45 md:top-[320px] md:-left-[200px] md:h-[520px] md:w-[620px]"
        />
      </motion.div>

      <div className="mx-auto max-w-[1440px] px-(--marge) pt-9 pb-6 md:px-16 md:pt-[72px] md:pb-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,520px)_1fr] lg:gap-20">
          <div>
            <h2 className="t-titre-m md:t-titre-l">Restons en contact.</h2>
            <p className="t-serif-s md:t-serif-m mt-1 md:mt-2">
              Une <span className="hidden md:inline">nouvelle </span>entrée par
              semaine.
            </p>
            <Inscription />
          </div>

          <nav className="grid grid-cols-2 gap-x-6 md:hidden">
            {COLONNES_MOBILE.map((col, i) => (
              <ul key={i} className="flex flex-col">
                {col.map((l) => (
                  <li key={l}>
                    {/* py-[9px] : cible tactile ≥ 44 px */}
                    <LienFooter label={l} className="py-[9px]" />
                  </li>
                ))}
              </ul>
            ))}
          </nav>

          <nav className="hidden grid-cols-3 gap-x-10 md:grid lg:justify-self-end">
            {COLONNES.map((col) => (
              <div key={col.titre}>
                <p className="t-cote-m text-signal">{col.titre}</p>
                <ul className="mt-4 flex flex-col">
                  {col.liens.map((l) => (
                    <li key={l}>
                      <LienFooter label={l} className="py-[9px] lg:py-[3px]" />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <a
          href="/"
          aria-label="rework° — accueil"
          className="mt-6 -ml-2 block md:mt-10 md:-ml-4"
        >
          <Logo
            ton="papier"
            className="block text-[29vw] whitespace-nowrap md:text-[min(23vw,330px)]"
          />
        </a>

        <div className="t-cote-s mt-5 flex flex-col justify-between gap-2 md:mt-8 md:flex-row">
          <p>
            © 2026 rework° —{" "}
            <span className="hidden md:inline">
              archive vivante de la culture contemporaine —{" "}
            </span>
            Paris
          </p>
          <p className="hidden md:block">R°{TOTAL_ENTREES} · 48°51′N 2°21′E</p>
        </div>
      </div>
    </footer>
  );
}
