// Template de la lettre — maquette Figma « Newsletter A — L'édition (640) » (node 922:818).
// Contraintes email : 640 px, mise en page en tableaux, styles en ligne (Gmail retire une partie du <style>),
// polices web avec secours Helvetica / Georgia / Courier, mode sombre et mobile via les media queries du <style>.
import { Body, Head, Html, Preview } from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";
import { DOMAINES } from "../data/brands";
import { SITE_URL } from "../lib/site";
import {
  imageLettre,
  metaEntree,
  texteEntree,
  urlFiche,
  type Lettre,
} from "./lettre";

// Couleurs de la DA (src/styles/tokens.css) — en dur ici : les clients mail ne lisent pas les variables CSS
const C = {
  encre: "#0e0e0e",
  carbone: "#2a2926",
  graphite: "#75726b",
  papier: "#eeece7",
  brume: "#e2e0d9",
  signal: "#ff3d2e",
  aura: {
    mode: "#ff8fc7",
    design: "#d2f34c",
    tech: "#ff7a1a",
    digital: "#8cc8ff",
    film: "#b49bff",
  },
};

const F = {
  display: "'Bricolage Grotesque', Helvetica, Arial, sans-serif",
  serif: "'Instrument Serif', Georgia, 'Times New Roman', serif",
  sans: "Geist, Helvetica, Arial, sans-serif",
  mono: "'Geist Mono', 'Courier New', Courier, monospace",
};

const POLICES =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Geist+Mono:wght@400;500&family=Geist:wght@400;500&family=Instrument+Serif:ital@1&display=swap";

// Mobile : une colonne, marges réduites. Sombre : papier → encre (Apple Mail, Outlook macOS/iOS, Outlook.com via [data-ogsc]).
const STYLE = `
:root { color-scheme: light dark; supported-color-schemes: light dark; }
body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; }
a { text-decoration: none; }
.rw-mobile { display: none; max-height: 0; overflow: hidden; mso-hide: all; }
@media only screen and (max-width: 620px) {
  .rw-cadre { width: 100% !important; }
  .rw-pad { padding-left: 20px !important; padding-right: 20px !important; }
  .rw-logo { font-size: 32px !important; }
  .rw-titre { font-size: 44px !important; letter-spacing: -1.6px !important; }
  .rw-intro { font-size: 22px !important; }
  .rw-nom { font-size: 30px !important; }
  .rw-texte { font-size: 16px !important; }
  .rw-liaison { font-size: 18px !important; }
  .rw-img { width: 100% !important; height: auto !important; }
  .rw-col-cote { width: 56px !important; }
  .rw-col-dom { width: 80px !important; }
  .rw-desktop { display: none !important; }
  .rw-mobile { display: block !important; max-height: none !important; overflow: visible !important; }
}
@media (prefers-color-scheme: dark) {
  .rw-papier { background-color: ${C.encre} !important; }
  .rw-brume { background-color: #1c1b19 !important; }
  .rw-encre { color: ${C.papier} !important; }
  .rw-carbone { color: #d6d3cc !important; }
  .rw-graphite { color: #a19d95 !important; }
  .rw-filet { border-color: ${C.papier} !important; }
  .rw-bouton { background-color: ${C.papier} !important; }
  .rw-bouton-txt { color: ${C.encre} !important; }
}
[data-ogsc] .rw-encre { color: ${C.papier} !important; }
[data-ogsc] .rw-carbone { color: #d6d3cc !important; }
[data-ogsc] .rw-graphite { color: #a19d95 !important; }
[data-ogsb] .rw-papier { background-color: ${C.encre} !important; }
[data-ogsb] .rw-brume { background-color: #1c1b19 !important; }
`;

/** Outlook Windows ignore les piles de polices dès qu'une police web est citée : on lui impose les secours */
const STYLE_MSO = `<!--[if mso]><style>
body, table, td, p, a, span { font-family: Helvetica, Arial, sans-serif !important; }
.rw-serif { font-family: Georgia, 'Times New Roman', serif !important; }
.rw-mono { font-family: 'Courier New', Courier, monospace !important; }
</style><![endif]-->`;

