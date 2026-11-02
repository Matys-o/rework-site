// Construit ou met à jour le serveur REWORK d'après config/ (idempotent : relance-le autant que tu veux).
//
//   npm run discord:setup              → crée ce qui manque, met à jour ce qui a changé, ne supprime rien
//   npm run discord:setup -- --prune   → supprime aussi les salons et rôles qui ne sont pas dans config/server.ts
//
// Chaque rôle / salon est retrouvé par sa clé stable (generated/ids.json), puis par son nom en secours :
// jamais de doublon. Les messages épinglés sont modifiés sur place, pas republiés.
import {
  AutoModerationActionType,
  AutoModerationRuleEventType,
  AutoModerationRuleTriggerType,
  ChannelType,
  GuildDefaultMessageNotifications,
  GuildExplicitContentFilter,
  GuildMFALevel,
  GuildOnboardingMode,
  GuildOnboardingPromptType,
  GuildSystemChannelFlags,
  GuildVerificationLevel,
  OverwriteType,
  PermissionFlagsBits as P,
  PermissionsBitField,
  ThreadChannel,
  type APIEmbed,
  type CategoryChannel,
  type ForumChannel,
  type Guild,
  type GuildBasedChannel,
  type GuildChannelCreateOptions,
  type GuildForumTagData,
  type MediaChannel,
  type Role,
} from "discord.js";
import * as AUTOMOD from "../config/automod.ts";
import { MESSAGES } from "../config/messages.ts";
import {
  CATEGORIES,
  ECRAN_BIENVENUE,
  GEREES_EVERYONE,
  ONBOARDING,
  PARAMETRES,
  PERMS_EVERYONE,
  ROLES,
  type Cible,
  type SalonDef,
  type Surcharge,
  type TypeSalon,
} from "../config/server.ts";
import { connecter, rapport } from "../lib/discord.ts";
import { embedMessage } from "../lib/embeds.ts";
import { args, lancer } from "../lib/env.ts";
import { ecrireIds, lireIds, type Ids } from "../lib/fichiers.ts";

// ─── Récapitulatif ──────────────────────────────────────────────────────────

const recap = { cree: [] as string[], maj: [] as string[], inchange: [] as string[], supprime: [] as string[], manuel: [] as string[], erreurs: [] as string[] };
const note = (k: keyof typeof recap, texte: string) => recap[k].push(texte);

/** Permissions dont le bot a besoin pour tout régler (sans jamais être administrateur) */
const PERMS_BOT = [
  P.ManageRoles, P.ManageChannels, P.ManageGuild, P.ViewAuditLog, P.ViewChannel, P.SendMessages,
  P.SendMessagesInThreads, P.CreatePublicThreads, P.ManageThreads, P.EmbedLinks, P.AttachFiles,
  P.ReadMessageHistory, P.AddReactions, P.ManageMessages, P.PinMessages, P.MentionEveryone,
  P.CreateInstantInvite, P.SendTTSMessages, P.Connect, P.Speak, P.UseVAD, P.Stream, P.ModerateMembers, P.SendPolls,
];

const bits = (l: bigint[] = []) => l.reduce((a, b) => a | b, 0n);
/** Comparaison de noms tolérante (Discord retire parfois le sélecteur de variante des emojis) */
const memeNom = (a: string, b: string) => a.normalize("NFC").replace(/️/g, "") === b.normalize("NFC").replace(/️/g, "");

const TYPES: Record<TypeSalon, ChannelType> = {
  text: ChannelType.GuildText,
  announcement: ChannelType.GuildAnnouncement,
  forum: ChannelType.GuildForum,
  media: ChannelType.GuildMedia,
  voice: ChannelType.GuildVoice,
};

// ─── Contexte ───────────────────────────────────────────────────────────────

let guild: Guild;
let ids: Ids;
let roleBot: Role;

function idCible(c: Cible): string | undefined {
  if (c === "everyone") return guild.roles.everyone.id;
  if (c === "bot") return roleBot.id;
  return ids.roles[c];
}

