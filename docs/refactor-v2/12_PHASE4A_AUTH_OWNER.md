# 12 - Phase 4A Auth Owner

Phase 4A adds the new owner authentication base. It does not implement admin CRUD yet.

## Create a local owner

Run from the repository root:

```powershell
php tools/create-owner.php owner owner@example.test
```

The command asks for the password locally and stores only a `password_hash()` value in MariaDB. Do not commit `api/config/config.local.php` or any real credentials.

## Local auth test

Start the PHP API:

```powershell
php -S localhost:8000
```

Use a persistent web session in the browser, or use a PowerShell `WebRequestSession`:

```powershell
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-WebRequest -UseBasicParsing -WebSession $session -Uri http://localhost:8000/api/auth/me
Invoke-WebRequest -UseBasicParsing -WebSession $session -Method Post -Uri http://localhost:8000/api/auth/login -ContentType "application/json" -Body '{"email":"owner@example.test","password":"your-local-password"}'
Invoke-WebRequest -UseBasicParsing -WebSession $session -Uri http://localhost:8000/api/auth/me
```

Logout requires the `csrfToken` returned by login or `/api/auth/me`:

```powershell
Invoke-WebRequest -UseBasicParsing -WebSession $session -Method Post -Uri http://localhost:8000/api/auth/logout -Headers @{ "X-CSRF-Token" = "paste-token-here" }
```
