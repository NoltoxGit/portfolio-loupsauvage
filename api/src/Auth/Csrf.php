<?php

declare(strict_types=1);

namespace LoupSauvage\Auth;

final class Csrf
{
    public function __construct(private readonly SessionManager $session)
    {
    }

    public function headerToken(): string
    {
        return trim((string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''));
    }

    public function isValid(): bool
    {
        $token = $this->headerToken();

        return $token !== '' && hash_equals($this->session->csrfToken(), $token);
    }
}