const cote = (taille: number, extra?: CSSProperties): CSSProperties => ({
  fontFamily: F.mono,
  fontSize: taille,
  lineHeight: 1.3,
  letterSpacing: taille === 11 ? "0.66px" : "0.52px",
  textTransform: "uppercase",
  margin: 0,
  ...extra,
});

const TABLE = {
  role: "presentation",
  cellPadding: 0,
  cellSpacing: 0,
  border: 0,
  width: "100%",
} as const;

/** Ligne pleine largeur avec les marges latérales de la maquette (40 px, 20 px sur mobile) */
function Bloc({
  children,
  style,
  className,
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <tr>
      <td
        className={`rw-pad ${className ?? ""}`}
        style={{ padding: "0 40px", ...style }}
      >
        {children}
      </td>
    </tr>
  );
}

function Filet({
  epaisseur = 1.5,
  style,
}: {
  epaisseur?: number;
  style?: CSSProperties;
}) {
  return (
    <table {...TABLE} style={style}>
      <tbody>
        <tr>
          <td
            className="rw-filet"
            style={{
              borderTop: `${epaisseur}px solid ${C.encre}`,
              fontSize: 0,
              lineHeight: 0,
              height: 1,
            }}
          >
            &nbsp;
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function Logo({ taille }: { taille: number }) {
  return (
    <a
      href={SITE_URL}
      className="rw-encre rw-logo"
      style={{
        fontFamily: F.display,
        fontWeight: 800,
        fontSize: taille,
        lineHeight: 1,
        letterSpacing: `${-0.06 * taille}px`,
        color: C.encre,
        textDecoration: "none",
      }}
    >
      rework<span style={{ color: C.signal }}>°</span>
    </a>
  );
}

/** Fil rouge vertical entre deux entrées, la phrase de liaison posée dessus */
function Liaison({ texte }: { texte: string }) {
  const fil = (hauteur: number) => (
    <tr>
      <td align="center" style={{ padding: 0 }}>
        <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
          <tbody>
            <tr>
              <td
                style={{
                  width: 2,
                  height: hauteur,
                  backgroundColor: C.signal,
                  fontSize: 0,
                  lineHeight: 0,
                }}
              >
                &nbsp;
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  );
  return (
    <table {...TABLE} style={{ margin: "26px 0 20px" }}>
      <tbody>
        {fil(36)}
        <tr>
          <td
            align="center"
            className="rw-serif rw-liaison"
            style={{
              padding: "6px 16px",
              fontFamily: F.serif,
              fontStyle: "italic",
              fontSize: 20,
              lineHeight: 1.15,
              color: C.signal,
            }}
          >
            {texte}
          </td>
        </tr>
        {fil(36)}
      </tbody>
    </table>
  );
}

function Entree({
  marque,
  rang,
}: {
  marque: Lettre["entrees"][number];
  rang: number;
}) {
  const aura = C.aura[marque.domaine];
  return (
    <>
      {/* Image bloquée : le fond aura du domaine et le texte alternatif restent lisibles, comme le gabarit de la maquette */}
      <a
        href={urlFiche(marque)}
        style={{ display: "block", textDecoration: "none" }}
      >
        <table {...TABLE}>
          <tbody>
            <tr>
              <td style={{ backgroundColor: aura, borderRadius: 20 }}>
                <img
                  src={imageLettre(marque)}
                  width={560}
                  height={300}
                  alt={`${marque.nom} — ${DOMAINES[marque.domaine].nom}`}
                  className="rw-img"
                  style={{
                    display: "block",
                    width: 560,
                    maxWidth: "100%",
                    height: "auto",
                    border: 0,
                    borderRadius: 20,
                    fontFamily: F.mono,
                    fontSize: 12,
                    letterSpacing: "0.48px",
                    textTransform: "uppercase",
                    color: C.encre,
                  }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </a>
      <p
        className="rw-graphite rw-mono"
        style={cote(11, { color: C.graphite, marginTop: 18 })}
      >
        {metaEntree(marque, rang)}
      </p>
      <p style={{ margin: "8px 0 0" }}>
        <a
          href={urlFiche(marque)}
          className="rw-encre rw-nom"
          style={{
            fontFamily: F.display,
            fontWeight: 700,
            fontSize: 36,
            lineHeight: 1,
            letterSpacing: "-0.72px",
            color: C.encre,
            textDecoration: "none",
          }}
        >
          {marque.nom}
        </a>
      </p>
      <p
        className="rw-carbone rw-texte"
        style={{
          fontFamily: F.sans,
          fontSize: 17,
          lineHeight: 1.55,
          letterSpacing: "-0.085px",
          color: C.carbone,
          margin: "14px 0 0",
          maxWidth: 520,
        }}
      >
        {texteEntree(marque)}
      </p>
    </>
  );
}

/** Nombre maximum d'entrées listées ; au-delà, un lien vers l'index */
export const ENTREES_LISTEES = 6;

function ListeEntrees({ lettre }: { lettre: Lettre }) {
  const liste = lettre.entrees.slice(0, ENTREES_LISTEES);
  const reste = lettre.entrees.length - liste.length;
  return (
    <>
      <p
        className="rw-mono"
        style={cote(13, { fontWeight: 500, color: C.signal, marginBottom: 22 })}
      >
        / entrées dans l’archive cette semaine
      </p>
      <table {...TABLE}>
        <tbody>
          {liste.map((m) => {
            const lieu = [m.origine, m.annee || null]
              .filter(Boolean)
              .join(", ");
            const cellule: CSSProperties = {
              padding: "18px 0",
              borderBottom: `1px solid ${C.encre}`,
              verticalAlign: "top",
            };
            return (
              <tr key={m.id}>
                <td
                  className="rw-filet rw-col-cote"
                  width={80}
                  style={{ ...cellule, width: 80 }}
                >
                  <p
                    className="rw-graphite rw-mono"
                    style={cote(11, { color: C.graphite, paddingTop: 5 })}
                  >
                    {m.cote}
                  </p>
                </td>
                <td
                  className="rw-filet"
                  style={{ ...cellule, paddingRight: 16 }}
                >
                  <a
                    href={urlFiche(m)}
                    className="rw-encre"
                    style={{
                      fontFamily: F.display,
                      fontWeight: 600,
                      fontSize: 20,
                      lineHeight: 1.1,
                      letterSpacing: "-0.2px",
                      color: C.encre,
                      textDecoration: "none",
                    }}
                  >
                    {m.nom}
                  </a>
                  <div
                    className="rw-mobile rw-carbone"
                    style={{
                      fontFamily: F.sans,
                      fontSize: 14,
                      lineHeight: 1.5,
                      color: C.carbone,
                      paddingTop: 4,
                    }}
                  >
                    {lieu}
                  </div>
                </td>
                <td
                  className="rw-filet rw-col-dom"
                  width={130}
                  style={{ ...cellule, width: 130, whiteSpace: "nowrap" }}
                >
                  <p
                    className="rw-encre rw-mono"
                    style={cote(11, { color: C.encre, paddingTop: 5 })}
                  >
                    <span style={{ color: C.aura[m.domaine], fontSize: 12 }}>
                      ●
                    </span>
                    &nbsp;&nbsp;{DOMAINES[m.domaine].nom}
                  </p>
                </td>
                <td
                  className="rw-filet rw-desktop"
                  align="right"
                  style={{ ...cellule, whiteSpace: "nowrap" }}
                >
                  <p
                    className="rw-carbone"
                    style={{
                      fontFamily: F.sans,
                      fontWeight: 500,
                      fontSize: 14,
                      lineHeight: 1.5,
                      color: C.carbone,
                      margin: 0,
                      paddingTop: 2,
                    }}
                  >
                    {lieu}
                  </p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {reste > 0 && (
        <p
          className="rw-carbone"
          style={{
            fontFamily: F.sans,
            fontSize: 14,
            lineHeight: 1.5,
            color: C.carbone,
            margin: "18px 0 0",
          }}
        >
          {`+ ${reste} ${reste > 1 ? "autres entrées" : "autre entrée"} — `}
          <a
            href={`${SITE_URL}/index`}
            style={{ color: C.signal, textDecoration: "underline" }}
          >
            tout voir dans l’index
          </a>
        </p>
      )}
    </>
  );
}

export type OptionsLettre = {
  lettre: Lettre;
  /** Lien de désinscription : « {{ unsubscribe }} » dans une campagne Brevo, la page confidentialité ailleurs */
  desinscription: string;
};

export function LettreEmail({ lettre, desinscription }: OptionsLettre) {
  const { trio } = lettre;
  const enLigne = `${SITE_URL}${lettre.chemin}`;
  return (
    <Html lang="fr" dir="ltr">
      <Head>
        <title>{lettre.sujet}</title>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <link rel="stylesheet" href={POLICES} />
        <style>{STYLE}</style>
      </Head>
      <Preview>{lettre.apercu}</Preview>
      <Body
        className="rw-papier"
        style={{ margin: 0, padding: 0, backgroundColor: C.papier }}
      >
        <table
          {...TABLE}
          className="rw-papier"
          style={{ backgroundColor: C.papier }}
        >
          <tbody>
            <tr>
              <td align="center" style={{ padding: 0 }}>
                <table
                  {...TABLE}
                  width={640}
                  className="rw-cadre rw-papier"
                  style={{
                    width: 640,
                    maxWidth: 640,
                    backgroundColor: C.papier,
                  }}
                >
                  <tbody>
                    {/* Pré-en-tête */}
                    <tr>
                      <td
                        className="rw-brume"
                        style={{ backgroundColor: C.brume }}
                      >
                        <table {...TABLE}>
                          <tbody>
                            <tr>
                              <td
                                className="rw-pad rw-carbone rw-mono"
                                style={cote(11, {
                                  color: C.carbone,
                                  padding: "12px 12px 11px 40px",
                                } as CSSProperties)}
                              >
                                {`Le trio de la semaine : ${trio.titre.toLowerCase().replace(/\.$/, "")}.`}
                              </td>
                              <td
                                className="rw-pad rw-mono"
                                align="right"
                                style={cote(11, {
                                  padding: "12px 40px 11px 0",
                                  whiteSpace: "nowrap",
                                })}
                              >
                                <a
                                  href={enLigne}
                                  className="rw-carbone"
                                  style={{
                                    color: C.carbone,
                                    textDecoration: "underline",
                                  }}
                                >
                                  voir en ligne
                                </a>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* En-tête */}
                    <Bloc style={{ paddingTop: 30 }}>
                      <table {...TABLE}>
                        <tbody>
                          <tr>
                            <td style={{ verticalAlign: "top" }}>
                              <Logo taille={40} />
                            </td>
                            <td
                              align="right"
                              className="rw-encre rw-mono"
                              style={cote(11, {
                                lineHeight: 1.4,
                                color: C.encre,
                                verticalAlign: "top",
                                paddingTop: 4,
                                whiteSpace: "nowrap",
                              })}
                            >
                              {`Lettre n°${lettre.numero}`}
                              <br />
                              {`Semaine du ${lettre.semaineDu}`}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <Filet style={{ marginTop: 22 }} />
                    </Bloc>

                    {/* Trio : titre + intro */}
                    <Bloc style={{ paddingTop: 30 }}>
                      <p
                        className="rw-mono"
                        style={cote(13, { fontWeight: 500, color: C.signal })}
                      >
                        / le trio de la semaine
                      </p>
                      <h1
                        className="rw-encre rw-titre"
                        style={{
                          fontFamily: F.display,
                          fontWeight: 800,
                          fontSize: 64,
                          lineHeight: 0.9,
                          letterSpacing: "-2.56px",
                          color: C.encre,
                          margin: "13px 0 0 -2px",
                        }}
                      >
                        {trio.titre}
                      </h1>
                      <p
                        className="rw-carbone rw-serif rw-intro"
                        style={{
                          fontFamily: F.serif,
                          fontStyle: "italic",
                          fontSize: 26,
                          lineHeight: 1.15,
                          color: C.carbone,
                          margin: "28px 0 0",
                          maxWidth: 520,
                        }}
                      >
                        {trio.intro}
                      </p>
                    </Bloc>

                    {/* Les trois entrées, reliées par les fils rouges */}
                    <Bloc style={{ paddingTop: 30 }}>
                      {trio.items.map((m, i) => (
                        <div key={m.id}>
                          <Entree marque={m} rang={i + 1} />
                          {i < 2 && <Liaison texte={trio.liens[i]} />}
                        </div>
                      ))}
                      <Filet style={{ marginTop: 37 }} />
                    </Bloc>

                    {/* Entrées de la semaine */}
                    <Bloc style={{ paddingTop: 30 }}>
                      {lettre.entrees.length > 0 ? (
                        <ListeEntrees lettre={lettre} />
                      ) : (
                        <>
                          <p
                            className="rw-mono"
                            style={cote(13, {
                              fontWeight: 500,
                              color: C.signal,
                            })}
                          >
                            / entrées dans l’archive cette semaine
                          </p>
                          <p
                            className="rw-carbone rw-serif"
                            style={{
                              fontFamily: F.serif,
                              fontStyle: "italic",
                              fontSize: 22,
                              lineHeight: 1.2,
                              color: C.carbone,
                              margin: "16px 0 0",
                            }}
                          >
                            Pas de nouvelle entrée cette semaine : l’archive
                            prend son temps.
                          </p>
                        </>
                      )}
                    </Bloc>

                    {/* Bouton */}
                    <tr>
                      <td
                        align="center"
                        className="rw-pad"
                        style={{ padding: "48px 40px 59px" }}
                      >
                        <table
                          role="presentation"
                          cellPadding={0}
                          cellSpacing={0}
                          border={0}
                        >
                          <tbody>
                            <tr>
                              <td
                                className="rw-bouton"
                                style={{
                                  backgroundColor: C.encre,
                                  borderRadius: 999,
                                }}
                              >
                                <a
                                  href={`${SITE_URL}/index`}
                                  className="rw-bouton-txt"
                                  style={{
                                    display: "inline-block",
                                    padding: "18px 30px",
                                    fontFamily: F.sans,
                                    fontSize: 16,
                                    lineHeight: 1.55,
                                    letterSpacing: "-0.08px",
                                    color: C.papier,
                                    textDecoration: "none",
                                    borderRadius: 999,
                                  }}
                                >
                                  Explorer l’archive →
                                </a>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* Pied */}
                    <tr>
                      <td
                        className="rw-brume rw-pad"
                        style={{
                          backgroundColor: C.brume,
                          padding: "36px 40px",
                        }}
                      >
                        <Logo taille={28} />
                        <p
                          className="rw-carbone"
                          style={{
                            fontFamily: F.sans,
                            fontWeight: 500,
                            fontSize: 13,
                            lineHeight: 1.5,
                            color: C.carbone,
                            margin: "20px 0 0",
                            maxWidth: 520,
                          }}
                        >
                          rework° — archive vivante de la culture contemporaine.
                          Paris.
                          <br />
                          Tu reçois cette lettre parce que tu t’es inscrit·e sur
                          rework.
                        </p>
                        <p
                          className="rw-encre rw-mono"
                          style={cote(11, { color: C.encre, marginTop: 37 })}
                        >
                          <a
                            href={desinscription}
                            className="rw-encre"
                            style={{
                              color: C.encre,
                              textDecoration: "underline",
                            }}
                          >
                            Se désinscrire
                          </a>
                          {" · "}
                          <a
                            href={enLigne}
                            className="rw-encre"
                            style={{
                              color: C.encre,
                              textDecoration: "underline",
                            }}
                          >
                            Voir en ligne
                          </a>
                          {" · "}
                          <a
                            href={`${SITE_URL}/confidentialite`}
                            className="rw-encre"
                            style={{
                              color: C.encre,
                              textDecoration: "underline",
                            }}
                          >
                            Confidentialité
                          </a>
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </Body>
    </Html>
  );
}

export { STYLE_MSO };
