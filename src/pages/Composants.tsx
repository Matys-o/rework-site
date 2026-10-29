import { useMemo, useRef, useState, type ReactNode } from "react";
import { Aura, AuraAnimee } from "../components/Aura";
import { Bandeau } from "../components/Bandeau";
import { Bouton } from "../components/Bouton";
import { Domaine } from "../components/Domaine";
import { Fiche } from "../components/Fiche";
import { Filtre } from "../components/Filtre";
import { Footer } from "../components/Footer";
import { Lien } from "../components/Lien";
import { LigneIndex } from "../components/LigneIndex";
import { Logo } from "../components/Logo";
import { Nav } from "../components/Nav";
import { Recherche } from "../components/Recherche";
import { defilerVers } from "../lib/mouvement";
import { DOMAINES, MARQUES as TOUTES, compterParDomaine, type DomaineId } from "../data/brands";

/** Échantillon pour la page composants : les 2 premières marques de chaque domaine */
const MARQUES = (Object.keys(DOMAINES) as DomaineId[]).flatMap((d) => TOUTES.filter((m) => m.domaine === d).slice(0, 2));

function Section({ numero, titre, note, children }: { numero: string; titre: string; note?: string; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-16 md:px-10">
      <header className="mb-10 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-encre pb-5">
        <span className="t-cote-m text-signal">{numero}</span>
        <h2 className="t-titre-l">{titre}</h2>
        {note && <p className="t-cote-s text-graphite">{note}</p>}
      </header>
      {children}
    </section>
  );
}

const COULEURS = [
  { nom: "Papier", token: "papier", hex: "#EEECE7", role: "Le fond — 60 %", fond: "bg-papier border border-encre/10" },
  { nom: "Brume", token: "brume", hex: "#E2E0D9", role: "Surfaces", fond: "bg-brume" },
  { nom: "Blanc", token: "blanc", hex: "#FFFFFF", role: "Fiches", fond: "bg-blanc" },
  { nom: "Encre", token: "encre", hex: "#0E0E0E", role: "Texte — 30 %", fond: "bg-encre" },
  { nom: "Carbone", token: "carbone", hex: "#2A2926", role: "Texte courant", fond: "bg-carbone" },
  { nom: "Graphite", token: "graphite", hex: "#75726B", role: "Cotes, méta", fond: "bg-graphite" },
  { nom: "Signal", token: "signal", hex: "#FF3D2E", role: "Le signal — 10 %", fond: "bg-signal" },
];

const AURAS = [
  { id: "mode", hex: "#FF8FC7", nom: "Rose néon", usage: "streetwear, techwear, maisons" },
  { id: "design", hex: "#D2F34C", nom: "Lime acide", usage: "mobilier, objets, éditeurs" },
  { id: "tech", hex: "#FF7A1A", nom: "Orange machine", usage: "outils, matériel" },
  { id: "digital", hex: "#8CC8FF", nom: "Bleu glacier", usage: "logiciels, plateformes" },
  { id: "film", hex: "#B49BFF", nom: "Lilas projecteur", usage: "cinéma, top Letterboxd" },
] as const;

