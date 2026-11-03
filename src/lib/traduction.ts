/**
 * Compatibilité avec la traduction intégrée des navigateurs (Chrome / Google Traduction, Edge, Safari…).
 *
 * Le traducteur remplace les nœuds texte de la page par ses propres éléments (<font>…). React, qui garde
 * une référence vers les nœuds d'origine, plante ensuite au rendu suivant (« Failed to execute 'removeChild'
 * on 'Node' » / « insertBefore ») : page blanche dès qu'on filtre l'index ou qu'on ouvre le menu.
 * Correctif connu (facebook/react#11538) : quand le nœud visé n'est plus à sa place, on ignore l'opération
 * au lieu de lever une erreur. Sans traducteur actif, le comportement est strictement identique.
 */
export function protegerContreLaTraduction() {
  if (typeof Node !== "function" || !Node.prototype) return;

  const retirer = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, enfant: T): T {
    if (enfant.parentNode !== this) return enfant;
    return retirer.call(this, enfant) as T;
  };

  const inserer = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(this: Node, nouveau: T, reference: Node | null): T {
    if (reference && reference.parentNode !== this) return nouveau;
    return inserer.call(this, nouveau, reference) as T;
  };
}
