# 11 - Premières étapes concrètes

## 1. Créer la branche de refactorisation

```powershell
git checkout main
git pull
git checkout -b refactor/full-rebuild
git push -u origin refactor/full-rebuild
```

## 2. Ajouter ce pack de préparation

Copier à la racine du repo :

```txt
.gitignore
.env.example
.htaccess
.github/
.vscode/
api/config/config.example.php
uploads/.gitkeep
uploads/.htaccess
uploads/index.html
docs/refactor-v2/
```

## 3. Vérifier ce qui va être commit

```powershell
git status
```

Vérifier qu'aucun secret réel n'est présent.

## 4. Commit de préparation

```powershell
git add .
git commit -m "docs: prepare full portfolio rebuild"
git push
```

## 5. Ouvrir Codex

Coller le contenu de :

```txt
docs/refactor-v2/10_CODEX_PROMPT.md
```

## 6. Première demande à Codex

Demander explicitement :

```txt
Lis docs/refactor-v2/ puis propose le plan d'exécution. Ne modifie aucun fichier applicatif tant que le plan n'est pas validé.
```

## 7. Après validation du plan

Laisser Codex commencer par :

- créer la structure `frontend/` ;
- préparer l'API PHP propre ;
- créer `database/migrations/001_initial_schema.sql` ;
- préserver les fichiers front existants comme référence ;
- ne pas détruire le rendu actuel tant que le portage React n'est pas prêt.
