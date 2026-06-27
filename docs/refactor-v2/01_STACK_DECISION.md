# 01 - Décision de stack

## Stack retenue

```txt
Front public : React + Vite + TypeScript
Admin : React + Vite + TypeScript
Back-end : API PHP maison structurée
Base de données : MariaDB
Uploads : fichiers stockés sur le serveur + chemins stockés en base
Build : GitHub Actions
Déploiement : branche WebStrator dédiée, déclenchée manuellement côté WebStrator
```

## Pourquoi React + Vite + TypeScript

Le site n'est pas uniquement une vitrine statique. Il contient une vraie interface d'administration avec formulaires, collections, images, liens externes, statuts de publication et données dynamiques.

React permet de découper proprement l'interface en composants :

- cartes de créations ;
- galeries ;
- formulaires admin ;
- champs de prix ;
- embeds Sketchfab ;
- listes filtrables ;
- layouts communs.

Vite permet de compiler le site en fichiers statiques compatibles avec WebStrator.

TypeScript est retenu pour éviter les erreurs de structure entre l'API et le front : mauvais champ, mauvais type, valeur manquante, etc.

## Pourquoi pas Next.js pour cette version

Next.js n'est pas retenu pour la première version car :

- l'hébergement actuel est un hébergement PHP classique ;
- il n'y a pas d'accès SSH ;
- les fonctionnalités serveur de Next.js ne sont pas adaptées à cet environnement ;
- une API PHP reste nécessaire pour MariaDB, sessions et uploads.

## Pourquoi pas Laravel pour cette version

Laravel n'est pas retenu pour la première version car :

- il exige plus de contraintes serveur ;
- il nécessite Composer et une structure de déploiement plus stricte ;
- il est impossible de garantir une installation propre sans accès SSH ;
- le besoin actuel peut être couvert par une API PHP maison bien structurée.

Laravel peut être reconsidéré plus tard uniquement si l'hébergement évolue.

## Décision sur les routes

Comme `.htaccess` est supporté, les routes propres sont envisageables :

```txt
/
/creations
/creations/:slug
/marketplace
/pricing
/admin
/admin/login
```

Cependant, la première implémentation doit rester prudente. Si les rewrites posent problème sur WebStrator, revenir temporairement à des routes HTML ou query string compatibles :

```txt
/index.html
/creations.html
/creation.html?slug=...
/marketplace.html
/pricing.html
/admin/
```

## Décision sur le build

Le build ne doit pas être fait manuellement à chaque modification.

Workflow cible :

```txt
branche de refactorisation / main
↓
GitHub Actions
↓
npm ci
↓
npm run build
↓
publication du résultat sur webstrator-build
↓
WebStrator déploie manuellement webstrator-build
```

Le workflow fourni est volontairement manuel au début via `workflow_dispatch`. Il ne faut l'automatiser sur `push` que lorsque la structure React/Vite est stable.
