import type { ReactNode } from "react";
import { cn } from "../lib/cn";

// Grille du site : 12 colonnes, gouttière 20 → contenu max 1280.
// Marges latérales fluides (--marge : 16 → 80 px). Mobile : 4 colonnes.

export function Conteneur({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[calc(1280px+2*var(--marge))] px-(--marge)", className)}>{children}</div>;
}

export function Grille({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("grid grid-cols-4 gap-x-4 md:grid-cols-12 md:gap-x-5", className)}>{children}</div>;
}
