<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

try {
    migrate();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $action = (string) ($_GET['action'] ?? 'me');
        if ($action !== 'me') {
            json_response(['ok' => false, 'error' => 'UNKNOWN_ACTION'], 400);
        }

        json_response([
            'ok' => true,
            'authenticated' => current_admin() !== null,
            'admin' => current_admin(),
        ]);
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        json_response(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED'], 405);
    }

    $payload = request_payload();
    $action = (string) ($payload['action'] ?? '');

    if ($action === 'login') {
        $username = trim((string) ($payload['username'] ?? ''));
        $password = (string) ($payload['password'] ?? '');

        $statement = pdo()->prepare('SELECT id, username, password_hash FROM ls_admin_users WHERE username = :username LIMIT 1');
        $statement->execute([':username' => $username]);
        $user = $statement->fetch();

        if (!$user || !password_verify($password, (string) $user['password_hash'])) {
            json_response(['ok' => false, 'error' => 'INVALID_LOGIN'], 401);
        }

        session_regenerate_id(true);
        $_SESSION[ADMIN_SESSION_KEY] = (int) $user['id'];
        $_SESSION[ADMIN_SESSION_NAME_KEY] = (string) $user['username'];

        json_response([
            'ok' => true,
            'authenticated' => true,
            'admin' => current_admin(),
        ]);
    }

    if ($action === 'logout') {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'] ?? '', (bool) $params['secure'], (bool) $params['httponly']);
        }
        session_destroy();
        json_response(['ok' => true, 'authenticated' => false]);
    }

    if ($action === 'reset-password') {
        $username = trim((string) ($payload['username'] ?? ADMIN_DEFAULT_USERNAME));
        $resetToken = (string) ($payload['resetToken'] ?? '');
        $newPassword = (string) ($payload['newPassword'] ?? '');

        if (!hash_equals(ADMIN_PASSWORD_RESET_TOKEN, $resetToken)) {
            json_response(['ok' => false, 'error' => 'INVALID_RESET_TOKEN'], 401);
        }

        if (strlen($newPassword) < 8) {
            json_response(['ok' => false, 'error' => 'PASSWORD_TOO_SHORT'], 400);
        }

        $statement = pdo()->prepare('UPDATE ls_admin_users SET password_hash = :password_hash WHERE username = :username');
        $statement->execute([
            ':username' => $username,
            ':password_hash' => password_hash($newPassword, PASSWORD_DEFAULT),
        ]);

        if ($statement->rowCount() === 0) {
            json_response(['ok' => false, 'error' => 'USER_NOT_FOUND'], 404);
        }

        json_response(['ok' => true]);
    }

    if ($action === 'change-password') {
        $admin = require_admin();
        $currentPassword = (string) ($payload['currentPassword'] ?? '');
        $newPassword = (string) ($payload['newPassword'] ?? '');

        if (strlen($newPassword) < 8) {
            json_response(['ok' => false, 'error' => 'PASSWORD_TOO_SHORT'], 400);
        }

        $statement = pdo()->prepare('SELECT password_hash FROM ls_admin_users WHERE id = :id LIMIT 1');
        $statement->execute([':id' => $admin['id']]);
        $hash = (string) $statement->fetchColumn();

        if (!$hash || !password_verify($currentPassword, $hash)) {
            json_response(['ok' => false, 'error' => 'INVALID_PASSWORD'], 401);
        }

        $statement = pdo()->prepare('UPDATE ls_admin_users SET password_hash = :password_hash WHERE id = :id');
        $statement->execute([
            ':id' => $admin['id'],
            ':password_hash' => password_hash($newPassword, PASSWORD_DEFAULT),
        ]);

        json_response(['ok' => true]);
    }

    json_response(['ok' => false, 'error' => 'UNKNOWN_ACTION'], 400);
} catch (Throwable $error) {
    json_response(['ok' => false, 'error' => 'SERVER_ERROR'], 500);
}