const TYPO = [
  { classe: "t-display-xl", style: "Display/XL", spec: "Bricolage 800 · 168 · −5 %", texte: "rework°" },
  { classe: "t-display-l", style: "Display/L", spec: "Bricolage 800 · 104 · −4 %", texte: "Archive vivante" },
  { classe: "t-display-m", style: "Display/M", spec: "Bricolage 800 · 64 · −3 %", texte: "Pas de bruit." },
  { classe: "t-titre-l", style: "Titre/L", spec: "Bricolage 700 · 40 · −2 %", texte: "Teenage Engineering" },
  { classe: "t-titre-m", style: "Titre/M", spec: "Bricolage 700 · 28 · −1,5 %", texte: "USM Haller" },
  { classe: "t-titre-s", style: "Titre/S", spec: "Bricolage 600 · 20 · −1 %", texte: "Dossier en verre" },
  { classe: "t-serif-xl", style: "Serif/XL", spec: "Instrument Serif it. · 180", texte: "signal" },
  { classe: "t-serif-l", style: "Serif/L", spec: "Instrument Serif it. · 96", texte: "juste le signal." },
  { classe: "t-serif-m", style: "Serif/M", spec: "Instrument Serif it. · 44", texte: "Une nouvelle entrée par semaine." },
  { classe: "t-serif-s", style: "Serif/S", spec: "Instrument Serif it. · 26", texte: "On ouvre l'archive comme on ouvre un tiroir." },
  { classe: "t-texte-l", style: "Texte/L", spec: "Geist 400 · 22 · −1 %", texte: "Chaque marque est un dossier ; chaque dossier émet un signal." },
  { classe: "t-texte-m", style: "Texte/M", spec: "Geist 400 · 17 · −0,5 %", texte: "L'identité croise la rigueur d'un fonds d'archives et la sensualité des interfaces." },
  { classe: "t-texte-s", style: "Texte/S", spec: "Geist 500 · 14", texte: "Éditeur suisse de mobilier, gardien des icônes Eames et Panton." },
  { classe: "t-cote-m", style: "Cote/M", spec: "Geist Mono 500 · 13 · +4 %", texte: "R°003 · Design · 1950" },
  { classe: "t-cote-s", style: "Cote/S", spec: "Geist Mono 400 · 11 · +6 %", texte: "Design · 1950 · Birsfelden" },
];

const RAYONS = [
  { nom: "Pill · 999", classe: "rounded-pill w-[180px] h-16" },
  { nom: "Dossier · 28", classe: "rounded-dossier size-[120px]" },
  { nom: "Carte · 20", classe: "rounded-carte size-[120px]" },
  { nom: "Chip · 14", classe: "rounded-chip size-[120px]" },
];