/** Fusionne des surcharges en une liste par rôle (si un bit est à la fois autorisé et refusé, l'autorisation l'emporte) */
function surcharges(liste: Surcharge[]) {
  const parId = new Map<string, { allow: bigint; deny: bigint }>();
  for (const s of liste) {
    const id = idCible(s.cible);
    if (!id) continue;
    const o = parId.get(id) ?? { allow: 0n, deny: 0n };
    o.allow |= bits(s.allow);
    o.deny |= bits(s.deny);
    parId.set(id, o);
  }
  return [...parId].map(([id, o]) => ({ id, type: OverwriteType.Role, allow: o.allow, deny: o.deny & ~o.allow }));
}

function memesSurcharges(c: GuildBasedChannel, voulues: ReturnType<typeof surcharges>) {
  if (!("permissionOverwrites" in c)) return true;
  const actuelles = c.permissionOverwrites.cache;
  if (actuelles.size !== voulues.length) return false;
  return voulues.every((v) => {
    const a = actuelles.get(v.id);
    return a && a.allow.bitfield === v.allow && a.deny.bitfield === v.deny;
  });
}

// ─── 0. Vérifications ───────────────────────────────────────────────────────

async function verifier() {
  if (!guild.features.includes("COMMUNITY"))
    throw new Error("Le mode Communauté n'est pas activé : Paramètres du serveur → Activer la communauté, puis relance.");
  const moi = await guild.members.fetchMe();
  const role = moi.roles.botRole;
  if (!role) throw new Error("Rôle du bot introuvable : réinvite le bot avec le lien OAuth2.");
  roleBot = role;
  if (moi.permissions.has(P.Administrator))
    note("manuel", "Le bot a la permission Administrateur : retire-la (il n'en a pas besoin).");
  const manquantes = new PermissionsBitField(bits(PERMS_BOT)).remove(moi.permissions).toArray();
  if (manquantes.length)
    throw new Error(`Il manque des permissions au bot : ${manquantes.join(", ")}. Réinvite-le avec le lien OAuth2 du README.`);
}

// ─── 1. Rôles ───────────────────────────────────────────────────────────────

async function roles() {
  await guild.roles.fetch();
  for (const def of ROLES) {
    const voulu = { name: def.name, colors: { primaryColor: def.color ?? 0 }, hoist: !!def.hoist, mentionable: !!def.mentionable, permissions: bits(def.permissions) };
    let role = guild.roles.cache.get(ids.roles[def.key] ?? "") ?? guild.roles.cache.find((r) => memeNom(r.name, def.name) && !r.managed);
    if (!role) {
      role = await guild.roles.create({ ...voulu, reason: "REWORK setup" });
      note("cree", `rôle ${def.name}`);
    } else if (!role.editable) {
      note("inchange", `rôle ${def.name} (au-dessus du bot : géré à la main)`);
    } else {
      const diff =
        !memeNom(role.name, def.name) || role.colors.primaryColor !== voulu.colors.primaryColor || role.hoist !== voulu.hoist ||
        role.mentionable !== voulu.mentionable || role.permissions.bitfield !== voulu.permissions;
      if (diff) {
        await role.edit({ ...voulu, reason: "REWORK setup" });
        note("maj", `rôle ${def.name}`);
      } else note("inchange", `rôle ${def.name}`);
    }
    ids.roles[def.key] = role.id;
  }

  // Ordre : tous les rôles gérables, dans l'ordre de la config, juste sous le rôle du bot
  const gerables = ROLES.map((d) => guild.roles.cache.get(ids.roles[d.key])!).filter((r) => r.editable);
  const dansLOrdre = gerables.every((r, i) => i === 0 || gerables[i - 1].position > r.position);
  if (!dansLOrdre) {
    const haut = roleBot.position - 1;
    await guild.roles.setPositions(gerables.map((r, i) => ({ role: r.id, position: Math.max(1, haut - i) })));
    note("maj", "ordre des rôles");
  }
  for (const k of ["fondateur", "moderation"] as const) {
    const r = guild.roles.cache.get(ids.roles[k])!;
    if (r.position < roleBot.position)
      note("manuel", `Glisse le rôle ${r.name} AU-DESSUS du rôle « ${roleBot.name} » (Paramètres → Rôles).`);
  }

  // @everyone : voir et lire seulement (on ne touche qu'aux permissions gérées)
  const everyone = guild.roles.everyone;
  const voulu = (everyone.permissions.bitfield & ~bits(GEREES_EVERYONE)) | bits(PERMS_EVERYONE);
  if (everyone.permissions.bitfield !== voulu) {
    await everyone.setPermissions(voulu, "REWORK setup");
    note("maj", "permissions de @everyone");
  } else note("inchange", "permissions de @everyone");

  // 👑 Fondateur pour le propriétaire
  const fondateur = guild.roles.cache.get(ids.roles.fondateur)!;
  const proprio = await guild.fetchOwner();
  if (!proprio.roles.cache.has(fondateur.id)) {
    if (fondateur.editable) {
      await proprio.roles.add(fondateur, "REWORK setup : fondateur");
      note("maj", `rôle 👑 Fondateur donné à ${proprio.user.username}`);
    } else note("manuel", "Donne-toi le rôle 👑 Fondateur.");
  }
  if (!fondateur.permissions.has(P.Administrator))
    note("manuel", "Coche « Administrateur » sur 👑 Fondateur si tu le souhaites (un bot ne peut pas l'accorder).");
}

