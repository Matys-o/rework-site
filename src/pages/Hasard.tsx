import { useState } from "react";
import { Navigate } from "react-router";
import { MARQUES } from "../data/brands";
import { lienMarque } from "../lib/liens";

/** /hasard — ouvre une fiche tirée au sort */
export default function Hasard() {
  const [slug] = useState(() => MARQUES[Math.floor(Math.random() * MARQUES.length)].slug);
  return <Navigate to={lienMarque(slug)} replace />;
}
