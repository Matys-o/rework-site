// Connexion ponctuelle au serveur (pas de bot allumé en permanence : on se connecte, on agit, on se déconnecte).
import { Client, GatewayIntentBits, type Guild, type MessageCreateOptions } from "discord.js";
import { exiger } from "./env.ts";
import type { Ids } from "./fichiers.ts";

export async function connecter(): Promise<{ client: Client; guild: Guild }> {
  const token = exiger("DISCORD_TOKEN");
  const guildId = exiger("DISCORD_GUILD_ID");
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  const delai = setTimeout(() => {
    console.error("\n✖ Connexion à Discord impossible après 30 s (réseau ou token ?).");
    process.exit(1);
  }, 30_000);
  try {
    await client.login(token);
    const guild = await client.guilds.fetch({ guild: guildId, force: true }).catch((e) => {
      if (e?.code === 10004 || e?.code === 50001)
        throw new Error(
          `Le bot n'a pas accès au serveur ${guildId}. Vérifie DISCORD_GUILD_ID (clic droit sur le serveur → Copier l'identifiant) ` +
            `et invite le bot avec le lien OAuth2 du README.`,
        );
      throw e;
    });
    return { client, guild };
  } catch (e) {
    await client.destroy();
    throw e;
  } finally {
    clearTimeout(delai);
  }
}

/** Salon texte/annonces par clé de config, ou erreur claire */
export async function salon(guild: Guild, ids: Ids, cle: string) {
  const id = ids.channels[cle];
  const c = id ? await guild.channels.fetch(id).catch(() => null) : null;
  if (!c || !c.isTextBased() || !("send" in c))
    throw new Error(`Salon « ${cle} » introuvable : lance d'abord npm run discord:setup.`);
  return c;
}

/** Rapport dans 🤖・bot (n'échoue jamais : un rapport raté ne doit pas masquer l'erreur d'origine) */
export async function rapport(guild: Guild, ids: Ids, texte: string) {
  try {
    const c = await salon(guild, ids, "bot");
    const msg: MessageCreateOptions = { content: texte.slice(0, 1900), allowedMentions: { parse: [] } };
    await c.send(msg);
  } catch (e) {
    console.error(`(rapport dans 🤖・bot impossible : ${e instanceof Error ? e.message : e})`);
  }
}