// ─── 2. Catégories et salons ────────────────────────────────────────────────

async function categorie(def: (typeof CATEGORIES)[number], position: number) {
  const voulues = surcharges(def.overwrites);
  let cat = guild.channels.cache.get(ids.categories[def.key] ?? "") as CategoryChannel | undefined;
  cat ??= guild.channels.cache.find((c) => c.type === ChannelType.GuildCategory && memeNom(c.name, def.name)) as CategoryChannel | undefined;
  if (!cat) {
    cat = await guild.channels.create({ name: def.name, type: ChannelType.GuildCategory, permissionOverwrites: voulues, position, reason: "REWORK setup" });
    note("cree", `catégorie ${def.name}`);
  } else if (!memeNom(cat.name, def.name) || !memesSurcharges(cat, voulues)) {
    await cat.edit({ name: def.name, permissionOverwrites: voulues, reason: "REWORK setup" });
    note("maj", `catégorie ${def.name}`);
  } else note("inchange", `catégorie ${def.name}`);
  ids.categories[def.key] = cat.id;
  return cat;
}

function tagsVoulus(def: SalonDef, existants: { id: string; name: string }[] = []): GuildForumTagData[] {
  return (def.tags ?? []).map((t) => ({
    id: existants.find((e) => e.name === t.name)?.id, // garde l'ID : les posts gardent leur tag
    name: t.name,
    moderated: !!t.staff,
    emoji: t.emoji ? { id: null, name: t.emoji } : null,
  }));
}

