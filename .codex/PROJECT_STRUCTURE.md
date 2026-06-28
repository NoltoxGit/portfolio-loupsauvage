# Structure du projet

Portfolio LoupSauvage en React/Vite/TypeScript avec API PHP 8.x et MariaDB.

## Frontend

- `frontend/` contient le site public, l’admin React et les assets publics.
- `frontend/public/assets/hero-zordix.webp` est l’image principale utilisée par le site.
- `frontend/dist/` est généré localement et ignoré sur `main`.

## API

- `api/auth/` expose login, logout et session owner.
- `api/public/` expose les données publiques.
- `api/admin/` expose les endpoints admin protégés.
- `api/config/` contient le bootstrap et le modèle de config.
- `api/src/` contient la logique partagée.

## Données et déploiement

- `database/migrations/` contient le schéma SQL.
- `database/seeders/` contient les données locales.
- `uploads/` garde seulement les placeholders et règles de sécurité dans Git.
- `.github/workflows/build-webstrator.yml` génère la branche `webstrator-build`.
