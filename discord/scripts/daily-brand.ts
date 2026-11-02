// Publie la marque du jour dans 🏷️・marque-du-jour (ou le film du jour avec --pool=film).
//
//   npm run discord:daily                      → publie si on est après 9 h à Paris et rien n'est encore parti aujourd'hui
//   npm run discord:daily -- --dry-run         → affiche le message sans rien envoyer ni enregistrer
//   npm run discord:daily -- --pool=film       → film du jour
//   npm run discord:daily -- --now             → ignore la vérification de l'heure (lancement manuel)
//   npm run discord:daily -- --force           → publie même si une entrée est déjà partie aujourd'hui
//
// Garanties : jamais deux fois la même entrée dans un tour ; même tirage si on relance le même jour ;
// aucun message cassé en public (image vérifiée avant l'envoi) ; rapport dans 🤖・bot en cas de succès comme d'erreur.
import type { Guild } from "discord.js";
import { ROLE_DOMAINE } from "../config/server.ts";
import { entrees, ordreDuJour, probleme, type Marque, type Pool } from "../lib/brands.ts";
import { connecter, rapport, salon } from "../lib/discord.ts";
import { apercu, messageEntree } from "../lib/embeds.ts";
import { args, lancer } from "../lib/env.ts";
import { ecrireEtat, lireEtat, lireIds, sortieGithub, type Fil, type Ids } from "../lib/fichiers.ts";
import { HEURE_PUBLICATION, paris } from "../lib/temps.ts";

const ESSAIS_MAX = 15;

const CONFIG = {
  marque: { salon: "marque-du-jour", notif: "notif-marque", libelle: "Marque du jour" },
  film: { salon: "film-du-jour", notif: "notif-film", libelle: "Film du jour" },
} as const;

/**
 * Filet de sécurité : si un commit de state/posted.json s'est perdu, on relit les derniers messages du bot
 * dans le salon pour ne jamais republier une entrée déjà passée.
 */
