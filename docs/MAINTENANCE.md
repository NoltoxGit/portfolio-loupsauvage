# Maintenance

Guide court pour maintenir le portfolio LoupSauvage.

## Local

1. Copier la config exemple :

```powershell
Copy-Item api/config/config.example.php api/config/config.local.php
```

2. Renseigner MariaDB dans `api/config/config.local.php`. La clé utilisateur canonique est `database.user`.

3. Importer la base :

```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS loupsauvage_portfolio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p loupsauvage_portfolio < database/migrations/001_initial_schema.sql
mysql -u root -p loupsauvage_portfolio < database/seeders/001_local_test_data.sql
```

4. Lancer l’API depuis la racine :

```powershell
php -S localhost:8000
```

5. Lancer le frontend :

```powershell
cd frontend
npm install
npm run dev
```

Le site local s’ouvre sur `http://localhost:5173`. Le serveur PHP `localhost:8000` sert l’API et les uploads.

## Production WebStrator

- La branche source est `main`.
- Chaque push sur `main` déclenche le workflow GitHub Actions.
- Le workflow publie la branche `webstrator-build`, utilisée par WebStrator.
- `api/config/config.production.php` doit être envoyé via SFTP et ne doit pas être versionné.
- Après chaque synchronisation WebStrator, vérifier que `api/config/config.production.php` existe encore.
- Le dossier `/uploads` doit rester persistant et inscriptible par PHP.

## Sécurité

- Ne jamais commiter de secrets, mots de passe, hashes owner ou configs réelles.
- Ne jamais commiter de vrais fichiers uploadés.
- Garder `api/config/config.local.php` et `api/config/config.production.php` ignorés.
- Créer l’owner avec `tools/create-owner.php` ou avec un hash généré localement.

## Tests post-déploiement

- Ouvrir `/`, `/creations`, `/marketplace`, `/pricing`.
- Tester une route directe React comme `/admin`.
- Tester `GET /api/public/site`.
- Se connecter à `/admin/login`.
- Vérifier le dashboard admin.
- Créer ou modifier un contenu de test.
- Tester un upload média.
- Vérifier que les uploads s’affichent et restent présents après synchronisation.
