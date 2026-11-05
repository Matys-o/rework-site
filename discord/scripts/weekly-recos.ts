// Publie le trio de la semaine (les 3 recos du site : un film, deux marques) dans 🔺・trio-de-la-semaine.
// Même source que le site : src/data/trios.json, semaine ISO calculée à l'heure de Paris.
//
//   npm run discord:weekly               → publie le trio de la semaine en cours s'il n'est pas déjà parti
//   npm run discord:weekly -- --dry-run  → aperçu sans envoi
//   npm run discord:weekly -- --date=2026-11-16 → trio de la semaine contenant cette date (test)
import { TRIOS } from "../../src/data/trios.ts";
import { connecter, rapport, salon } from "../lib/discord.ts";
import { apercu, messageTrio } from "../lib/embeds.ts";
import { args, lancer } from "../lib/env.ts";
import { ecrireEtat, lireEtat, lireIds, sortieGithub } from "../lib/fichiers.ts";
import { HEURE_PUBLICATION, paris, semaineDe } from "../lib/temps.ts";

lancer(async () => {
  const a = args();
  const etat = lireEtat();
  const ids = lireIds();
  const maintenant = paris();
  const jour = a.date ?? maintenant.date;
  const semaine = semaineDe(jour);

  const trio = TRIOS.find((t) => t.semaine === semaine && t.jour === "lundi");
  if (!trio) {
    const msg = `Aucun trio écrit pour la semaine ${semaine} dans src/data/trios.json.`;
    if (a.dryRun) return console.log(`⚠️ ${msg}`);
    const { client, guild } = await connecter();
    await rapport(guild, ids, `⚠️ **Trio de la semaine** : ${msg} Pense à en ajouter.`);
    await client.destroy();
    return console.log(`⚠️ ${msg}`);
  }

  if (!a.dryRun && !a.now && !a.date && maintenant.heure < HEURE_PUBLICATION) {
    return console.log(`⏳ Il est ${maintenant.heure} h à Paris : le trio part à ${HEURE_PUBLICATION} h.`);
  }

  if (etat.trio[semaine] && !a.force) return console.log(`✔ Trio ${semaine} déjà publié. Rien à faire.`);

  const roles = [ids.roles["notif-annonces"]].filter(Boolean);
  const message = messageTrio(trio, roles);

  if (a.dryRun) {
    console.log(`\nTrio ${semaine} — aperçu (rien n'est envoyé ni enregistré)\n`);
    return console.log(apercu(message));
  }

  const { client, guild } = await connecter();
  try {
    const c = await salon(guild, ids, "trio-de-la-semaine");

    // Pas de doublon même si l'historique s'est perdu : on regarde les derniers messages du bot
    const recents = await c.messages.fetch({ limit: 20 });
    const existant = recents.find(
      (m) => m.author.id === client.user?.id && m.embeds.some((e) => e.footer?.text.includes(`trio ${semaine}`)),
    );
    if (existant && !a.force) {
      etat.trio[semaine] = { date: paris(existant.createdAt).date, message: existant.id };
      ecrireEtat(etat);
      return console.log(`✔ Trio ${semaine} déjà présent dans le salon. Historique mis à jour.`);
    }

    const envoye = await c.send(message);
    etat.trio[semaine] = { date: jour, message: envoye.id };
    ecrireEtat(etat);
    sortieGithub("nom", trio.titre);

    const avertissements: string[] = [];
    if (envoye.crosspostable) await envoye.crosspost().catch((e) => avertissements.push(`abonnés : ${e.message}`));
    await envoye.react("✨").catch(() => {});
    await envoye
      .startThread({ name: "Votre avis sur le trio ? 💬", autoArchiveDuration: 4320 })
      .catch((e) => avertissements.push(`fil : ${e.message}`));

    console.log(`✅ Trio ${semaine} publié : ${trio.titre} → ${envoye.url}`);
    await rapport(
      guild,
      ids,
      `✅ **Trio de la semaine** ${semaine} : ${trio.titre} → ${envoye.url}${avertissements.length ? `\n⚠️ ${avertissements.join(" ; ")}` : ""}`,
    );
  } catch (e) {
    await rapport(guild, ids, `❌ **Trio de la semaine** ${semaine} non publié : ${e instanceof Error ? e.message : e}`);
    throw e;
  } finally {
    await client.destroy();
  }
});
