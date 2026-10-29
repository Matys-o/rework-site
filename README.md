# rework° 2.0

Refonte de [rework-archive.pages.dev](https://rework-archive.pages.dev) — archive de 335 entités : 285 marques (Mode, Design, Tech, Digital) et 50 films (top Letterboxd).
DA « Le Signal » : Figma `r5Gi2x15iNzlUHsmOrmxKO` (sections 01 Direction artistique / 02 Composants).

## Stack

Vite 7 · React 19 · TypeScript · Tailwind CSS 4 (`@tailwindcss/vite`) · React Router 7 · Cloudflare Pages.

```bash
npm install
npm run dev       # http://localhost:5173/composants
npm run build     # → dist/
npm run deploy    # wrangler pages deploy dist --project-name rework-2 (projet séparé de la prod)
```

`public/_redirects` assure le fallback SPA sur Cloudflare Pages.

## Organisation

- `src/styles/tokens.css` — tokens (`@theme`) : couleurs, espaces, rayons, ombres, flous, motion ; styles typo `t-*` (Rework/…) ; matières `verre`, `verre-pill`, `aura`, `aura-douce`.
- `src/components/` — Nav, Lien, Bouton, Filtre, Recherche, Fiche, Domaine, LigneIndex, Footer, Bandeau, Aura / AuraAnimee, Icone, Logo.
- `src/data/marques.ts` — 8 marques de démo (Supabase plus tard).
- `src/pages/Composants.tsx` — bibliothèque `/composants`.

## Règles de la DA

- Papier 60 % · Encre 30 % · Signal 10 % max.
- Une aura n'apparaît jamais nue : toujours floutée, toujours derrière du verre.
- Motion : bandeau 20 s linéaire ; auras 8 s ease-in-out ; survol 240 ms ease-out (`ease-rw`).
  Tout est coupé si `prefers-reduced-motion`.
