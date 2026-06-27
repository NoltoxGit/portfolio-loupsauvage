# 04 - Contrat API

## Format de réponse standard

Succès :

```json
{
  "success": true,
  "data": {}
}
```

Erreur :

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid payload.",
    "fields": {}
  }
}
```

## Endpoints publics

### `GET /api/public/site`

Retourne les données nécessaires à la page d'accueil.

Inclure au minimum :

- dernières créations publiées ;
- ressources marketplace mises en avant ;
- pricing plans actifs.

### `GET /api/public/creations`

Liste les créations publiées.

Filtres possibles plus tard :

- pagination ;
- recherche ;
- tags si ajoutés plus tard.

### `GET /api/public/creations/{slug}`

Retourne une création publiée et ses médias.

### `GET /api/public/marketplace`

Liste les ressources marketplace publiées.

### `GET /api/public/pricing`

Liste les offres actives.

## Endpoints auth

### `POST /api/auth/login`

Payload :

```json
{
  "email": "owner@example.com",
  "password": "password"
}
```

Réponse :

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "owner",
      "email": "owner@example.com",
      "role": "owner"
    }
  }
}
```

### `POST /api/auth/logout`

Détruit la session.

### `GET /api/auth/me`

Retourne l'utilisateur connecté ou une erreur `UNAUTHENTICATED`.

## Endpoints admin protégés

Tous les endpoints `/api/admin/*` exigent une session owner active.

### `GET /api/admin/content`

Liste les items, avec créations et marketplace.

Query params possibles :

```txt
type=creation|marketplace
status=draft|published|archived
```

### `POST /api/admin/content`

Crée un item.

### `PUT /api/admin/content/{id}`

Met à jour un item.

### `PATCH /api/admin/content/{id}/status`

Change le statut : draft, published, archived.

### `DELETE /api/admin/content/{id}`

À éviter au début. Préférer archive.

Si implémenté, l'action doit supprimer ou détacher les médias correctement.

### `POST /api/admin/uploads`

Upload d'une image.

Contraintes :

- vérifier MIME réel avec `fileinfo` ;
- refuser PHP/scripts ;
- limiter la taille ;
- générer un nom serveur unique ;
- stocker le chemin relatif en base après association.

### `GET /api/admin/pricing`

Liste les offres.

### `POST /api/admin/pricing`

Crée une offre.

### `PUT /api/admin/pricing/{id}`

Met à jour une offre.

### `PATCH /api/admin/pricing/{id}/active`

Active/désactive une offre.

## Sécurité API

Obligatoire :

- `password_hash()` pour créer les mots de passe ;
- `password_verify()` pour la connexion ;
- sessions PHP sécurisées ;
- requêtes PDO préparées ;
- validation stricte des entrées ;
- protection CSRF pour les mutations admin ou stratégie équivalente ;
- pas de secrets dans le repo ;
- pas d'upload exécutable.

## CORS

Si le front Vite local tourne sur `localhost:5173` et l'API locale sur `localhost:8000`, autoriser uniquement l'origine locale en mode développement.

En production, éviter CORS si front et API sont sur le même domaine.