async function salon(def: SalonDef, cat: CategoryChannel, overwritesCat: Surcharge[]) {
  const type = TYPES[def.type];
  const voulues = surcharges([...overwritesCat, ...(def.overwrites ?? [])]);
  let c = guild.channels.cache.get(ids.channels[def.key] ?? "");
  c ??= guild.channels.cache.find((x) => memeNom(x.name, def.name) && (x.type === type || (def.type === "announcement" && x.type === ChannelType.GuildText)));

  if (!c) {
    const opts: GuildChannelCreateOptions = {
      name: def.name,
      type: type as GuildChannelCreateOptions["type"],
      parent: cat.id,
      permissionOverwrites: voulues,
      reason: "REWORK setup",
    };
    if (def.type !== "voice") Object.assign(opts, { topic: def.topic, rateLimitPerUser: def.slowmode ?? 0 });
    if (def.tags) opts.availableTags = tagsVoulus(def);
    if (def.defaultReaction) opts.defaultReactionEmoji = { id: null, name: def.defaultReaction };
    c = await guild.channels.create(opts);
    note("cree", `salon ${def.name}`);
    ids.channels[def.key] = c.id;
    return c;
  }

  // Texte → annonces : Discord permet la conversion directe
  if (c.type === ChannelType.GuildText && type === ChannelType.GuildAnnouncement) {
    c = await c.edit({ type: ChannelType.GuildAnnouncement, reason: "REWORK setup" });
    note("maj", `salon ${def.name} converti en salon d'annonces`);
  } else if (c.type !== type) {
    note("erreurs", `salon ${def.name} : il existe avec un autre type, supprime-le à la main ou change sa clé`);
    ids.channels[def.key] = c.id;
    return c;
  }

  const modifs: Record<string, unknown> = {};
  if (!memeNom(c.name, def.name)) modifs.name = def.name;
  if (c.parentId !== cat.id) modifs.parent = cat.id;
  if (!memesSurcharges(c, voulues)) modifs.permissionOverwrites = voulues;
  if (def.type !== "voice" && "topic" in c && (c.topic ?? "") !== (def.topic ?? "")) modifs.topic = def.topic ?? null;
  if (def.type !== "voice" && "rateLimitPerUser" in c && (c.rateLimitPerUser ?? 0) !== (def.slowmode ?? 0)) modifs.rateLimitPerUser = def.slowmode ?? 0;
  if (def.tags && "availableTags" in c) {
    const f = c as ForumChannel | MediaChannel;
    const sig = (l: { name: string; moderated?: boolean; emoji?: { name: string | null } | null }[]) =>
      JSON.stringify(l.map((t) => [t.name, !!t.moderated, t.emoji?.name ?? null]));
    const voulus = tagsVoulus(def, f.availableTags);
    if (sig(f.availableTags) !== sig(voulus)) modifs.availableTags = voulus;
  }
  if (def.defaultReaction && "defaultReactionEmoji" in c && (c as ForumChannel).defaultReactionEmoji?.name !== def.defaultReaction)
    modifs.defaultReactionEmoji = { id: null, name: def.defaultReaction };

  if (Object.keys(modifs).length) {
    c = await (c as CategoryChannel).edit({ ...modifs, reason: "REWORK setup" } as never) as unknown as GuildBasedChannel;
    note("maj", `salon ${def.name} (${Object.keys(modifs).join(", ")})`);
  } else note("inchange", `salon ${def.name}`);
  ids.channels[def.key] = c.id;
  return c;
}

async function salons() {
  await guild.channels.fetch();
  const positions: { channel: string; position: number }[] = [];
  for (const [i, defCat] of CATEGORIES.entries()) {
    const cat = await categorie(defCat, i);
    positions.push({ channel: cat.id, position: i });
    for (const [j, def] of defCat.channels.entries()) {
      const c = await salon(def, cat, defCat.overwrites);
      positions.push({ channel: c.id, position: j });
    }
  }
  // Ordre des catégories et des salons dans chaque catégorie
  await guild.channels.fetch();
  const rang = (id: string) => (guild.channels.cache.get(id) as { rawPosition?: number } | undefined)?.rawPosition ?? 0;
  const cats = CATEGORIES.map((c) => ids.categories[c.key]);
  let enOrdre = cats.every((id, i) => i === 0 || rang(cats[i - 1]) < rang(id));
  for (const defCat of CATEGORIES) {
    const enfants = defCat.channels.map((c) => ids.channels[c.key]);
    const parType = (voice: boolean) => enfants.filter((id) => (guild.channels.cache.get(id)?.type === ChannelType.GuildVoice) === voice);
    for (const groupe of [parType(false), parType(true)])
      enOrdre &&= groupe.every((id, i) => i === 0 || rang(groupe[i - 1]) < rang(id));
  }
  if (!enOrdre) {
    await guild.channels.setPositions(positions);
    note("maj", "ordre des catégories et des salons");
  }
}

// ─── 3. Messages épinglés ───────────────────────────────────────────────────

const memeEmbed = (a: APIEmbed | undefined, b: APIEmbed) =>
  !!a &&
  a.title === b.title &&
  (a.description ?? "") === (b.description ?? "") &&
  a.color === b.color &&
  (a.footer?.text ?? "") === (b.footer?.text ?? "") &&
  JSON.stringify((a.fields ?? []).map((f) => [f.name, f.value])) === JSON.stringify((b.fields ?? []).map((f) => [f.name, f.value]));

