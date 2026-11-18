# SpermWhale — publication GitHub Pages

Ce dossier ajoute uniquement l'environnement nécessaire pour publier l'application React sur GitHub Pages.

## Fichier source préservé

`cachalot.jsx` est repris à l'identique depuis le projet fourni. Le point d'entrée `src/main.jsx` l'importe sans le modifier.

## Publication

1. Ajouter tous les fichiers de ce dossier à la racine du dépôt GitHub (au même niveau que `cachalot.jsx`).
2. Envoyer les changements sur la branche `main`.
3. Dans GitHub : **Settings → Pages → Build and deployment → Source**, choisir **GitHub Actions**.
4. Ouvrir l'onglet **Actions** et attendre la fin du workflow **Deploy to GitHub Pages**.
5. L'adresse publique sera affichée dans **Settings → Pages** et dans le résultat du workflow.

Le déploiement est ensuite relancé automatiquement à chaque push sur `main`.

## Tester localement (facultatif)

Nécessite Node.js 22 ou ultérieur :

```bash
npm install
npm run dev
```

Pour vérifier la version de production :

```bash
npm run build
npm run preview
```

## Limitation connue : appel à Anthropic

Le composant source appelle `https://api.anthropic.com/v1/messages` directement depuis le navigateur, sans authentification. GitHub Pages ne fournit pas de serveur privé pour protéger une clé API. Les fonctionnalités reposant sur cet appel IA ne seront donc pas opérationnelles tant qu'un backend sécurisé n'aura pas été ajouté. Ne place jamais une clé API secrète dans `cachalot.jsx` ni dans les fichiers servis au navigateur.
