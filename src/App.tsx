import { MotionConfig } from "motion/react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router";
import { Defilement } from "./components/Defilement";
import { FpsMetre } from "./components/FpsMetre";
import { Navigation } from "./components/Navigation";
import Accueil from "./pages/Accueil";
import Composants from "./pages/Composants";
import Hasard from "./pages/Hasard";
import Index from "./pages/Index";
import Manifeste from "./pages/Manifeste";
import MarquePage from "./pages/MarquePage";
import Trios from "./pages/Trios";

/** Une clé par chemin : chaque page est remontée (apparitions rejouées), mais pas quand seuls les filtres ?… changent */
function Pages() {
  const location = useLocation();
  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<Accueil />} />
      <Route path="/index" element={<Index />} />
      <Route path="/marque/:slug" element={<MarquePage />} />
      <Route path="/manifeste" element={<Manifeste />} />
      <Route path="/hasard" element={<Hasard />} />
      <Route path="/trios" element={<Trios />} />
      <Route path="/composants" element={<Composants />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/* prefers-reduced-motion : Motion coupe aussi les animations de transform et de layout */}
      <MotionConfig reducedMotion="user">
      <Defilement />
      <Navigation />
      <Pages />
      <FpsMetre />
      </MotionConfig>
    </BrowserRouter>
  );
}
