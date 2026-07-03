# Portfolio LoupSauvage

![Aperçu du portfolio](frontend/public/assets/hero-zordix.webp)

[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![PHP](https://img.shields.io/badge/PHP-777BB4?logo=php&logoColor=white)](https://www.php.net/)
[![MariaDB](https://img.shields.io/badge/MariaDB-003545?logo=mariadb&logoColor=white)](https://mariadb.org/)
[![WebStrator Build](https://img.shields.io/badge/GitHub%20Actions-WebStrator%20build-2088FF?logo=githubactions&logoColor=white)](.github/workflows/build-webstrator.yml)
[![Semgrep findings](https://img.shields.io/badge/Semgrep-0%20findings-2EA44F?logo=semgrep&logoColor=white)](https://github.com/NoltoxGit/portfolio-loupsauvage/actions/workflows/semgrep-security.yml)
[![CodeQL code scanning](https://img.shields.io/badge/CodeQL-non%20configure-8C959F?logo=github&logoColor=white)](https://github.com/NoltoxGit/portfolio-loupsauvage/security/code-scanning)

Portfolio de LoupSauvage, modélisatrice 3D spécialisée dans les modèles Minecraft et Blockbench. Le site public présente les créations, ressources marketplace et tarifs. Le panneau admin permet de gérer les contenus, offres et médias.

## Stack

- Frontend : React, Vite, TypeScript.
- Backend : API PHP 8.x maison.
- Base de données : MariaDB avec PDO.
- Hébergement : WebStrator, branche générée `webstrator-build`.
- Uploads : fichiers persistants dans `/uploads`, non versionnés.

## Structure

- `frontend/` : application React publique et admin.
- `api/auth/` : authentification owner.
- `api/public/` : endpoints publics.
- `api/admin/` : endpoints admin protégés.
- `api/config/` : bootstrap et modèle de configuration.
- `api/src/` : classes PHP partagées.
- `database/migrations/` : schéma SQL.
- `database/seeders/` : données locales de développement.
- `tools/create-owner.php` : création locale d’un compte owner.
- `uploads/` : placeholders et règles de sécurité uniquement.

## Développement local

Créer une config locale non versionnée :

```powershell
Copy-Item api/config/config.example.php api/config/config.local.php
```

Importer la base locale :

```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS loupsauvage_portfolio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p loupsauvage_portfolio < database/migrations/001_initial_schema.sql
mysql -u root -p loupsauvage_portfolio < database/seeders/001_local_test_data.sql
```

Lancer l’API PHP depuis la racine :

```powershell
php -S localhost:8000
```

Lancer le frontend :

```powershell
cd frontend
npm install
npm run dev
```

Ouvrir ensuite `http://localhost:5173`.

## Build

```powershell
cd frontend
npm run build
```

Le build local est généré dans `frontend/dist/` et reste ignoré sur la branche source.

## Déploiement WebStrator

Le workflow `.github/workflows/build-webstrator.yml` se déclenche à chaque push sur `main`. Il construit le frontend et publie une branche déployable `webstrator-build` contenant uniquement les fichiers nécessaires à WebStrator.

La configuration de production `api/config/config.production.php` doit être créée directement sur WebStrator via SFTP et ne doit jamais être commitée. Après une synchronisation Git, vérifier qu’elle existe toujours côté serveur.

## Sécurité

- Aucun secret réel dans Git.
- Aucun upload réel dans Git.
- Les configs `config.local.php` et `config.production.php` sont ignorées.
- Les endpoints admin exigent une session owner.
- Les mutations admin exigent un token CSRF.
- Les uploads sont validés par MIME et stockés sous `/uploads`.

Voir aussi [docs/MAINTENANCE.md](docs/MAINTENANCE.md).
