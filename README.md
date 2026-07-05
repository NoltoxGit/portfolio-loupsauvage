# Portfolio LoupSauvage

![Aperçu du portfolio](frontend/public/assets/hero-zordix.webp)

[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![PHP](https://img.shields.io/badge/PHP-777BB4?logo=php&logoColor=white)](https://www.php.net/)
[![MariaDB](https://img.shields.io/badge/MariaDB-003545?logo=mariadb&logoColor=white)](https://mariadb.org/)
[![WebStrator Build](https://img.shields.io/badge/GitHub%20Actions-WebStrator%20build-2088FF?logo=githubactions&logoColor=white)](.github/workflows/build-webstrator.yml)
[![Semgrep findings](https://img.shields.io/badge/Semgrep-0%20findings-2EA44F?logo=semgrep&logoColor=white)](https://github.com/NoltoxGit/portfolio-loupsauvage/actions/workflows/semgrep-security.yml)

Monorepo public du portfolio LoupSauvage et du plugin privé Blockbench associé.

Le site présente les créations 3D, ressources marketplace et tarifs de LoupSauvage. L’admin permet de gérer les contenus, médias, modèles GLB et imports. Le plugin Blockbench prépare l’envoi privé de créations `.glb` vers l’API du site.

## Structure

- `frontend/` : application React/Vite/TypeScript publique et admin.
- `api/` : API PHP 8.x, endpoints publics, admin et intégrations privées.
- `database/` : migrations et seeders locaux.
- `tools/` : scripts CLI utiles au développement et à l’administration.
- `docs/` : documentation de maintenance et intégrations.
- `blockbench-plugin/` : plugin Blockbench privé `LoupSauvage Uploader`.
- `.github/workflows/` : builds WebStrator, scan sécurité et release plugin.
- `uploads/` : placeholders et règles de sécurité uniquement.

Le site reste volontairement à la racine pour cette phase afin d’éviter une migration massive de chemins WebStrator. Le monorepo est séparé fonctionnellement par dossiers.

## Commandes site

Installer et lancer le frontend :

```powershell
cd frontend
npm install
npm run dev
```

Build frontend :

```powershell
cd frontend
npm run build
```

Lancer l’API locale depuis la racine :

```powershell
php -S localhost:8000
```

Lint PHP :

```powershell
Get-ChildItem api -Recurse -Filter *.php | ForEach-Object { php -l $_.FullName }
```

Importer une migration en PowerShell :

```powershell
Get-Content -Raw database/migrations/001_initial_schema.sql | mysql -u root -p <database_name>
```

Créer un owner local :

```powershell
php tools/create-owner.php <username> <email@example.test>
```

Créer une clé Blockbench depuis l’admin :

1. Ouvrir `/admin/profile`.
2. Générer une clé dans la section Blockbench.
3. Copier la clé immédiatement : elle ne sera plus affichée après refresh.

Le script CLI reste disponible pour dépannage local :

```powershell
php tools/create-blockbench-token.php "Blockbench poste principal"
```

## Commandes plugin Blockbench

Vérifier la syntaxe :

```powershell
cd blockbench-plugin
npm run check
```

Packager localement :

```powershell
cd blockbench-plugin
npm run package
```

Le plugin est privé dans son usage : son code peut être public, mais le token `lsbb_...` doit rester strictement local. En local, la Base URL du plugin est `http://localhost:8000`. En production, utiliser l’URL publique du site déployé.

Les releases GitHub du plugin publient directement `loupsauvage_uploader.js` comme asset principal, plus une archive zip et un checksum SHA-256.

## Workflows

- `build-webstrator.yml` : build le site uniquement quand `frontend/`, `api/`, `database/`, les fichiers Apache ou le workflow changent.
- `blockbench-plugin-release.yml` : vérifie et publie une release plugin uniquement quand `blockbench-plugin/**` change sur `main`.
- `semgrep-security.yml` : scan sécurité sur les branches et pull requests.

La branche `webstrator-build` est générée automatiquement. Ne pas la modifier directement.

## Sécurité

- Ne jamais commiter `api/config/config.local.php`.
- Ne jamais commiter `api/config/config.production.php`.
- Ne jamais commiter de token `lsbb_...`.
- Ne jamais commiter de vrais fichiers uploadés.
- Les clés Blockbench peuvent être générées et révoquées dans `/admin/profile`.
- Le plugin Blockbench Desktop crée toujours des créations en brouillon.
- Le format modèle V1 est `.glb` uniquement.
- Aucun token Blockbench n’est nécessaire dans React.

## Statut

- Site React/PHP en production technique.
- Plugin Blockbench V1 en développement.
- Pas encore d’Espace client complet.
- Documentation longue durée : [docs/MAINTENANCE.md](docs/MAINTENANCE.md).
