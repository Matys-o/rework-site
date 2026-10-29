// Cloudflare Pages Function — /index (seule route incluse dans public/_routes.json).
// Middleware plutôt que functions/index.ts : ce nom désigne la racine « / » dans le routage des Functions.
// Cloudflare Pages réserve /index à la page racine (redirection vers /) : la page prérendue de l'index est servie ici
// depuis index-rendu.html. Avec un filtre (?domaine=film…), titre, description et canonical suivent le domaine,
// toujours sans JavaScript.
import { DOMAINES, type DomaineId } from "../src/data/brands";
import { balisesHtml, metaIndex } from "../src/lib/meta";

type Contexte = {
  request: Request;
  next: () => Promise<Response>;
  env: { ASSETS: { fetch: (entree: Request | URL | string) => Promise<Response> } };
};

export const onRequestGet = async ({ request, env, next }: Contexte) => {
  const url = new URL(request.url);
  if (url.pathname !== "/index") return next();

  const page = await env.ASSETS.fetch(new URL("/index-rendu", url));
  const domaine = url.searchParams.get("domaine");
  if (!page.ok || !domaine || !(domaine in DOMAINES)) return page;

  const html = (await page.text()).replace(
    /<!--meta:debut-->[\s\S]*?<!--meta:fin-->/,
    `<!--meta:debut-->\n    ${balisesHtml(metaIndex(domaine as DomaineId))}\n    <!--meta:fin-->`,
  );
  const entetes = new Headers(page.headers);
  entetes.delete("content-length");
  return new Response(html, { status: 200, headers: entetes });
};
