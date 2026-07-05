# LoupSauvage Uploader pour Blockbench

Plugin privé Blockbench pour envoyer une création `.glb` vers le portfolio LoupSauvage.

Le plugin crée toujours une création en brouillon côté site. Il ne publie rien automatiquement et ne gère pas les ressources marketplace.

## Statut

Version initiale `0.1.0`.

Le plugin cible Blockbench Desktop en V1. Il utilise le codec GLB natif de Blockbench pour exporter le modèle courant en mémoire, puis l’envoie à l’API privée du portfolio.

## Installation privée

1. Télécharger `loupsauvage_uploader.js` depuis les GitHub Releases du repo.
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
- option `Se souvenir de ces paramètres`.

Exemples d’URL API :

- local : `http://localhost:8000`
- production : `https://loupsauvage.fr`

Les paramètres mémorisés restent uniquement dans le stockage local de Blockbench. Le token n’est jamais écrit dans ce dépôt.

## Générer une clé côté site

Méthode recommandée :

1. Se connecter à l’admin du portfolio.
2. Ouvrir `/admin/profile`.
3. Générer une clé Blockbench.
4. Copier le token immédiatement : il ne sera plus affiché ensuite.

Méthode CLI de dépannage depuis la racine du repo :

```powershell
php tools/create-blockbench-token.php "Blockbench Lou"
```

Le token complet est affiché une seule fois. Ne jamais le commiter et ne jamais le hardcoder dans le plugin.

## Limites V1

- `.glb` uniquement.
- Blockbench Desktop uniquement.
- Créations uniquement.
- Brouillon uniquement côté serveur.
- Pas de marketplace.
- Pas de Sketchfab.
- Pas de description complète.
- Pas de token dans le code.
- Preview générée côté site après import.
