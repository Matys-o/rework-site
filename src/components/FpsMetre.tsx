import { useEffect, useState } from "react";

/**
 * Compteur d'images/s pour vérifier les perfs sur ta machine : ajoute ?fps à l'URL
 * (mémorisé pour la session ; ?fps=0 pour le retirer). N'apparaît jamais sinon.
 */
export function FpsMetre() {
  const [actif] = useState(() => {
    const p = new URLSearchParams(window.location.search).get("fps");
    if (p === "0") sessionStorage.removeItem("rwFps");
    else if (p !== null) sessionStorage.setItem("rwFps", "1");
    return sessionStorage.getItem("rwFps") === "1";
  });
  const [mesure, setMesure] = useState({ fps: 0, min: 0 });

  useEffect(() => {
    if (!actif) return;
    let images = 0;
    let debut = performance.now();
    const historique: number[] = [];
    let id = 0;
    const tic = (now: number) => {
      images++;
      if (now - debut >= 1000) {
        const fps = Math.round((images * 1000) / (now - debut));
        historique.push(fps);
        if (historique.length > 10) historique.shift();
        setMesure({ fps, min: Math.min(...historique) });
        images = 0;
        debut = now;
      }
      id = requestAnimationFrame(tic);
    };
    id = requestAnimationFrame(tic);
    return () => cancelAnimationFrame(id);
  }, [actif]);

  if (!actif) return null;
  return (
    <div
      className="t-cote-s pointer-events-none fixed bottom-3 left-3 z-[100] rounded-chip bg-encre/85 px-3 py-2 text-papier"
      style={{ color: mesure.min && mesure.min < 50 ? "var(--color-signal)" : undefined }}
    >
      {mesure.fps} fps · min 10 s : {mesure.min}
    </div>
  );
}
