# Intégration Blockbench

Cette phase prépare une API privée pour un futur plugin Blockbench. Le plugin n’est pas encore développé.

Le flux permet d’envoyer une création en brouillon avec son modèle `.glb`. Il ne concerne pas les ressources marketplace.

## Migration

Appliquer la migration dédiée après `001_initial_schema.sql` et les migrations existantes :

```powershell
mysql -u root -p loupsauvage_portfolio < database/migrations/009_add_blockbench_api_tokens.sql
```

Pour une nouvelle installation, `database/migrations/001_initial_schema.sql` contient déjà la table `blockbench_api_tokens`.

## Générer un token

```powershell
php tools/create-blockbench-token.php "Blockbench Lou"
```

Le token complet est affiché une seule fois. Il ne doit jamais être commit, copié dans React ou stocké dans un fichier versionné.

## Endpoint

`POST /api/integrations/blockbench/creations/`

Authentification :

```http
Authorization: Bearer lsbb_EXAMPLE
```

Payload `multipart/form-data` :

- `title` requis ;
- `slug` optionnel, généré depuis le titre si vide ;
- `shortDescription` requis ;
- `sourceContext` requis : `personal`, `private_commission` ou `other` ;
- `sourceLabel` optionnel ;
- `modelViewerYawDegrees` optionnel, défaut `180` ;
- `file` requis, format `.glb` uniquement.

Le serveur force toujours :

- `type = creation` ;
- `status = draft` ;
- aucune publication automatique ;
- aucun Sketchfab ;
- aucun item marketplace.

## Test curl local

```powershell
curl.exe -X POST "http://localhost:8000/api/integrations/blockbench/creations/" `
  -H "Authorization: Bearer lsbb_EXAMPLE" `
  -F "title=Nemorak Stage 3" `
  -F "slug=nemorak-stage-3" `
  -F "shortDescription=Modèle de test importé depuis Blockbench." `
  -F "sourceContext=personal" `
  -F "modelViewerYawDegrees=180" `
  -F "file=@C:\path\to\model.glb"
```

Réponse attendue :

```json
{
  "success": true,
  "data": {
    "id": 123,
    "title": "Nemorak Stage 3",
    "slug": "nemorak-stage-3",
    "status": "draft",
    "adminEditUrl": "http://localhost:5173/admin/creations/123",
    "adminPreviewUrl": "http://localhost:5173/admin/creations/123/preview",
    "publicUrl": "http://localhost:5173/creations/nemorak-stage-3"
  }
}
```

## Sécurité

- Le token n’est jamais stocké en clair.
- La base conserve seulement `token_prefix` et `token_hash`.
- Les tokens peuvent être révoqués avec `revoked_at`.
- Le fichier client ne fournit jamais de chemin de destination.
- Le modèle est stocké via la logique d’upload GLB existante.
