# Intégration Blockbench

Cette intégration fournit une API privée et un plugin Blockbench Desktop pour envoyer une création `.glb` vers le portfolio.

Le flux permet d’envoyer une création en brouillon avec son modèle `.glb`. Il ne concerne pas les ressources marketplace.

## Migration

Appliquer la migration dédiée après `001_initial_schema.sql` et les migrations existantes :

```powershell
mysql -u root -p loupsauvage_portfolio < database/migrations/009_add_blockbench_api_tokens.sql
```

Pour une nouvelle installation, `database/migrations/001_initial_schema.sql` contient déjà la table `blockbench_api_tokens`.

## Générer une clé API

Méthode recommandée :

1. Se connecter à l’admin du portfolio.
2. Ouvrir `/admin/profile`.
3. Générer une clé Blockbench.
4. Copier le token immédiatement : il ne sera plus affiché ensuite.

Le script CLI reste disponible pour dépannage :

```powershell
php tools/create-blockbench-token.php "Blockbench Lou"
```

Le token complet est affiché une seule fois. Il ne doit jamais être commit, copié dans React ou stocké dans un fichier versionné.

## Plugin Blockbench

Le fichier `loupsauvage_uploader.js` est publié comme asset principal dans les GitHub Releases du plugin. Le zip reste disponible pour archivage.

Configuration dans Blockbench Desktop :

- Base URL locale : `http://localhost:8000` ;
- Base URL production : `https://loupsauvage.fr` ;
- API Token : clé `lsbb_...` générée depuis l’admin ;
- cocher `Se souvenir de l’URL API` si le poste est de confiance.

Le plugin ne mémorise pas le token dans le stockage local de Blockbench. Ne jamais partager publiquement le token.

## Endpoint

`POST /api/integrations/blockbench/creations/`

Authentification :

```http
Authorization: Bearer <cle_api_blockbench>
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
  -H "Authorization: Bearer <cle_api_blockbench>" `
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
- L’admin `/admin/profile` permet de générer et révoquer les clés.

## Limites V1

- Blockbench Desktop uniquement.
- `.glb` uniquement.
- Créations uniquement.
- Création toujours en brouillon.
- Pas d’Espace client.