export default function Composants() {
  const [filtre, setFiltre] = useState<DomaineId | "tous">("tous");
  const [requete, setRequete] = useState("");
  const rechercheRef = useRef<HTMLDivElement>(null);

  const fiches = useMemo(() => (filtre === "tous" ? MARQUES : MARQUES.filter((m) => m.domaine === filtre)), [filtre]);

  const lignes = useMemo(() => {
    const q = requete.trim().toLowerCase();
    if (!q) return MARQUES;
    return MARQUES.filter((m) =>
      [m.nom, m.origine, m.etiquette, DOMAINES[m.domaine].nom, String(m.annee)].some((v) => v.toLowerCase().includes(q)),
    );
  }, [requete]);

  const allerARecherche = () => {
    defilerVers(rechercheRef.current, -window.innerHeight / 3);
    rechercheRef.current?.querySelector("input")?.focus({ preventScroll: true });
  };

  return (
    <>
      <Nav onChercher={allerARecherche} />

      <main>
        {/* Couverture — Aura animée derrière le verre */}
        <div className="px-4 pt-28 md:px-10">
          <AuraAnimee className="relative mx-auto grid min-h-[640px] max-w-[1440px] place-items-center rounded-[40px] px-4 py-16">
            <div className="verre flex w-full max-w-[1100px] flex-col items-center rounded-[40px] px-6 py-14 text-center md:py-20">
              <span className="t-cote-m text-carbone">R° 2.0 — Bibliothèque de composants</span>
              <Logo className="mt-6 text-[clamp(88px,15vw,220px)]" />
              <p className="t-serif-l mt-4">le signal, sans le bruit.</p>
              <p className="t-cote-s mt-10 text-carbone">
                Archive vivante de la culture contemporaine — Paris — Édition 2.0
              </p>
            </div>
          </AuraAnimee>
          <p className="t-cote-s mx-auto mt-4 max-w-[1440px] text-graphite">
            Aura animée — respiration en boucle 8 s ease-in-out · 4 auras désynchronisées · toujours derrière le verre
          </p>
        </div>

        {/* ── Tokens ── */}
        <Section numero="01" titre="Couleurs" note="Variables Rework 2.0 — 60 / 30 / 10">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
            {COULEURS.map((c) => (
              <div key={c.token}>
                <div className={`h-28 rounded-carte ${c.fond}`} />
                <p className="t-titre-s mt-3">{c.nom}</p>
                <p className="t-cote-s mt-1 text-graphite">
                  {c.hex} · {c.token}
                </p>
                <p className="t-texte-s text-carbone">{c.role}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {AURAS.map((a) => (
              <div key={a.id} className="relative isolate h-[300px] overflow-hidden rounded-dossier bg-brume">
                <Aura couleur={`var(--color-aura-${a.id})`} flou="douce" className="-top-10 left-[10%] h-[280px] w-[85%]" />
                <Aura couleur={`var(--color-aura-${a.id})`} flou="douce" className="top-20 left-[38%] size-[200px]" />
                <div className="verre absolute inset-x-5 bottom-5 rounded-carte px-[22px] py-4">
                  <p className="t-titre-m">Aura {DOMAINES[a.id].nom}</p>
                  <p className="t-cote-s mt-3 text-carbone">
                    {a.hex} — {a.nom} — {a.usage}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="t-texte-s mt-6 max-w-[560px] text-carbone">
            Le rouge est un signal, 10 % maximum. Une aura n'apparaît jamais nue — toujours floutée, toujours derrière du
            verre.
          </p>
        </Section>

        <Section numero="02" titre="Typographie" note="Styles Rework/… — Bricolage Grotesque · Instrument Serif · Geist · Geist Mono">
          <ul className="divide-y divide-encre/15">
            {TYPO.map((t) => (
              <li key={t.classe} className="grid gap-2 py-5 md:grid-cols-[220px_1fr] md:items-baseline md:gap-8">
                <div>
                  <p className="t-cote-m">{t.style}</p>
                  <p className="t-cote-s mt-1 text-graphite">{t.spec}</p>
                </div>
                <p className={`${t.classe} min-w-0 truncate`}>{t.texte}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section numero="03" titre="Matières" note="Verre liquide · ombres Repos & Levée · rayons">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div className="relative isolate h-[520px] overflow-hidden rounded-[40px] bg-brume">
              <Aura couleur="var(--color-aura-mode)" className="top-[45%] -left-[10%] size-[560px]" />
              <Aura couleur="var(--color-aura-digital)" className="-top-[30%] left-[35%] h-[520px] w-[600px]" />
              <Aura couleur="var(--color-aura-design)" className="top-[60%] left-[55%] h-[480px] w-[520px]" />
              <Aura couleur="var(--color-signal)" flou="douce" className="top-[38%] left-[34%] size-[220px]" />

              <div className="verre absolute top-10 left-6 w-[min(440px,calc(100%-48px))] rounded-[40px] p-[35px] md:left-12">
                <p className="t-titre-m">Verre panneau</p>
                <p className="t-texte-s mt-3 text-carbone">
                  Blanc 14 % · backdrop-filter blur + saturate · liseré blanc 85 % · ombre portée douce.
                </p>
                <span className="verre-pill t-cote-s mt-16 inline-flex h-[60px] items-center rounded-pill px-[23px]">
                  R°003 · Design
                </span>
              </div>
              <p className="t-serif-m absolute bottom-8 left-6 md:left-12">Les auras ne vivent que derrière le verre.</p>
            </div>

            <div className="flex flex-col gap-10">
              <div className="grid grid-cols-2 gap-5">
                <div className="flex h-[200px] flex-col justify-between rounded-dossier bg-blanc p-6 shadow-repos">
                  <p className="t-titre-s">Repos</p>
                  <p className="t-cote-s text-graphite">0 2 4 · 0 16 40 −10</p>
                </div>
                <div className="flex h-[200px] -translate-y-2 flex-col justify-between rounded-dossier bg-blanc p-6 shadow-levee">
                  <p className="t-titre-s">Levée (hover)</p>
                  <p className="t-cote-s text-graphite">0 4 8 · 0 40 80 −16 · y −8</p>
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-6">
                {RAYONS.map((r) => (
                  <div key={r.nom}>
                    <div className={`border border-encre bg-blanc ${r.classe}`} />
                    <p className="t-cote-s mt-3 text-graphite">{r.nom}</p>
                  </div>
                ))}
              </div>
              <p className="t-texte-m text-carbone">
                Trois plans, toujours dans cet ordre : 1. le papier, 2. l'aura floutée, 3. le verre et le contenu.
              </p>
            </div>
          </div>
        </Section>

        {/* ── Composants ── */}
        <Section numero="04" titre="Nav" note="Verre pill, flottante, fixe au scroll — c'est celle en haut de la page">
          <p className="t-texte-m max-w-[640px] text-carbone">
            La nav est posée en <code className="font-mono text-[15px]">position: fixed</code> : scrolle pour la voir passer
            en verre au-dessus des auras. « Chercher » t'amène à la recherche ci-dessous.
          </p>
        </Section>

        <Section numero="05" titre="Lien & Bouton" note="Survole-les : signal °, inversion, ombre Levée, flèche ↗">
          <div className="flex flex-wrap items-center gap-9">
            <Lien href="#">Index</Lien>
            <Lien href="#">Domaines</Lien>
            <Lien href="#">Manifeste</Lien>
            <Lien href="#">Contact</Lien>
          </div>
          <div className="relative isolate mt-10 flex flex-wrap gap-5 overflow-hidden rounded-[32px] bg-brume p-8">
            <Aura couleur="var(--color-aura-digital)" flou="douce" className="-top-20 right-0 size-[320px]" />
            <Bouton type="encre">Explorer l'archive</Bouton>
            <Bouton type="signal">Explorer l'archive</Bouton>
            <Bouton type="verre">Explorer l'archive</Bouton>
          </div>
        </Section>

        <Section numero="06" titre="Filtre & Fiche" note="Les filtres sont actifs · fiche : 240 ms ease-out, y −8, ombre Levée, → devient ↗">
          <div className="mb-12 flex flex-wrap gap-3">
            <Filtre label="Tout" compte={MARQUES.length} actif={filtre === "tous"} onClick={() => setFiltre("tous")} />
            {Object.values(DOMAINES).map((d) => (
              <Filtre
                key={d.id}
                label={d.nom}
                compte={compterParDomaine(d.id)}
                couleur={d.couleur}
                actif={filtre === d.id}
                onClick={() => setFiltre(d.id)}
              />
            ))}
          </div>
          <div className="grid justify-items-center gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {fiches.map((m) => (
              <Fiche key={m.slug} marque={m} />
            ))}
          </div>
        </Section>

        <Section numero="07" titre="Domaine" note="Survol : l'aura se dilate">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Object.values(DOMAINES).map((d) => (
              <Domaine key={d.id} domaine={d} compte={compterParDomaine(d.id)} />
            ))}
          </div>
        </Section>

        <Section numero="08" titre="Recherche & Ligne index" note="Clic = focus · la recherche filtre l'index">
          <div ref={rechercheRef} className="relative isolate mb-12 overflow-hidden rounded-[40px] bg-brume px-4 py-14 md:px-10">
            <Aura couleur="var(--color-aura-mode)" flou="douce" className="-top-24 -left-10 size-[360px]" />
            <Aura couleur="var(--color-aura-design)" flou="douce" className="-right-10 -bottom-24 size-[360px]" />
            <Recherche valeur={requete} onChange={setRequete} className="mx-auto" />
          </div>
          <div>
            {lignes.map((m) => (
              <LigneIndex key={m.slug} marque={m} />
            ))}
            {lignes.length === 0 && (
              <p className="t-serif-m py-10 text-graphite">Rien dans l'archive pour « {requete} ».</p>
            )}
          </div>
        </Section>

        <section className="py-16">
          <div className="mx-auto mb-10 max-w-[1440px] px-4 md:px-10">
            <header className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-encre pb-5">
              <span className="t-cote-m text-signal">09</span>
              <h2 className="t-titre-l">Bandeau défilant</h2>
              <p className="t-cote-s text-graphite">Boucle linéaire infinie · 20 s</p>
            </header>
          </div>
          <Bandeau />
        </section>

        <div className="mx-auto max-w-[1440px] px-4 pt-16 pb-6 md:px-10">
          <header className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-encre pb-5">
            <span className="t-cote-m text-signal">10</span>
            <h2 className="t-titre-l">Footer</h2>
            <p className="t-cote-s text-graphite">Encre + auras</p>
          </header>
        </div>
      </main>

      <Footer />
    </>
  );
}