async function resynchroniser(guild: Guild, ids: Ids, pool: Pool, fil: Fil) {
  const c = await salon(guild, ids, CONFIG[pool].salon);
  const messages = await c.messages.fetch({ limit: 50 });
  const parSlug = new Map(entrees(pool).map((m) => [m.slug, m]));
  const connus = new Set(fil.publiees.map((p) => p.slug));
  let ajoutes = 0;
  for (const msg of [...messages.values()].reverse()) {
    if (msg.author.id !== guild.client.user.id) continue;
    const e = msg.embeds[0];
    const slug = e?.url?.match(/\/marque\/([^?#/]+)/)?.[1];
    const m = slug ? parSlug.get(slug) : undefined;
    const numero = Number(e?.footer?.text.match(/n°(\d+)/)?.[1] ?? 0);
    if (numero > fil.total) fil.total = numero;
    if (!m || connus.has(m.slug)) continue;
    fil.publiees.push({ id: m.id, slug: m.slug, nom: m.nom, date: paris(msg.createdAt).date, message: msg.id });
    connus.add(m.slug);
    ajoutes++;
  }
  if (ajoutes) console.log(`↺ ${ajoutes} publication(s) retrouvée(s) dans le salon et ajoutée(s) à l'historique.`);
}

lancer(async () => {
  const a = args();
  const pool: Pool = a.pool === "film" ? "film" : "marque";
  const cfg = CONFIG[pool];
  const etat = lireEtat();
  const ids = lireIds();
  const fil = etat[pool];
  const maintenant = paris();
  const jour = a.date ?? maintenant.date;

  if (!a.dryRun && !a.now && !a.date && maintenant.heure < HEURE_PUBLICATION) {
    console.log(`⏳ Il est ${maintenant.heure} h à Paris : la publication part à ${HEURE_PUBLICATION} h. Rien à faire.`);
    return;
  }

  const ctx = a.dryRun ? null : await connecter();
  try {
    if (ctx) await resynchroniser(ctx.guild, ids, pool, fil);

    const deja = fil.publiees.find((p) => p.date === jour);
    if (deja && !a.force) {
      console.log(`✔ ${cfg.libelle} déjà publié(e) le ${jour} : ${deja.nom}. Rien à faire (--force pour republier).`);
      return;
    }

    // Tour complet → nouveau tour, nouvel ordre
    if (ordreDuJour(pool, fil, jour).length === 0) {
      console.log(`🔁 Toutes les entrées ont été publiées : début du tour n°${fil.cycle + 1}.`);
      fil.cycle++;
      fil.publiees = [];
      fil.ignorees = [];
      fil.cycleDebut = jour;
    }
    fil.cycleDebut ??= jour;

    // Première entrée publiable dans l'ordre du jour
    let choisie: Marque | undefined;
    const ecartees: string[] = [];
    for (const m of ordreDuJour(pool, fil, jour).slice(0, ESSAIS_MAX)) {
      const pb = await probleme(m);
      if (!pb) {
        choisie = m;
        break;
      }
      ecartees.push(`${m.nom} (${pb})`);
      fil.ignorees.push({ id: m.id, slug: m.slug, date: jour, raison: pb });
    }
    if (!choisie) throw new Error(`Aucune entrée publiable parmi les ${ESSAIS_MAX} suivantes : ${ecartees.join(" ; ")}`);

    const roles = [ids.roles[cfg.notif], ids.roles[ROLE_DOMAINE[choisie.domaine]]].filter(Boolean);
    const numero = fil.total + 1;
    const message = messageEntree(choisie, { pool, numero, date: jour, rolesMentionnes: roles });

    if (a.dryRun) {
      console.log(`\n${cfg.libelle} du ${jour} — aperçu (rien n'est envoyé ni enregistré)\n`);
      console.log(apercu(message));
      if (ecartees.length) console.log(`\nÉcartées avant elle : ${ecartees.join(" ; ")}`);
      if (!roles.length) console.log("\n(rôles inconnus : lance npm run discord:setup pour que les mentions fonctionnent)");
      return;
    }

    const { guild } = ctx!;
    const c = await salon(guild, ids, cfg.salon);
    const envoye = await c.send(message);

    // Enregistré tout de suite : même si une étape suivante échoue, on ne republiera pas cette entrée.
    fil.total = numero;
    fil.publiees.push({ id: choisie.id, slug: choisie.slug, nom: choisie.nom, date: jour, message: envoye.id });
    ecrireEtat(etat);
    sortieGithub("nom", choisie.nom);

    const avertissements: string[] = [];
    if (envoye.crosspostable) await envoye.crosspost().catch((e) => avertissements.push(`publication aux abonnés : ${e.message}`));
    for (const r of ["🔥", "💾"]) await envoye.react(r).catch((e) => avertissements.push(`réaction ${r} : ${e.message}`));
    await envoye
      .startThread({ name: "On en parle ? 💬", autoArchiveDuration: 1440 })
      .catch((e) => avertissements.push(`fil : ${e.message}`));

    console.log(`✅ ${cfg.libelle} publié(e) : ${choisie.nom} (n°${numero}) → ${envoye.url}`);
    await rapport(
      guild,
      ids,
      [
        `✅ **${cfg.libelle}** : ${choisie.nom} (n°${numero}) → ${envoye.url}`,
        ecartees.length ? `↪ écartées : ${ecartees.join(" ; ")}` : "",
        avertissements.length ? `⚠️ ${avertissements.join(" ; ")}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );
  } catch (e) {
    if (ctx) {
      ecrireEtat(etat); // garde les entrées écartées pour ne pas les retenter demain
      await rapport(ctx.guild, ids, `❌ **${cfg.libelle}** du ${jour} non publié(e) : ${e instanceof Error ? e.message : e}`);
    }
    throw e;
  } finally {
    await ctx?.client.destroy();
  }
});
