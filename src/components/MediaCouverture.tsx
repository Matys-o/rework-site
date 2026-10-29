import { useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/cn";

type MediaCouvertureProps = {
  src: string;
  /** Fichier .mp4 / .webm : vidéo muette en boucle, jouée seulement quand elle est visible */
  video?: boolean;
  alt: string;
  /** Hero de la page marque : chargement immédiat au lieu de lazy */
  prioritaire?: boolean;
  className?: string;
};

/**
 * Photo (ou vidéo) de couverture posée sur « aura + initiale » :
 * l'aura reste visible pendant le chargement (fondu à l'arrivée) et en secours si le fichier ne charge pas.
 */
export function MediaCouverture({ src, video = false, alt, prioritaire = false, className }: MediaCouvertureProps) {
  const [etat, setEtat] = useState<"chargement" | "pret" | "erreur">("chargement");
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const visible = useInView(videoRef, { amount: 0.25 });
  const reduit = useReducedMotion();

  // Image déjà en cache : load a pu partir avant que React n'écoute
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete) setEtat(img.naturalWidth > 0 ? "pret" : "erreur");
  }, [src]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (visible && !reduit) v.play().catch(() => {});
    else v.pause();
  }, [visible, reduit]);

  if (etat === "erreur") return null;

  const classes = cn(
    "absolute inset-0 size-full object-cover transition-opacity duration-500 ease-rw",
    etat === "pret" ? "opacity-100" : "opacity-0",
    className,
  );

  return video ? (
    <video
      ref={videoRef}
      // #t : affiche la première image avant lecture (Safari)
      src={`${src}#t=0.1`}
      muted
      loop
      playsInline
      disablePictureInPicture
      preload={prioritaire ? "auto" : "metadata"}
      aria-label={alt}
      onLoadedData={() => setEtat("pret")}
      onError={() => setEtat("erreur")}
      className={classes}
    />
  ) : (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      loading={prioritaire ? "eager" : "lazy"}
      decoding="async"
      onLoad={() => setEtat("pret")}
      onError={() => setEtat("erreur")}
      className={classes}
    />
  );
}