async function epingleTexte(cle: string, salonId: string) {
  const c = guild.channels.cache.get(salonId);
  if (!c?.isTextBased() || !("messages" in c)) return;
  const embed = embedMessage(MESSAGES[cle], ids);
  const connu = ids.messages[cle];
  let msg = connu ? await c.messages.fetch(connu.message).catch(() => null) : null;
  // Secours si ids.json a été perdu : un message épinglé du bot avec le même titre
  if (!msg) {
    const epingles = await c.messages.fetchPins().catch(() => null);
    msg = epingles?.items.map((p) => p.message).find((m) => m.author.id === guild.client.user.id && m.embeds[0]?.title === embed.title) ?? null;
  }
  if (!msg) {
    msg = await c.send({ embeds: [embed], allowedMentions: { parse: [] } });
    await msg.pin("REWORK setup");
    note("cree", `message épinglé « ${MESSAGES[cle].title} »`);
  } else {
    if (!memeEmbed(msg.embeds[0]?.toJSON(), embed)) {
      await msg.edit({ embeds: [embed], allowedMentions: { parse: [] } });
      note("maj", `message épinglé « ${MESSAGES[cle].title} »`);
    } else note("inchange", `message épinglé « ${MESSAGES[cle].title} »`);
    if (!msg.pinned) await msg.pin("REWORK setup");
  }
  ids.messages[cle] = { channel: c.id, message: msg.id };
}

async function epingleForum(cle: string, forumId: string) {
  const forum = guild.channels.cache.get(forumId) as ForumChannel | undefined;
  if (!forum) return;
  const def = MESSAGES[cle];
  const titre = def.postTitle ?? def.title;
  const embed = embedMessage(def, ids);
  const connu = ids.messages[cle];
  let fil: ThreadChannel | null = connu ? ((await guild.channels.fetch(connu.channel).catch(() => null)) as ThreadChannel | null) : null;
  if (!fil) {
    const actifs = await forum.threads.fetchActive();
    const archives = await forum.threads.fetchArchived();
    fil = [...actifs.threads.values(), ...archives.threads.values()].find((t) => t.ownerId === guild.client.user.id && memeNom(t.name, titre)) ?? null;
  }
  if (!fil) {
    fil = await forum.threads.create({ name: titre, message: { embeds: [embed], allowedMentions: { parse: [] } }, reason: "REWORK setup" });
    note("cree", `post épinglé « ${titre} » dans ${forum.name}`);
  } else {
    if (fil.archived) await fil.setArchived(false);
    const depart = await fil.fetchStarterMessage().catch(() => null);
    if (!memeNom(fil.name, titre)) await fil.setName(titre);
    if (depart && !memeEmbed(depart.embeds[0]?.toJSON(), embed)) {
      await depart.edit({ embeds: [embed], allowedMentions: { parse: [] } });
      note("maj", `post épinglé « ${titre} » dans ${forum.name}`);
    } else note("inchange", `post épinglé « ${titre} » dans ${forum.name}`);
  }
  if (!fil.flags.has("Pinned")) await fil.pin("REWORK setup");
  if (!fil.locked) await fil.setLocked(true, "Mode d'emploi : lecture seule");
  ids.messages[cle] = { channel: fil.id, message: fil.id };
}

async function epingles() {
  for (const defCat of CATEGORIES)
    for (const def of defCat.channels)
      for (const cle of def.pinned ?? []) {
        if (!MESSAGES[cle]) {
          note("erreurs", `message « ${cle} » absent de config/messages.ts`);
          continue;
        }
        try {
          if (def.type === "forum") await epingleForum(cle, ids.channels[def.key]);
          else await epingleTexte(cle, ids.channels[def.key]);
        } catch (e) {
          note("erreurs", `message « ${cle} » : ${e instanceof Error ? e.message : e}`);
        }
      }
}

// ─── 4. Paramètres du serveur ───────────────────────────────────────────────

