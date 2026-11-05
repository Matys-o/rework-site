// Mise en forme des messages (embeds aux couleurs du site : barre lime ou couleur d'univers).
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type APIEmbed,
  type MessageCreateOptions,
} from "discord.js";
import { COULEURS, EMOJI_DOMAINE, SITE } from "../config/server.ts";
import type { MessageDef } from "../config/messages.ts";
import type { Trio } from "../../src/data/trios.ts";
import { DOMAINES, imageHttps, urlFiche, type Marque, type Pool } from "./brands.ts";
import type { Ids } from "./fichiers.ts";
import { dateLongue } from "./temps.ts";

/** Coupe proprement à `max` caractères, sur un espace, avec « … » */
export function couper(texte: string, max: number) {
  if (texte.length <= max) return texte;
  const coupe = texte.slice(0, max - 1);
  const espace = coupe.lastIndexOf(" ");
  return `${(espace > max * 0.6 ? coupe.slice(0, espace) : coupe).replace(/[\s,;:.]+$/, "")}…`;
}

/** {#clé} → mention de salon, {@&clé} → mention de rôle (d'après generated/ids.json) */
export function resoudre(texte: string, ids: Ids) {
  return texte
    .replace(/\{#([\w-]+)\}/g, (_, k) => (ids.channels[k] ? `<#${ids.channels[k]}>` : `#${k}`))
    .replace(/\{@&([\w-]+)\}/g, (_, k) => (ids.roles[k] ? `<@&${ids.roles[k]}>` : `@${k}`));
}

/** Embed d'un message épinglé */
export function embedMessage(def: MessageDef, ids: Ids): APIEmbed {
  const e = new EmbedBuilder()
    .setColor(COULEURS.lime)
    .setTitle(def.title)
    .setDescription(resoudre(def.description, ids));
  if (def.fields) e.addFields(def.fields.map((f) => ({ name: f.name, value: resoudre(f.value, ids) })));
  if (def.footer) e.setFooter({ text: def.footer });
  return e.toJSON();
}

const NOM_FIL = { marque: "marque", film: "film" } as const;
const MEDIUM = { marque: "marque-du-jour", film: "film-du-jour" } as const;

/** Message « marque du jour » / « film du jour » */
export function messageEntree(
  m: Marque,
  o: { pool: Pool; numero: number; date: string; rolesMentionnes: string[] },
): MessageCreateOptions {
  const url = urlFiche(m, MEDIUM[o.pool]);
  const domaine = DOMAINES[m.domaine];
  const e = new EmbedBuilder()
    .setColor(COULEURS.domaine[m.domaine])
    .setTitle(o.pool === "film" ? `🎬 Film du jour — ${m.nom}` : `🏷️ Marque du jour — ${m.nom}`)
    .setURL(url)
    .setDescription(couper(m.description, 300))
    .setFooter({ text: `REWORK · ${NOM_FIL[o.pool]} n°${o.numero} · ${dateLongue(o.date)}` });

  const champs =
    o.pool === "film"
      ? [
          m.realisation && { name: "Réalisation", value: m.realisation, inline: true },
          m.annee && { name: "Année", value: String(m.annee), inline: true },
          m.origine && { name: "Pays", value: m.origine, inline: true },
          m.rang && { name: "Classement", value: `N°${m.rang} du top Letterboxd`, inline: true },
        ]
      : [
          { name: "Univers", value: `${EMOJI_DOMAINE[m.domaine]} ${domaine.nom}`, inline: true },
          m.origine && { name: "Origine", value: m.origine, inline: true },
          m.annee && { name: "Depuis", value: String(m.annee), inline: true },
          m.etiquette && { name: "En un mot", value: m.etiquette, inline: true },
        ];
  e.addFields(champs.filter((c): c is { name: string; value: string; inline: boolean } => !!c));

  const image = imageHttps(m);
  if (image) e.setImage(image);

  const bouton = new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(url).setLabel("Voir la fiche sur REWORK ↗");

  return {
    content: o.rolesMentionnes.map((id) => `<@&${id}>`).join(" ") || undefined,
    embeds: [e.toJSON()],
    components: [new ActionRowBuilder<ButtonBuilder>().addComponents(bouton).toJSON()],
    // Seuls les rôles listés peuvent être notifiés : jamais @everyone ni @here, même par accident.
    allowedMentions: { parse: [], roles: o.rolesMentionnes },
  };
}

/** Message « trio de la semaine » : un embed par entrée, dans un seul message */
export function messageTrio(t: Trio, rolesMentionnes: string[]): MessageCreateOptions {
  const url = `${SITE}/trios/${t.id}?utm_source=discord&utm_medium=trio-de-la-semaine`;
  const embeds = t.items.map((m, i) => {
    const e = new EmbedBuilder()
      .setColor(COULEURS.domaine[m.domaine])
      .setAuthor({ name: `${i + 1}/3 · ${EMOJI_DOMAINE[m.domaine]} ${DOMAINES[m.domaine].nom}` })
      .setTitle(m.nom)
      .setURL(urlFiche(m, "trio-de-la-semaine"))
      .setDescription(couper(i === 0 ? t.intro : t.liens[i - 1], 400));
    const img = imageHttps(m);
    if (img) e.setThumbnail(img);
    if (i === 2) e.setFooter({ text: `REWORK · trio ${t.semaine} · semaine ${t.numero}` });
    return e.toJSON();
  });
  const bouton = new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(url).setLabel("Voir le trio sur REWORK ↗");
  return {
    content: [`## ✨ Le trio de la semaine · ${t.titre}`, rolesMentionnes.map((id) => `<@&${id}>`).join(" ")]
      .filter(Boolean)
      .join("\n"),
    embeds,
    components: [new ActionRowBuilder<ButtonBuilder>().addComponents(bouton).toJSON()],
    allowedMentions: { parse: [], roles: rolesMentionnes },
  };
}

/** Rendu texte d'un message pour --dry-run */
export function apercu(msg: MessageCreateOptions): string {
  const l: string[] = [];
  if (msg.content) l.push(`[texte] ${msg.content}`);
  for (const brut of (msg.embeds ?? []) as APIEmbed[]) {
    l.push("┌──────────────────────────────────────────────");
    if (brut.color !== undefined) l.push(`│ couleur : #${brut.color.toString(16).padStart(6, "0")}`);
    if (brut.author) l.push(`│ ${brut.author.name}`);
    if (brut.title) l.push(`│ **${brut.title}**${brut.url ? `  → ${brut.url}` : ""}`);
    if (brut.description) l.push(...brut.description.split("\n").map((x) => `│ ${x}`));
    for (const f of brut.fields ?? []) l.push(`│ ▸ ${f.name} : ${f.value.replace(/\n/g, " / ")}`);
    if (brut.image) l.push(`│ [image] ${brut.image.url}`);
    if (brut.thumbnail) l.push(`│ [vignette] ${brut.thumbnail.url}`);
    if (brut.footer) l.push(`│ — ${brut.footer.text}`);
    l.push("└──────────────────────────────────────────────");
  }
  for (const row of (msg.components ?? []) as unknown as { components: { label?: string; url?: string }[] }[])
    for (const c of row.components) l.push(`[bouton] ${c.label} → ${c.url}`);
  l.push(`[mentions autorisées] rôles : ${(msg.allowedMentions?.roles ?? []).join(", ") || "aucun"} · @everyone : jamais`);
  return l.join("\n");
}
