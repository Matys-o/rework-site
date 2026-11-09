import { DOMAINES, type DomaineId } from "../data/brands";
import {
  CLES_FILTRES,
  COULEURS_OPTIONS,
  EPOQUES,
  FAMILLES,
  PRIX,
  TITRES_FILTRES,
  type CleFiltre,
  type Selection,
} from "../data/filtres";
import { TiroirFiltres, type SectionTiroir } from "./TiroirFiltres";

type PanneauFiltresProps = {
  ouvert: boolean;
  onFermer: () => void;
  domaine: DomaineId | null;
  selection: Selection;
  /** Pays présents dans les résultats de base, du plus fréquent au plus rare */
  pays: string[];
  /** Nombre de marques par valeur, compte tenu des AUTRES filtres actifs */
  comptes: Record<CleFiltre, Record<string, number>>;
  total: number;
  onBasculer: (cle: CleFiltre, valeur: string) => void;
  onEffacer: () => void;
};

// Filtres de la page Marques : famille, pays, époque, couleur, gamme de prix (tiroir commun TiroirFiltres)
export function PanneauFiltres({
  ouvert,
  onFermer,
  domaine,
  selection,
  pays,
  comptes,
  total,
  onBasculer,
  onEffacer,
}: PanneauFiltresProps) {
  // Familles : celles de l'univers choisi, sinon toutes, regroupées par univers
  const groupesFamilles =
    domaine && domaine !== "film"
      ? [{ options: FAMILLES[domaine] }]
      : (Object.keys(FAMILLES) as (keyof typeof FAMILLES)[]).map((d) => ({
          titre: DOMAINES[d].nom,
          options: FAMILLES[d],
        }));

  const options = {
    famille: null,
    pays: pays.map((p) => ({ id: p, label: p })),
    epoque: EPOQUES,
    couleur: COULEURS_OPTIONS,
    prix: PRIX,
  };
  const notes: Partial<Record<CleFiltre, string>> = {
    prix: "Gamme estimée par la rédaction, à titre indicatif.",
    couleur: "Teinte dominante de l'image de la fiche.",
  };

  const sections: SectionTiroir[] = CLES_FILTRES.map((cle) => ({
    cle,
    titre: TITRES_FILTRES[cle],
    groupes:
      cle === "famille" ? groupesFamilles : [{ options: options[cle] ?? [] }],
    note: notes[cle],
  }));

  return (
    <TiroirFiltres
      ouvert={ouvert}
      onFermer={onFermer}
      sections={sections}
      selection={selection}
      comptes={comptes}
      voir={
        total === 0
          ? "Aucune marque"
          : `Voir ${total} marque${total > 1 ? "s" : ""}`
      }
      onBasculer={(cle, v) => onBasculer(cle as CleFiltre, v)}
      onEffacer={onEffacer}
    />
  );
}
