# 07 - Déploiement WebStrator

## Objectif

Conserver un déploiement manuel côté WebStrator, mais automatiser le build avec GitHub Actions.

## Branches recommandées

```txt
main
= branche stable source, à terme.

refactor/full-rebuild
= branche de travail pour cette refactorisation complète.

webstrator-build
= branche générée automatiquement par GitHub Actions, prête à déployer via WebStrator.
```

## Création de branche locale

Depuis `main` :

```powershell
git checkout main
git pull
git checkout -b refactor/full-rebuild
git push -u origin refactor/full-rebuild
```

## Workflow de build

Le fichier fourni :

```txt
.github/workflows/build-webstrator.yml
```

est déclenché manuellement au départ.

Il fait :

1. checkout du repo ;
2. installation Node.js ;
3. `npm ci` dans `frontend/` ;
4. `npm run build` ;
5. copie du `frontend/dist` dans un dossier de déploiement ;
6. copie de l'API PHP ;
7. copie des fichiers Apache ;
8. création/écrasement de la branche `webstrator-build`.

## Pourquoi workflow manuel au début

Tant que `frontend/package.json` et `frontend/package-lock.json` n'existent pas, le workflow échouera.

Il ne faut donc pas activer de déclenchement automatique sur push avant la création réelle du projet React/Vite.

## WebStrator

Côté WebStrator :

- configurer la branche de déploiement sur `webstrator-build` ;
- déclencher manuellement le déploiement uniquement après validation du build ;
- vérifier que `/uploads` reste conservé après déploiement.

## Secrets de production

Les fichiers suivants ne doivent pas être commit :

```txt
api/config/config.production.php
api/config/config.local.php
.env
.env.local
.env.production
```

En production, `config.production.php` devra être envoyé via SFTP si nécessaire, ou créé directement sur le serveur.

## Uploads

WebStrator conserve `/uploads`, donc le workflow ne doit pas pousser les fichiers uploadés.

La branche de build ne doit contenir que :

```txt
uploads/.gitkeep
uploads/.htaccess
uploads/index.html
```

## Rollback

Si un déploiement casse le site :

1. revenir au commit précédent de `webstrator-build` ;
2. relancer le déploiement WebStrator ;
3. corriger dans la branche source ;
4. relancer GitHub Actions.
