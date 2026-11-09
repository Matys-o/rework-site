import { MotionConfig } from "motion/react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router";
import { Defilement } from "./components/Defilement";
import { FpsMetre } from "./components/FpsMetre";
import IntroRework from "./components/IntroRework/IntroRework";
import { Navigation } from "./components/Navigation";
import { BoutonRewMobile, RouteRew } from "./components/Rew/RouteRew";
import { PanneauRew } from "./components/Rew/PanneauRew";
import Accueil from "./pages/Accueil";
import Composants from "./pages/Composants";
import Confidentialite, { InscriptionConfirmee } from "./pages/Confidentialite";
import Hasard from "./pages/Hasard";
import Index from "./pages/Index";
import Manifeste from "./pages/Manifeste";
import MarquePage from "./pages/MarquePage";
import Trios, { TrioPage } from "./pages/Trios";
import { MusiqueAccueil, MusiqueAlbums, MusiqueArtistes, MusiqueGenres } from "./pages/Musique";
import { ArtistePage, GenrePage, SortiePage } from "./pages/MusiqueFiche";

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
      <Route path="/rew" element={<RouteRew />} />
      <Route path="/musique" element={<MusiqueAccueil />} />
      <Route path="/musique/artistes" element={<MusiqueArtistes />} />
      <Route path="/musique/albums" element={<MusiqueAlbums />} />
      <Route path="/musique/genres" element={<MusiqueGenres />} />
      <Route path="/musique/artiste/:slug" element={<ArtistePage />} />
      <Route path="/musique/album/:slug" element={<SortiePage />} />
      <Route path="/musique/genre/:slug" element={<GenrePage />} />
      <Route path="/trios" element={<Trios />} />
      <Route path="/trios/:semaine" element={<TrioPage />} />
      <Route path="/confidentialite" element={<Confidentialite />} />
      <Route path="/inscription-confirmee" element={<InscriptionConfirmee />} />
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
        <PanneauRew />
        <BoutonRewMobile />
        <FpsMetre />
        {/* Intro animée : une seule fois, hors des routes */}
        <IntroRework />
      </MotionConfig>
    </BrowserRouter>
  );
}
