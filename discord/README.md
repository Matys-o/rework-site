# Serveur Discord REWORK

Tout le serveur est décrit dans `config/` et construit par des scripts : aucun salon n'est créé à la main.
Il n'y a pas de bot allumé en permanence. Les scripts se connectent, agissent, puis se déconnectent, en local ou via GitHub Actions.

| Commande (à la racine du dépôt) | Effet |
|---|---|
| `npm run discord:install` | installe les dépendances de `discord/` |
| `npm run discord:setup` | construit ou met à jour le serveur (idempotent) |
| `npm run discord:setup -- --prune` | supprime aussi ce qui n'est pas dans la config |
| `npm run discord:daily -- --dry-run` | aperçu de la marque du jour, sans envoi |
| `npm run discord:daily -- --pool=film --dry-run` | aperçu du film du jour |
| `npm run discord:daily -- --now` | publie tout de suite (sans attendre 9 h) |
| `npm run discord:weekly -- --dry-run` | aperçu du trio de la semaine |

## Fichiers

- `config/server.ts` : rôles, catégories, salons, permissions, écran de bienvenue, onboarding. **C'est la source de vérité.**
- `config/messages.ts` : textes épinglés.
- `config/automod.ts` : mots bloqués et message affiché.
- `lib/brands.ts` : lit `src/data/brands.ts`, c'est-à-dire exactement les données du site (Supabase n'est plus utilisé).
- `state/posted.json` : historique des publications, commité par les Actions.
- `generated/ids.json` : IDs des salons et des rôles créés. Il ne contient aucun secret et il est commité.
- `.env` : `DISCORD_TOKEN` et `DISCORD_GUILD_ID`. Ce fichier est **ignoré par git** et ne doit jamais être commité ni affiché.

## Ajouter un salon plus tard

1. Dans `config/server.ts`, ajoute une entrée dans la bonne catégorie avec une **clé unique**. Exemple :
   `{ key: "evenements", name: "📅・événements", type: "text", topic: "Les rendez-vous de la communauté." }`
2. Lance `npm run discord:setup`. Le salon est créé à la bonne place, avec les permissions de sa catégorie.
3. Commite `config/server.ts` et `generated/ids.json`.

Pour renommer un salon, change son `name` et garde sa `key`.

## Lien d'invitation du bot

```
https://discord.com/oauth2/authorize?client_id=APP_ID&scope=bot+applications.commands&permissions=2816176001646321
```

Le bot n'est jamais administrateur. Il reçoit seulement les permissions qu'il doit pouvoir régler sur les rôles et les salons, parce que Discord interdit à un bot d'accorder ou de refuser une permission qu'il n'a pas.

## Secrets GitHub, pas à pas

1. Sur GitHub, ouvre le dépôt `Matys-o/rework-site`, puis **Settings**.
2. Dans le menu de gauche, va dans **Secrets and variables** puis **Actions**.
3. Clique sur **New repository secret** :
   - Name `DISCORD_TOKEN`, Secret = le token du bot, puis **Add secret** ;
   - recommence avec `DISCORD_GUILD_ID` = l'ID du serveur.
4. Pour un test manuel, va dans l'onglet **Actions**, choisis « Discord — du jour », puis **Run workflow**.

## Heure de publication

GitHub ne connaît que l'heure UTC. Les workflows tournent donc à 07:00 et à 08:00 UTC. Le script vérifie l'heure de Paris et ne publie qu'une fois par jour, à partir de 9 h. Ça fonctionne en heure d'été comme en heure d'hiver.
