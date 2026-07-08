# LoupSauvage Uploader pour Blockbench

Plugin privé Blockbench pour envoyer une création `.glb` vers le portfolio LoupSauvage.

Le plugin crée toujours une création en brouillon côté site. Il ne publie rien automatiquement et ne gère pas les ressources marketplace.

## Statut

Version synchronisee depuis `../VERSION` : `2026.7.7`.

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
- résumé court ;
- contexte de création ;
- orientation du viewer.
- bundles de créations, si l’API est joignable avec le token ;
- option `Se souvenir de ces paramètres`.

Exemples d’URL API :

- local : `http://localhost:8000`
- production : `https://loupsauvage.fr`

Si l’option est cochée, l’URL API et le token sont mémorisés dans le stockage local de Blockbench sur ce poste. Utiliser cette option uniquement sur une machine de confiance. Le bouton `Oublier les paramètres` supprime ces valeurs locales.

Le slug de la création n’est pas demandé : le site le génère automatiquement depuis le titre, sans accents ni caractères spéciaux. Le plugin peut aussi créer, renommer et supprimer des bundles de créations. Les bundles `public` apparaissent sur `/creations`; les bundles `unlisted` restent accessibles par lien direct sans token. L’upload Blockbench crée toujours un brouillon.

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
- Bundles de créations uniquement, pas de bundles marketplace.
- Pas de Sketchfab.
- Pas de description complète.
- Pas de token dans le code.
- Preview générée côté site après import.
