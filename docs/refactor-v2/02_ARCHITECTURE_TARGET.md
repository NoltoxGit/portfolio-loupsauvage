# 02 - Architecture cible

## Structure cible du repo source

```txt
portfolio-loupsauvage/
├─ frontend/
│  ├─ public/
│  ├─ src/
│  │  ├─ app/
│  │  ├─ pages/
│  │  │  ├─ public/
│  │  │  └─ admin/
│  │  ├─ components/
│  │  │  ├─ layout/
│  │  │  ├─ content/
│  │  │  ├─ media/
│  │  │  ├─ pricing/
│  │  │  └─ admin/
│  │  ├─ api/
│  │  ├─ types/
│  │  ├─ hooks/
│  │  ├─ utils/
│  │  ├─ i18n/
│  │  └─ styles/
│  ├─ index.html
│  ├─ package.json
│  ├─ package-lock.json
│  ├─ tsconfig.json
│  └─ vite.config.ts
│
├─ api/
│  ├─ public/
│  │  └─ index.php
│  ├─ admin/
│  │  └─ index.php
│  ├─ auth/
│  │  └─ index.php
│  ├─ src/
│  │  ├─ Core/
│  │  ├─ Http/
│  │  ├─ Middleware/
│  │  ├─ Repositories/
│  │  ├─ Services/
│  │  └─ Support/
│  └─ config/
│     ├─ config.example.php
│     ├─ config.local.php         # ignored
│     └─ config.production.php    # ignored
│
├─ database/
│  ├─ migrations/
│  └─ seeders/
│
├─ uploads/
│  ├─ .gitkeep
│  ├─ .htaccess
│  └─ index.html
│
├─ docs/
│  └─ refactor-v2/
│
├─ .github/
│  └─ workflows/
│     └─ build-webstrator.yml
│
├─ .gitignore
├─ .htaccess
└─ README.md
```

## Rôle des dossiers

### `frontend/`

Contient toute l'application React/Vite.

Le front public et l'admin peuvent être dans la même app React, mais séparés par dossiers et routes.

### `api/`

Contient uniquement l'API PHP. Le PHP ne doit pas générer le HTML public du site, sauf cas très spécifique.

L'API retourne du JSON.

### `database/`

Contient les migrations SQL versionnées.

Comme il n'y a pas d'accès SSH en production, l'exécution des migrations en production se fera probablement manuellement via l'outil SQL fourni par WebStrator.

### `uploads/`

Contient les images uploadées depuis l'administration.

WebStrator conserve ce dossier pendant les déploiements Git. Le contenu réel ne doit pas être versionné.

### `docs/refactor-v2/`

Contient la documentation de cadrage de la refactorisation.

## Principe API

L'API doit être structurée, même sans framework lourd.

Interdits :

- SQL concaténé avec des variables utilisateur ;
- endpoints qui mélangent HTML, SQL et logique métier ;
- secrets en dur ;
- uploads acceptant n'importe quel fichier ;
- fonctions globales non organisées partout.

Attendus :

- PDO avec requêtes préparées ;
- réponses JSON cohérentes ;
- validation des entrées ;
- sessions PHP pour l'admin ;
- erreurs normalisées ;
- séparation repositories/services/controllers.

## Principe front

Le front React doit être un portage fidèle de l'existant, pas une refonte graphique.

Le CSS existant peut être repris au départ, puis progressivement découpé.

Interdits :

- changer le design sans demande ;
- supprimer les animations utiles ;
- réinventer les pages ;
- casser le responsive ;
- exposer un lien admin dans la navigation publique.
