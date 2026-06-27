# 00 - Contexte projet

## Objectif

Refaire le portfolio LoupSauvage de manière propre, maintenable et testable, tout en conservant le rendu visuel existant au plus proche.

Le site est un portfolio pour une modélisatrice 3D spécialisée dans les modèles Blockbench/Minecraft. Le site présente :

- des créations personnelles ;
- des commissions privées rendues publiques avec accord client ;
- des ressources marketplace vendues ou publiées sur BuildByBit, MCModels ou d'autres plateformes ;
- des offres/tarifs de prestations 3D ;
- une interface d'administration privée.

## Principe majeur

L'ancien back-end ne doit pas être refactorisé progressivement. Il doit être considéré comme jetable.

Le code existant doit uniquement servir de référence pour :

- le rendu HTML ;
- les styles CSS ;
- les animations JavaScript utiles ;
- la structure visuelle des pages ;
- le responsive ;
- les contenus de démonstration éventuellement réutilisables.

## Règle de fidélité visuelle

La nouvelle version doit conserver le rendu existant au plus proche :

- même page d'accueil ;
- même ambiance visuelle ;
- mêmes couleurs principales ;
- mêmes espacements autant que possible ;
- mêmes cartes ;
- même header/footer ;
- mêmes comportements importants ;
- responsive équivalent ;
- aucune refonte graphique non demandée.

## Hébergement

- Hébergement : WebStrator.
- Accès technique : SFTP via WinSCP uniquement.
- Pas d'accès SSH/console serveur.
- PHP disponible côté WebStrator : PHP 8.5 selon les informations actuelles.
- Base de données production : MariaDB disponible chez WebStrator.
- Déploiement : via GitHub, déclenché manuellement depuis WebStrator.
- WebStrator peut déployer depuis une branche choisie.
- WebStrator conserve le dossier `/uploads` lors d'un déploiement Git.
- WebStrator supporte `.htaccess` Apache.

## Environnements

- Local : MariaDB locale pour développement et tests.
- Production : MariaDB WebStrator.

Les secrets locaux et production ne doivent jamais être commit.

## Rôles

Deux rôles conceptuels seulement :

- `owner` : utilisateur autorisé à accéder à l'administration ;
- `viewer` : visiteur public du site.

Il ne doit y avoir aucun bouton visible sur le site public pour accéder à l'administration. L'URL `/admin` peut exister, mais elle ne doit pas être exposée dans la navigation publique.

## Administration retenue

Pages admin prévues :

- `/admin/login` ;
- `/admin` ou `/admin/dashboard` ;
- `/admin/creations` ;
- `/admin/marketplace` ;
- `/admin/pricing`.

Page explicitement exclue :

- `/admin/settings`.

Les réglages globaux, textes fixes, liens fixes, sections statiques et choix de design restent dans le code.
