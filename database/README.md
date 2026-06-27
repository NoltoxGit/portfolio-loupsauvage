# Database - Local Phase 2

This folder contains the initial MariaDB schema and local test data.

## Local configuration

Copy the example config, then edit the copy with your local MariaDB credentials:

```powershell
Copy-Item api/config/config.example.php api/config/config.local.php
```

`api/config/config.local.php` is ignored by Git and must never contain production secrets in the repository.

## Import order

Create the database:

```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS loupsauvage_portfolio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Import the schema, then the local test data:

```powershell
mysql -u root -p loupsauvage_portfolio < database/migrations/001_initial_schema.sql
mysql -u root -p loupsauvage_portfolio < database/seeders/001_local_test_data.sql
```

If the Phase 1 migration was already imported locally, recreate the local database or drop the existing tables before reimporting. `CREATE TABLE IF NOT EXISTS` will not alter an existing `pricing_plans` table to add the new `slug` column.

## Local API server

Run from the repository root:

```powershell
php -S localhost:8000
```

Then test:

```powershell
Invoke-WebRequest -UseBasicParsing -Uri http://localhost:8000/api/public/site
Invoke-WebRequest -UseBasicParsing -Uri http://localhost:8000/api/public/creations
Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:8000/api/public/creations?slug=forest-spirit"
Invoke-WebRequest -UseBasicParsing -Uri http://localhost:8000/api/public/marketplace
Invoke-WebRequest -UseBasicParsing -Uri http://localhost:8000/api/public/pricing
```

## Secret check

With ripgrep:

```powershell
rg -n "password|passwd|secret|token|DB_PASSWORD|config.production|config.local" .env.example api/config/config.example.php api/config/bootstrap.php api/src database docs
```

PowerShell alternative:

```powershell
Get-ChildItem -Path ".env.example","api","database","docs" -Recurse -File | Select-String -Pattern "password|passwd|secret|token|DB_PASSWORD|config.production|config.local"
```