async function parametres() {
  const flags = GuildSystemChannelFlags.SuppressGuildReminderNotifications; // arrivées + autocollants de bienvenue gardés
  const voulu = {
    verificationLevel: GuildVerificationLevel.Medium,
    explicitContentFilter: GuildExplicitContentFilter.AllMembers,
    defaultMessageNotifications: GuildDefaultMessageNotifications.OnlyMentions,
    rulesChannel: ids.channels[PARAMETRES.rulesChannel],
    publicUpdatesChannel: ids.channels[PARAMETRES.publicUpdatesChannel],
    systemChannel: ids.channels[PARAMETRES.systemChannel],
    systemChannelFlags: flags,
  };
  const diff =
    guild.verificationLevel !== voulu.verificationLevel ||
    guild.explicitContentFilter !== voulu.explicitContentFilter ||
    guild.defaultMessageNotifications !== voulu.defaultMessageNotifications ||
    guild.rulesChannelId !== voulu.rulesChannel ||
    guild.publicUpdatesChannelId !== voulu.publicUpdatesChannel ||
    guild.systemChannelId !== voulu.systemChannel ||
    guild.systemChannelFlags.bitfield !== flags;
  if (diff) {
    // Le salon des mises à jour Communauté est refusé aux bots (50013) : on le tente à part.
    const { publicUpdatesChannel, ...reste } = voulu;
    await guild.edit({ ...reste, reason: "REWORK setup" });
    note("maj", "paramètres du serveur (vérification, filtre, notifications, salons système)");
    if (guild.publicUpdatesChannelId !== publicUpdatesChannel) {
      try {
        await guild.edit({ publicUpdatesChannel, reason: "REWORK setup" });
      } catch {
        note("manuel", "Paramètres → Communauté → Vue d'ensemble : choisis 🛡️・modération comme salon des mises à jour.");
      }
    }
  } else note("inchange", "paramètres du serveur");
  if (guild.mfaLevel !== GuildMFALevel.Elevated)
    note("manuel", "2FA obligatoire pour la modération : Paramètres → Sécurité (réservé au propriétaire, impossible par API).");
}

// ─── 5. AutoMod ─────────────────────────────────────────────────────────────

async function automod() {
  const alerte = ids.channels[PARAMETRES.alertChannel];
  const exemptes = [ids.roles.fondateur, ids.roles.moderation];
  const actions = (bloquer = true) => [
    ...(bloquer ? [{ type: AutoModerationActionType.BlockMessage, metadata: { customMessage: AUTOMOD.MESSAGE_BLOQUE } }] : []),
    { type: AutoModerationActionType.SendAlertMessage, metadata: { channel: alerte } },
  ];
  const regles = [
    { key: "invitations", name: "REWORK · invitations Discord", triggerType: AutoModerationRuleTriggerType.Keyword, triggerMetadata: { regexPatterns: AUTOMOD.REGEX_INVITATIONS } },
    { key: "mentions", name: "REWORK · spam de mentions", triggerType: AutoModerationRuleTriggerType.MentionSpam, triggerMetadata: { mentionTotalLimit: AUTOMOD.MENTIONS_MAX, mentionRaidProtectionEnabled: true } },
    { key: "spam", name: "REWORK · spam détecté", triggerType: AutoModerationRuleTriggerType.Spam, triggerMetadata: {} },
    { key: "mots", name: "REWORK · mots haineux", triggerType: AutoModerationRuleTriggerType.Keyword, triggerMetadata: { keywordFilter: AUTOMOD.MOTS_INTERDITS, allowList: AUTOMOD.MOTS_AUTORISES } },
  ];
  const existantes = await guild.autoModerationRules.fetch();
  for (const r of regles) {
    const donnees = { name: r.name, eventType: AutoModerationRuleEventType.MessageSend, triggerType: r.triggerType, triggerMetadata: r.triggerMetadata, actions: actions(), enabled: true, exemptRoles: exemptes };
    const regle = existantes.get(ids.automod[r.key] ?? "") ?? existantes.find((x) => x.name === r.name || (r.triggerType !== AutoModerationRuleTriggerType.Keyword && x.triggerType === r.triggerType));
    try {
      if (!regle) {
        const cree = await guild.autoModerationRules.create({ ...donnees, reason: "REWORK setup" });
        ids.automod[r.key] = cree.id;
        note("cree", `AutoMod ${r.name}`);
        continue;
      }
      ids.automod[r.key] = regle.id;
      const m = regle.triggerMetadata;
      const sig = (x: unknown) => JSON.stringify(x);
      const diff =
        regle.name !== r.name || !regle.enabled ||
        sig([...regle.exemptRoles.keys()].sort()) !== sig([...exemptes].sort()) ||
        sig(regle.actions.map((a) => [a.type, a.metadata.customMessage ?? null, a.metadata.channelId ?? null])) !==
          sig(donnees.actions.map((a) => [a.type, "customMessage" in a.metadata ? a.metadata.customMessage : null, "channel" in a.metadata ? a.metadata.channel : null])) ||
        ("keywordFilter" in r.triggerMetadata && sig(m.keywordFilter) !== sig(r.triggerMetadata.keywordFilter)) ||
        ("allowList" in r.triggerMetadata && sig(m.allowList) !== sig(r.triggerMetadata.allowList)) ||
        ("regexPatterns" in r.triggerMetadata && sig(m.regexPatterns) !== sig(r.triggerMetadata.regexPatterns)) ||
        ("mentionTotalLimit" in r.triggerMetadata && m.mentionTotalLimit !== r.triggerMetadata.mentionTotalLimit);
      if (diff) {
        await regle.edit({ ...donnees, reason: "REWORK setup" });
        note("maj", `AutoMod ${r.name}`);
      } else note("inchange", `AutoMod ${r.name}`);
    } catch (e) {
      // Règle créée par Discord (ex. « Block Mention Spam ») : le bot ne peut pas la modifier, et un seul exemplaire est permis.
      if (regle && regle.creatorId !== guild.client.user.id)
        note("manuel", `AutoMod : la règle « ${regle.name} » vient de Discord. Ajuste-la à la main (Paramètres → AutoMod), ou supprime-la puis relance le setup.`);
      else note("erreurs", `AutoMod ${r.name} : ${e instanceof Error ? e.message : e}`);
    }
  }
}

