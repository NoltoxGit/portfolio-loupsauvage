# API PHP LoupSauvage

API PHP 8.x du portfolio LoupSauvage. Elle utilise PDO, MariaDB, des sessions PHP natives pour l’admin et des réponses JSON normalisées.

## Configuration

Copier `api/config/config.example.php` vers un fichier non versionné :

- local : `api/config/config.local.php`
- production WebStrator : `api/config/config.production.php`

La clé de connexion canonique est `database.user`. Les anciennes configs locales utilisant `database.username` restent supportées en fallback.

Ne jamais commiter de secrets, mots de passe ou hashes owner.

## Endpoints publics

- `GET /api/public/site`
- `GET /api/public/creations`
- `GET /api/public/creations?slug={slug}`
- `GET /api/public/marketplace`
- `GET /api/public/pricing`

Les endpoints publics exposent uniquement les contenus publiés et les offres actives.

## Authentification

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

La connexion owner utilise `password_verify`, une session PHP sécurisée et un token CSRF retourné par `login` et `me`.

## Endpoints admin

- `GET /api/admin/dashboard`
- `GET|POST|PUT|DELETE /api/admin/content`
- `PATCH /api/admin/content/status`
- `GET|POST|PUT /api/admin/pricing`
- `PATCH /api/admin/pricing/active`
- `GET|PUT|DELETE /api/admin/media`
- `POST /api/admin/media/upload`

Tous les endpoints `/api/admin/*` exigent une session owner. Les mutations `POST`, `PUT`, `PATCH` et `DELETE` exigent l’en-tête `X-CSRF-Token`.

## Réponses JSON

Succès :

```json
{ "success": true, "data": {} }
```

Erreur :

```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Message", "fields": {} } }
```
