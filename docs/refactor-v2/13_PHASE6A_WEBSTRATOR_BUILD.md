# 13 - Phase 6A - Build deployable WebStrator

## Objectif

Preparer une branche `webstrator-build` deployable manuellement par WebStrator, sans toucher a la production et sans commiter de secret.

La branche source conserve les anciens fichiers legacy comme reference. La branche de build contient le site React compile, la nouvelle API PHP, les fichiers Apache necessaires et les placeholders de `/uploads`.

## Structure de la branche webstrator-build

```txt
/
├─ index.html
├─ creation.html
├─ creations.html
├─ assets/
├─ .htaccess
├─ .user.ini
├─ api/
│  ├─ auth/
│  ├─ public/
│  ├─ admin/
│  ├─ config/
│  └─ src/
└─ uploads/
   ├─ .gitkeep
   ├─ .htaccess
   └─ index.html
```

La branche build ne doit pas contenir :

- `frontend/`
- `node_modules/`
- `docs/`
- `tools/`
- `.github/`
- `database/`
- l'ancien dossier `admin/`
- les anciens fichiers API jetables : `api/auth.php`, `api/admin-data.php`, `api/bootstrap.php`, `api/site-data.php`, `api/upload.php`
- les vrais fichiers uploades dans `/uploads`
- `api/config/config.local.php`
- `api/config/config.production.php`

## Configuration production

`api/config/config.production.php` ne doit jamais etre commit.

En production WebStrator :

1. copier `api/config/config.example.php` vers `api/config/config.production.php` localement hors Git ou directement sur le serveur ;
2. renseigner les identifiants MariaDB WebStrator ;
3. definir `app.env` a `production` ;
4. definir `app.debug` a `false` ;
5. definir `app.session_secure` a `true` ;
6. verifier `uploads.filesystem_path` pour pointer vers le dossier `/uploads` reel du site ;
7. envoyer `api/config/config.production.php` via SFTP.

Apres chaque synchronisation Git WebStrator, verifier que `api/config/config.production.php` existe encore. Si WebStrator supprime les fichiers non suivis pendant la sync, renvoyer ce fichier via SFTP avant de tester l'API.

## Uploads

WebStrator doit conserver `/uploads` entre deux deploiements Git.

A verifier cote hebergement :

- le dossier `/uploads` existe ;
- il est writable par PHP ;
- il contient `uploads/.htaccess` ;
- un fichier PHP place dans `/uploads` ne peut pas s'executer ;
- les vrais fichiers uploades ne sont pas presents dans Git.

## Base de donnees et owner

Les migrations SQL restent dans la branche source et ne sont pas publiees dans la branche build.

En production :

1. importer `database/migrations/001_initial_schema.sql` via l'outil SQL WebStrator ;
2. ne pas importer de dump local contenant des secrets ;
3. creer l'owner production sans commiter de mot de passe ni de hash ;
4. tester `/api/auth/login`, `/api/auth/me`, puis `/admin`.

## Checklist avant de lancer WebStrator

Depuis GitHub Actions :

1. lancer manuellement `Build WebStrator branch` ;
2. garder `target_branch = webstrator-build` ;
3. verifier que le workflow termine sans erreur ;
4. verifier que la branche `webstrator-build` contient uniquement le build deployable.

Cote WebStrator :

1. selectionner la branche `webstrator-build` ;
2. lancer le deploiement manuel ;
3. verifier ou renvoyer `api/config/config.production.php` via SFTP ;
4. verifier que `/uploads` est toujours present et writable ;
5. tester les routes publiques : `/`, `/creations`, `/marketplace`, `/pricing` ;
6. tester les routes API : `/api/public/site`, `/api/auth/me` ;
7. tester `/admin/login` puis `/admin` avec un owner valide ;
8. tester un upload media admin ;
9. verifier que `api/config/`, `.env*`, `database/`, `docs/`, `tools/`, `.git/` et `.github/` ne sont pas accessibles depuis le web.

## Rollback

Si le deploiement casse le site :

1. revenir au commit precedent de `webstrator-build` ;
2. relancer le deploiement WebStrator ;
3. corriger la branche source ;
4. relancer le workflow de build manuel.
