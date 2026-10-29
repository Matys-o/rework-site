// Email de confirmation d'inscription (double opt-in Brevo) — même DA que la lettre, en plus sobre.
// Brevo remplace {{ doubleoptin }} par le lien de confirmation propre à chaque contact.
import { Body, Head, Html, Preview } from "@react-email/components";
import { render } from "@react-email/render";
import { SITE_URL } from "../lib/site";

const C = {
  encre: "#0e0e0e",
  carbone: "#2a2926",
  graphite: "#75726b",
  papier: "#eeece7",
  brume: "#e2e0d9",
  signal: "#ff3d2e",
};
const F = {
  display: "'Bricolage Grotesque', Helvetica, Arial, sans-serif",
  serif: "'Instrument Serif', Georgia, 'Times New Roman', serif",
  sans: "Geist, Helvetica, Arial, sans-serif",
  mono: "'Geist Mono', 'Courier New', Courier, monospace",
};
const POLICES =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Geist+Mono:wght@400;500&family=Geist:wght@400&family=Instrument+Serif:ital@1&display=swap";

const STYLE = `
:root { color-scheme: light dark; supported-color-schemes: light dark; }
@media only screen and (max-width: 620px) {
  .rw-cadre { width: 100% !important; }
  .rw-pad { padding-left: 20px !important; padding-right: 20px !important; }
  .rw-titre { font-size: 40px !important; }
}
@media (prefers-color-scheme: dark) {
  .rw-papier { background-color: ${C.encre} !important; }
  .rw-encre { color: ${C.papier} !important; }
  .rw-carbone { color: #d6d3cc !important; }
  .rw-bouton { background-color: ${C.papier} !important; }
  .rw-bouton-txt { color: ${C.encre} !important; }
}
`;

export const LIEN_CONFIRMATION = "{{ doubleoptin }}";

const TABLE = {
  role: "presentation",
  cellPadding: 0,
  cellSpacing: 0,
  border: 0,
  width: "100%",
} as const;

export function ConfirmationEmail() {
  return (
    <Html lang="fr" dir="ltr">
      <Head>
        <title>Confirme ton inscription à la lettre de rework°</title>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <link rel="stylesheet" href={POLICES} />
        <style>{STYLE}</style>
      </Head>
      <Preview>
        Un clic pour recevoir la lettre de rework° chaque lundi.
      </Preview>
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
              <td align="center">
                <table
                  {...TABLE}
                  width={640}
                  className="rw-cadre"
                  style={{ width: 640, maxWidth: 640 }}
                >
                  <tbody>
                    <tr>
                      <td
                        className="rw-pad"
                        style={{ padding: "40px 40px 56px" }}
                      >
                        <a
                          href={SITE_URL}
                          className="rw-encre"
                          style={{
                            fontFamily: F.display,
                            fontWeight: 800,
                            fontSize: 32,
                            lineHeight: 1,
                            letterSpacing: "-1.9px",
                            color: C.encre,
                            textDecoration: "none",
                          }}
                        >
                          rework<span style={{ color: C.signal }}>°</span>
                        </a>
                        <p
                          style={{
                            fontFamily: F.mono,
                            fontWeight: 500,
                            fontSize: 13,
                            lineHeight: 1.3,
                            letterSpacing: "0.52px",
                            textTransform: "uppercase",
                            color: C.signal,
                            margin: "48px 0 0",
                          }}
                        >
                          / la lettre
                        </p>
                        <h1
                          className="rw-encre rw-titre"
                          style={{
                            fontFamily: F.display,
                            fontWeight: 800,
                            fontSize: 48,
                            lineHeight: 0.95,
                            letterSpacing: "-1.9px",
                            color: C.encre,
                            margin: "12px 0 0",
                          }}
                        >
                          Un clic, et c’est rangé.
                        </h1>
                        <p
                          className="rw-carbone"
                          style={{
                            fontFamily: F.serif,
                            fontStyle: "italic",
                            fontSize: 24,
                            lineHeight: 1.15,
                            color: C.carbone,
                            margin: "20px 0 0",
                          }}
                        >
                          Confirme ton adresse pour recevoir la lettre chaque
                          lundi.
                        </p>
                        <table
                          role="presentation"
                          cellPadding={0}
                          cellSpacing={0}
                          border={0}
                          style={{ marginTop: 32 }}
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
                                  href={LIEN_CONFIRMATION}
                                  className="rw-bouton-txt"
                                  style={{
                                    display: "inline-block",
                                    padding: "18px 30px",
                                    fontFamily: F.sans,
                                    fontSize: 16,
                                    lineHeight: 1.55,
                                    color: C.papier,
                                    textDecoration: "none",
                                    borderRadius: 999,
                                  }}
                                >
                                  Confirmer mon inscription →
                                </a>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <p
                          className="rw-carbone"
                          style={{
                            fontFamily: F.sans,
                            fontSize: 14,
                            lineHeight: 1.5,
                            color: C.carbone,
                            margin: "32px 0 0",
                          }}
                        >
                          Pas toi ? Ignore simplement cet email : sans clic, ton
                          adresse n’est pas ajoutée.
                        </p>
                        <p
                          style={{
                            fontFamily: F.mono,
                            fontSize: 11,
                            lineHeight: 1.3,
                            letterSpacing: "0.66px",
                            textTransform: "uppercase",
                            color: C.graphite,
                            margin: "40px 0 0",
                          }}
                        >
                          rework° — archive vivante de la culture contemporaine
                          ·{" "}
                          <a
                            href={`${SITE_URL}/confidentialite`}
                            style={{
                              color: C.graphite,
                              textDecoration: "underline",
                            }}
                          >
                            confidentialité
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

export const rendreConfirmation = () => render(<ConfirmationEmail />);