// ─── 6. Écran de bienvenue ──────────────────────────────────────────────────

async function ecranBienvenue() {
  const voulu = ECRAN_BIENVENUE.channels.map((c) => ({ channel: ids.channels[c.channel], description: c.description, emoji: c.emoji }));
  const actuel = await guild.fetchWelcomeScreen().catch(() => null);
  const sig = (l: { channel: string; description: string; emoji: string | null }[]) => JSON.stringify(l);
  const identique =
    actuel?.enabled &&
    actuel.description === ECRAN_BIENVENUE.description &&
    sig([...actuel.welcomeChannels.values()].map((w) => ({ channel: w.channelId, description: w.description, emoji: w.emoji.name }))) === sig(voulu);
  if (identique) return note("inchange", "écran de bienvenue");
  await guild.editWelcomeScreen({ enabled: true, description: ECRAN_BIENVENUE.description, welcomeChannels: voulu });
  note(actuel ? "maj" : "cree", "écran de bienvenue");
}

// ─── 7. Onboarding ──────────────────────────────────────────────────────────

async function onboarding() {
  const actuel = await guild.fetchOnboarding();
  const prompts = ONBOARDING.prompts.map((q) => {
    const existant = actuel.prompts.find((p) => p.title === q.title);
    return {
      id: existant?.id,
      title: q.title,
      singleSelect: q.singleSelect,
      required: q.required,
      inOnboarding: true,
      type: GuildOnboardingPromptType.MultipleChoice,
      options: q.options.map((o) => ({
        id: existant?.options.find((x) => x.title === o.title)?.id,
        title: o.title,
        description: o.description ?? null,
        emoji: o.emoji ?? null,
        roles: (o.roles ?? []).map((k) => ids.roles[k]),
        channels: (o.channels ?? []).map((k) => ids.channels[k]),
      })),
    };
  });
  const defaut = ONBOARDING.defaultChannels.map((k) => ids.channels[k]);

  const sig = JSON.stringify;
  const signatureActuelle = sig({
    d: [...actuel.defaultChannels.keys()].sort(),
    p: actuel.prompts.map((p) => [p.title, p.singleSelect, p.required, p.options.map((o) => [o.title, o.description, [...o.roles.keys()].sort(), [...o.channels.keys()].sort()])]),
  });
  const signatureVoulue = sig({
    d: [...defaut].sort(),
    p: prompts.map((p) => [p.title, p.singleSelect, p.required, p.options.map((o) => [o.title, o.description, [...o.roles].sort(), [...o.channels].sort()])]),
  });
  if (signatureActuelle === signatureVoulue && actuel.enabled) return note("inchange", "onboarding");

  const donnees = { prompts, defaultChannels: defaut, mode: GuildOnboardingMode.OnboardingDefault, reason: "REWORK setup" };
  try {
    await guild.editOnboarding({ ...donnees, enabled: true });
    note(actuel.prompts.size ? "maj" : "cree", "onboarding (3 questions, activé)");
  } catch (e) {
    // Discord impose des contraintes pour l'activer (ex. un minimum de salons par défaut où @everyone peut écrire) :
    // on enregistre quand même les questions, désactivées, et on explique.
    await guild.editOnboarding({ ...donnees, enabled: false });
    note("maj", "onboarding (questions enregistrées, mais désactivé)");
    note("manuel", `Onboarding non activé, Discord refuse : ${e instanceof Error ? e.message : e}`);
  }
}

