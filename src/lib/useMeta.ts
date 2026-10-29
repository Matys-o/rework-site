import { useEffect } from "react";
import { balisesHtml, type Meta } from "./meta";

/**
 * Met à jour le <head> pendant la navigation interne (les balises de la première page viennent du HTML prérendu).
 * Même rendu que le prérendu (balisesHtml) : titre, description, canonical, Open Graph, Twitter, JSON-LD.
 */
export function useMeta(meta: Meta | null | undefined) {
  const cle = meta ? `${meta.chemin}|${meta.titre}` : "";
  useEffect(() => {
    if (!meta) return;
    const modele = document.createElement("template");
    modele.innerHTML = balisesHtml(meta);
    const head = document.head;
    head.querySelectorAll('script[type="application/ld+json"]').forEach((s) => s.remove());
    for (const el of Array.from(modele.content.children)) {
      if (el.tagName === "TITLE") {
        document.title = el.textContent ?? "";
        continue;
      }
      if (el.tagName === "SCRIPT") {
        // Un <script> cloné depuis un template n'est pas exécuté, mais reste lisible (JSON-LD)
        head.appendChild(el.cloneNode(true));
        continue;
      }
      const attribut = el.getAttribute("property") ? "property" : el.getAttribute("name") ? "name" : "rel";
      const valeur = el.getAttribute(attribut)!;
      const existant = head.querySelector(`${el.tagName.toLowerCase()}[${attribut}="${valeur}"]`);
      if (existant) existant.replaceWith(el.cloneNode(true));
      else head.appendChild(el.cloneNode(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle]);
}
