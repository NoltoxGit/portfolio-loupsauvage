# LoupSauvage Uploader pour Blockbench

Plugin privé Blockbench pour envoyer une création `.glb` vers le portfolio LoupSauvage.

Le plugin crée toujours une création en brouillon côté site. Il ne publie rien automatiquement et ne gère pas les ressources marketplace.

## Statut

Version initiale `0.1.0`.

Le socle du plugin est présent, mais l’export GLB automatique depuis Blockbench est encore isolé dans un `TODO`. La fonction à finaliser est `exportProjectAsGlbBlob()` dans `loupsauvage_uploader.js`.

## Installation privée

1. Télécharger `loupsauvage_uploader.js`.
2. L’installer dans le dossier plugins utilisateur de Blockbench.
3. Redémarrer Blockbench.
4. Utiliser l’action `Envoyer sur LoupSauvage` depuis le menu d’export.

## Configuration

Champs demandés par la boîte de dialogue :

- API Base URL ;
- API Token ;
- titre affiché ;
- slug ;
- résumé court ;
- contexte de création ;
- orientation du viewer.

Exemples d’URL API :

- local : `http://localhost:8000`
- production : `https://loupsauvage.fr`

## Générer un token côté site

Depuis la racine du repo :

```powershell
php tools/create-blockbench-token.php "Blockbench Lou"
```

Le token complet est affiché une seule fois. Ne jamais le commiter et ne jamais le hardcoder dans le plugin.

## Limites V1

- `.glb` uniquement.
- Créations uniquement.
- Brouillon uniquement côté serveur.
- Pas de marketplace.
- Pas de Sketchfab.
- Pas de description complète.
- Pas de token dans le code.
- Preview générée côté site après import.
