# Organisation du projet

Le projet est maintenant un portfolio React/Vite/TypeScript avec une API PHP 8.x et une base MariaDB.

## Frontend

- `frontend/` contient l'application React publique et admin.
- `frontend/public/creation.html` et `frontend/public/creations.html` sont des shims de compatibilite inclus dans le build.
- `frontend/public/assets/hero-zordix.webp` est l'image hero utilisee par le site React.

## Backend

- `api/auth/` expose les endpoints d'authentification owner.
- `api/public/` expose les endpoints publics.
- `api/admin/` expose les endpoints admin proteges.
- `api/config/` contient le bootstrap et le modele de configuration.
- `api/src/` contient les classes PHP partagees.

## Donnees et deploiement

- `database/migrations/` contient le schema SQL.
- `database/seeders/` contient les donnees locales de developpement.
- `uploads/` ne versionne que les placeholders et fichiers de securite.
- `.github/workflows/build-webstrator.yml` genere la branche deployable `webstrator-build`.
