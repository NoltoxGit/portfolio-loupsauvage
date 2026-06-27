# 09 - Gitignore, secrets et fichiers locaux

## Règle principale

Aucun secret ne doit être stocké dans Git.

Cela inclut :

- identifiants MariaDB locaux ;
- identifiants MariaDB WebStrator ;
- mots de passe admin ;
- tokens ;
- fichiers de configuration production ;
- dumps SQL de production.

## Fichiers autorisés

```txt
.env.example
api/config/config.example.php
```

Ces fichiers ne doivent contenir que des valeurs fictives.

## Fichiers interdits dans Git

```txt
.env
.env.local
.env.production
api/config/config.local.php
api/config/config.production.php
api/config/secrets.php
*.sql
*.sql.gz
```

## Configuration locale

Créer localement :

```txt
api/config/config.local.php
```

à partir de :

```txt
api/config/config.example.php
```

## Configuration production

Créer en production via SFTP si nécessaire :

```txt
api/config/config.production.php
```

Ce fichier ne doit pas être commit.

## Uploads

Le contenu réel de `/uploads` ne doit pas être versionné.

Seuls ces fichiers sont autorisés :

```txt
uploads/.gitkeep
uploads/.htaccess
uploads/index.html
```

## Ancien backend

Si l'ancien repo contient déjà des fichiers avec secrets, ils doivent être :

1. supprimés de la branche de refactorisation ;
2. remplacés par des exemples ;
3. ignorés dans `.gitignore` ;
4. renouvelés côté hébergement si les identifiants ont été exposés.

## GitHub Actions

La branche source ignore `dist/`.

La branche `webstrator-build` peut contenir le résultat compilé, car elle sert uniquement au déploiement.

## Vérification avant commit

Avant chaque commit important :

```powershell
git status
```

Vérifier qu'aucun fichier local ou secret n'apparaît.

Recherche rapide de mots sensibles :

```powershell
git diff --cached | Select-String -Pattern "password|passwd|secret|token|DB_PASSWORD|config.production|config.local"
```
