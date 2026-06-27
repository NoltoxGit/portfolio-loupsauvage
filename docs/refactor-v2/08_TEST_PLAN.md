# 08 - Plan de tests

## Objectif

Ne pas déployer une refactorisation qui fonctionne seulement en apparence.

## Tests locaux obligatoires

### PHP

```powershell
php -v
php -m | findstr /I "pdo_mysql fileinfo session json mbstring"
```

Tous les fichiers PHP :

```powershell
Get-ChildItem -Recurse -Filter *.php | ForEach-Object { php -l $_.FullName }
```

### Frontend

Depuis `frontend/` :

```powershell
npm ci
npm run build
```

Si des scripts existent plus tard :

```powershell
npm run lint
npm run typecheck
```

## Tests API publics

À vérifier :

```txt
GET /api/public/site
GET /api/public/creations
GET /api/public/creations/{slug}
GET /api/public/marketplace
GET /api/public/pricing
```

Chaque endpoint doit retourner JSON valide.

## Tests auth/admin

- accéder à `/admin` non connecté ;
- être redirigé vers `/admin/login` ;
- login owner correct ;
- login incorrect refusé ;
- logout ;
- session expirée ou supprimée ;
- endpoint admin refusé sans session.

## Tests créations

- créer une création brouillon ;
- vérifier qu'elle n'apparaît pas sur le public ;
- publier la création ;
- vérifier qu'elle apparaît sur la home ;
- vérifier qu'elle apparaît sur `/creations` ;
- vérifier que la page détail fonctionne ;
- modifier titre/description/image ;
- archiver ;
- vérifier qu'elle disparaît du public.

## Tests commissions privées

- créer une création avec `source_context = private_commission` ;
- essayer de publier sans autorisation client ;
- vérifier que l'API refuse ;
- cocher autorisation client ;
- publier ;
- vérifier l'affichage public.

## Tests marketplace

- créer une ressource BuildByBit ;
- créer une ressource MCModels ;
- vérifier les liens externes ;
- vérifier l'affichage des prix ;
- vérifier les images ;
- archiver.

## Tests pricing

- créer une offre ;
- modifier le prix ;
- désactiver l'offre ;
- vérifier qu'une offre inactive ne s'affiche pas publiquement.

## Tests uploads

- upload `.jpg` ;
- upload `.png` ;
- upload `.webp` ;
- refuser `.php` ;
- refuser image trop lourde ;
- vérifier que l'image est accessible publiquement ;
- vérifier qu'un fichier PHP uploadé ne peut pas s'exécuter.

## Tests responsive

Comparer l'ancien et le nouveau site sur :

```txt
1920x1080
1366x768
768x1024
390x844
```

## Tests production WebStrator

Après déploiement :

- home OK ;
- créations OK ;
- détail création OK ;
- marketplace OK ;
- pricing OK ;
- admin login OK ;
- API publique OK ;
- upload OK ;
- `/uploads` conservé après déploiement ;
- pas de secrets accessibles publiquement.
