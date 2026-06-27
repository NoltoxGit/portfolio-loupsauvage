# 06 - Panel admin

## Objectif

Créer un panel admin simple et robuste pour gérer uniquement le contenu dynamique métier.

## Pages admin retenues

```txt
/admin/login
/admin/dashboard
/admin/creations
/admin/creations/new
/admin/creations/:id
/admin/marketplace
/admin/marketplace/new
/admin/marketplace/:id
/admin/pricing
/admin/pricing/new
/admin/pricing/:id
```

## Page exclue

```txt
/admin/settings
```

Ne pas créer cette page.

Les réglages globaux du site restent dans le code.

## Connexion

- Aucun lien visible vers `/admin` depuis le site public.
- Accès direct par URL uniquement.
- Connexion par email + mot de passe.
- Session PHP côté serveur.
- Après login, redirection vers `/admin/dashboard`.

## Dashboard

Afficher simplement :

- nombre de créations publiées ;
- nombre de créations brouillon ;
- nombre de ressources marketplace publiées ;
- nombre d'offres actives.

Pas besoin de graphiques.

## Créations

Champs :

- titre ;
- slug généré automatiquement mais modifiable ;
- description courte ;
- description complète ;
- statut : brouillon, publié, archivé ;
- contexte : création personnelle, commission privée, autre ;
- autorisation client si commission privée ;
- lien Sketchfab ;
- images/renders ;
- ordre d'affichage ;
- date de publication.

Règle : une commission privée ne peut pas être publiée si l'autorisation client n'est pas cochée.

## Marketplace

Champs :

- titre ;
- slug ;
- description courte ;
- description complète ;
- statut ;
- plateforme externe : BuildByBit, MCModels, Sketchfab, autre ;
- URL externe ;
- prix affiché ;
- lien Sketchfab éventuel ;
- images/renders ;
- ordre d'affichage.

## Pricing

Champs :

- titre de l'offre ;
- sous-titre ;
- prix affiché ;
- description ;
- liste de fonctionnalités ;
- ordre d'affichage ;
- actif/inactif.

## Uploads

Contraintes UI :

- prévisualisation image ;
- texte alternatif ;
- image de couverture ;
- galerie ordonnable plus tard si nécessaire.

Contraintes back-end :

- refuser tout fichier non image ;
- refuser fichiers trop lourds ;
- générer un nom unique ;
- interdire l'exécution PHP dans `/uploads`.

## Suppression

Pour la première version, préférer `archived` à la suppression définitive.

La suppression définitive pourra être ajoutée plus tard avec confirmation explicite.
