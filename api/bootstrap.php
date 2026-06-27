<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

const ADMIN_SESSION_KEY = 'loupsauvage_admin_id';
const ADMIN_SESSION_NAME_KEY = 'loupsauvage_admin_username';

$isHttps = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => $isHttps,
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

function json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function pdo(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', DB_HOST, DB_NAME, DB_CHARSET);
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}

function default_site_payload(): array
{
    return [
        'creations' => [],
        'pricing' => [],
        'packs' => [],
        'marketplace' => [],
        'buttons' => new stdClass(),
    ];
}

function normalize_site_payload($payload): array
{
    $payload = is_array($payload) ? $payload : [];

    return [
        'creations' => array_values(is_array($payload['creations'] ?? null) ? $payload['creations'] : []),
        'pricing' => array_values(is_array($payload['pricing'] ?? null) ? $payload['pricing'] : []),
        'packs' => array_values(is_array($payload['packs'] ?? null) ? $payload['packs'] : []),
        'marketplace' => array_values(is_array($payload['marketplace'] ?? null) ? $payload['marketplace'] : []),
        'buttons' => is_array($payload['buttons'] ?? null) ? $payload['buttons'] : new stdClass(),
    ];
}

function migrate(): void
{
    $db = pdo();

    $db->exec(
        'CREATE TABLE IF NOT EXISTS ls_admin_users (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(80) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );

    $db->exec(
        'CREATE TABLE IF NOT EXISTS ls_site_data (
            id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
            payload LONGTEXT NOT NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );

    $userCount = (int) $db->query('SELECT COUNT(*) FROM ls_admin_users')->fetchColumn();
    if ($userCount === 0) {
        $statement = $db->prepare('INSERT INTO ls_admin_users (username, password_hash) VALUES (:username, :password_hash)');
        $statement->execute([
            ':username' => ADMIN_DEFAULT_USERNAME,
            ':password_hash' => password_hash(ADMIN_DEFAULT_PASSWORD, PASSWORD_DEFAULT),
        ]);
    }

    $dataCount = (int) $db->query('SELECT COUNT(*) FROM ls_site_data WHERE id = 1')->fetchColumn();
    if ($dataCount === 0) {
        $statement = $db->prepare('INSERT INTO ls_site_data (id, payload) VALUES (1, :payload)');
        $statement->execute([
            ':payload' => json_encode(default_site_payload(), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        ]);
    }
}

function read_json_body(bool $required = true): array
{
    $raw = file_get_contents('php://input') ?: '';
    if (trim($raw) === '') {
        if ($required) {
            json_response(['ok' => false, 'error' => 'EMPTY_BODY'], 400);
        }

        return [];
    }

    $payload = json_decode($raw, true);
    if (!is_array($payload)) {
        json_response(['ok' => false, 'error' => 'INVALID_JSON'], 400);
    }

    return $payload;
}

function request_payload(): array
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') !== false) {
        return read_json_body(false);
    }

    return $_POST;
}

function current_admin(): ?array
{
    if (empty($_SESSION[ADMIN_SESSION_KEY])) {
        return null;
    }

    return [
        'id' => (int) $_SESSION[ADMIN_SESSION_KEY],
        'username' => (string) ($_SESSION[ADMIN_SESSION_NAME_KEY] ?? ''),
    ];
}

function require_admin(): array
{
    $admin = current_admin();
    if (!$admin) {
        json_response(['ok' => false, 'error' => 'AUTH_REQUIRED'], 401);
    }

    return $admin;
}

function get_site_data(): array
{
    $statement = pdo()->query('SELECT payload FROM ls_site_data WHERE id = 1');
    $payload = $statement->fetchColumn();
    $decoded = json_decode((string) $payload, true);

    return normalize_site_payload($decoded);
}

function save_site_data(array $data): void
{
    $payload = json_encode(normalize_site_payload($data), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($payload === false) {
        json_response(['ok' => false, 'error' => 'ENCODE_FAILED'], 400);
    }

    $statement = pdo()->prepare('UPDATE ls_site_data SET payload = :payload WHERE id = 1');
    $statement->execute([':payload' => $payload]);
}

function collect_upload_paths($value): array
{
    $paths = [];

    if (is_array($value)) {
        foreach ($value as $item) {
            foreach (collect_upload_paths($item) as $path) {
                $paths[$path] = true;
            }
        }
    } elseif (is_string($value)) {
        $path = str_replace('\\', '/', $value);
        $prefix = UPLOAD_PUBLIC_DIR . '/';
        if (
            strpos($path, $prefix) === 0
            && strpos($path, '..') === false
            && preg_match('#^[a-zA-Z0-9_./-]+$#', $path)
        ) {
            $paths[$path] = true;
        }
    }

    return array_keys($paths);
}

function upload_absolute_path(string $publicPath): ?string
{
    $publicPath = str_replace('\\', '/', $publicPath);
    $prefix = UPLOAD_PUBLIC_DIR . '/';
    if (strpos($publicPath, $prefix) !== 0 || strpos($publicPath, '..') !== false) {
        return null;
    }

    $uploadRoot = dirname(__DIR__) . DIRECTORY_SEPARATOR . UPLOAD_PUBLIC_DIR;
    $relativePath = substr($publicPath, strlen($prefix));
    $absolutePath = $uploadRoot . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relativePath);
    $realRoot = realpath($uploadRoot);
    $realDirectory = realpath(dirname($absolutePath));

    if (!$realRoot || !$realDirectory || strpos($realDirectory, $realRoot) !== 0) {
        return null;
    }

    return $absolutePath;
}

function delete_unused_uploads(array $previousData, array $nextData): void
{
    $previousPaths = collect_upload_paths($previousData);
    $nextPaths = array_flip(collect_upload_paths($nextData));

    foreach ($previousPaths as $path) {
        if (isset($nextPaths[$path])) {
            continue;
        }

        $absolutePath = upload_absolute_path($path);
        if ($absolutePath && is_file($absolutePath)) {
            @unlink($absolutePath);
        }
    }
}
