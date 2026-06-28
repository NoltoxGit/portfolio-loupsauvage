# Base de données

Ce dossier contient le schéma MariaDB et des données locales de développement.

## Configuration locale

Créer une copie non versionnée du modèle de configuration :

```powershell
Copy-Item api/config/config.example.php api/config/config.local.php
```

Renseigner la section `database` avec les valeurs locales. La clé utilisateur canonique est :

```php
'user' => 'root',
```

## Import local

Créer la base :

```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS loupsauvage_portfolio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Importer le schéma puis le seeder local :

```powershell
mysql -u root -p loupsauvage_portfolio < database/migrations/001_initial_schema.sql
mysql -u root -p loupsauvage_portfolio < database/seeders/001_local_test_data.sql
```

Si une ancienne version du schéma existe déjà en local, recréer la base ou supprimer les tables avant de réimporter.

## Owner local

Créer un owner local sans commiter de secret :

```powershell
php tools/create-owner.php LoupSauvage login@example.test
```

Le mot de passe est demandé au prompt puis hashé avec `password_hash`.

## Vérifications utiles

Lancer l’API locale :

```powershell
php -S localhost:8000
```

Tester les endpoints publics :

```powershell
Invoke-WebRequest -UseBasicParsing -Uri http://localhost:8000/api/public/site
Invoke-WebRequest -UseBasicParsing -Uri http://localhost:8000/api/public/creations
Invoke-WebRequest -UseBasicParsing -Uri http://localhost:8000/api/public/marketplace
Invoke-WebRequest -UseBasicParsing -Uri http://localhost:8000/api/public/pricing
```
