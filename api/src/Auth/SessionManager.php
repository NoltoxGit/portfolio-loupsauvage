<?php

declare(strict_types=1);

namespace LoupSauvage\Auth;

use LoupSauvage\Support\Config;

final class SessionManager
{
    public function __construct(private readonly Config $config)
    {
    }

    public function start(?int $lifetime = null): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        $sessionName = $this->config->string('app.session_name', 'loupsauvage_session');
        if ($sessionName !== '') {
            session_name($sessionName);
        }

        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');

        session_set_cookie_params([
            'lifetime' => $lifetime ?? $this->config->int('app.session_lifetime', 0),
            'path' => '/',
            'secure' => $this->config->bool('app.session_secure', false),
            'httponly' => true,
            'samesite' => $this->config->string('app.session_same_site', 'Lax'),
        ]);

        session_start();
    }

    public function login(int $ownerId, bool $rememberMe = false): string
    {
        $lifetime = $rememberMe
            ? $this->config->int('app.session_remember_lifetime', 30 * 24 * 60 * 60)
            : $this->config->int('app.session_lifetime', 0);

        $this->start($lifetime);
        session_regenerate_id(true);

        $_SESSION['owner_user_id'] = $ownerId;
        $_SESSION['owner_role'] = 'owner';
        $_SESSION['remember_me'] = $rememberMe;

        return $this->csrfToken();
    }

    public function logout(): void
    {
        $this->start();
        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires' => time() - 42000,
                'path' => $params['path'] ?? '/',
                'domain' => $params['domain'] ?? '',
                'secure' => (bool) ($params['secure'] ?? false),
                'httponly' => (bool) ($params['httponly'] ?? true),
                'samesite' => $params['samesite'] ?? 'Lax',
            ]);
        }

        session_destroy();
    }

    public function ownerId(): ?int
    {
        $this->start();
        $ownerId = $_SESSION['owner_user_id'] ?? null;

        return is_numeric($ownerId) ? (int) $ownerId : null;
    }

    public function isOwner(): bool
    {
        $this->start();

        return $this->ownerId() !== null && ($_SESSION['owner_role'] ?? null) === 'owner';
    }

    public function csrfToken(): string
    {
        $this->start();

        if (!isset($_SESSION['csrf_token']) || !is_string($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }

        return $_SESSION['csrf_token'];
    }
}