// ─── 8. Nettoyage (--prune) ─────────────────────────────────────────────────

async function nettoyer() {
  const salonsConnus = new Set([...Object.values(ids.channels), ...Object.values(ids.categories)]);
  for (const c of guild.channels.cache.values()) {
    if (salonsConnus.has(c.id) || c.isThread()) continue;
    try {
      await c.delete("REWORK setup --prune");
      note("supprime", `salon ${c.name}`);
    } catch (e) {
      note("erreurs", `suppression de ${c.name} : ${e instanceof Error ? e.message : e}`);
    }
  }
  const rolesConnus = new Set(Object.values(ids.roles));
  for (const r of guild.roles.cache.values()) {
    if (rolesConnus.has(r.id) || r.managed || r.id === guild.id || !r.editable) continue;
    await r.delete("REWORK setup --prune");
    note("supprime", `rôle ${r.name}`);
  }
}

// ─── Lancement ──────────────────────────────────────────────────────────────

lancer(async () => {
  const a = args();
  ids = lireIds();
  const ctx = await connecter();
  guild = ctx.guild;
  try {
    console.log(`Serveur : ${guild.name}\n`);
    await verifier();
    const etapes: [string, () => Promise<unknown>][] = [
      ["rôles", roles],
      ["salons", salons],
      ["messages épinglés", epingles],
      ["paramètres", parametres],
      ["AutoMod", automod],
      ["écran de bienvenue", ecranBienvenue],
      ["onboarding", onboarding],
    ];
    if (a.prune) etapes.push(["nettoyage", nettoyer]);
    for (const [nom, f] of etapes) {
      process.stdout.write(`→ ${nom}… `);
      try {
        await f();
        console.log("ok");
      } catch (e) {
        console.log("erreur");
        note("erreurs", `${nom} : ${e instanceof Error ? e.message : e}`);
        if (nom === "rôles" || nom === "salons") throw e; // la suite dépend de ces étapes
      } finally {
        ecrireIds(ids); // sauvegardé à chaque étape : une relance reprend sans doublon
      }
    }
  } finally {
    const titre = (t: string, l: string[]) => (l.length ? `\n${t} (${l.length})\n${l.map((x) => `  • ${x}`).join("\n")}` : "");
    console.log(
      [
        "\n════════ Récapitulatif ════════",
        titre("✚ Créé", recap.cree),
        titre("✎ Mis à jour", recap.maj),
        `\n＝ Laissé tel quel : ${recap.inchange.length} élément(s)`,
        titre("✖ Supprimé", recap.supprime),
        titre("✋ À faire à la main", recap.manuel),
        titre("⚠ Erreurs", recap.erreurs),
      ].join(""),
    );
    if (roleBot)
      await rapport(
        guild,
        ids,
        `🛠️ **Setup** : ${recap.cree.length} créé(s), ${recap.maj.length} mis à jour, ${recap.inchange.length} inchangé(s), ${recap.supprime.length} supprimé(s)${recap.erreurs.length ? `, ⚠️ ${recap.erreurs.length} erreur(s)` : ""}.`,
      );
    await ctx.client.destroy();
    if (recap.erreurs.length) process.exitCode = 1;
  }
});
