import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { protegerContreLaTraduction } from "./lib/traduction";
import "./index.css";

// Avant le premier rendu : la traduction du navigateur ne doit jamais faire planter React
protegerContreLaTraduction();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
