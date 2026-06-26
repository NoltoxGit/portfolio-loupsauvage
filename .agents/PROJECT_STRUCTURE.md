# Organisation du projet

Ce site est un portfolio statique deploye automatiquement. Les URL publiques historiques restent donc stables.

## Entrees publiques

- `index.html` : page d'accueil.
- `creations.html` : galerie complete.
- `creation.html?id=...` : detail d'une creation.

## Assets

- `assets/css/styles.css` : styles principaux.
- `assets/js/data.js` : donnees du portfolio.
- `assets/js/i18n.js` : traductions FR/EN.
- `assets/js/script.js` : rendu dynamique, navigation, galerie et animations.
- `assets/hero-zordix.webp` : visuel principal, garde a son chemin historique pour ne pas casser les pages ou caches existants.

Les routes internes sont centralisees dans `siteRoutes` au debut de `assets/js/script.js`.

## Compatibilite et redirections

Les fichiers racine `styles.css`, `data.js`, `i18n.js` et `script.js` sont conserves comme shims de compatibilite. Ils protegent les anciennes references pendant les deploiements automatiques.

Aucune URL publique HTML n'a ete deplacee dans cette passe. Si une hierarchie propre comme `/creations/` ou `/creation/` est ajoutee plus tard, conserver `creations.html` et `creation.html` comme redirections statiques.
