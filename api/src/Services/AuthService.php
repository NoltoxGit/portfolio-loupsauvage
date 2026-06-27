<?php

declare(strict_types=1);

namespace LoupSauvage\Services;

use LoupSauvage\Auth\SessionManager;
use LoupSauvage\Repositories\UserRepository;

final class AuthService
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly SessionManager $session,
    ) {
    }

    /**
     * @return array<string, mixed>|null
     */
    public function login(string $email, string $password): ?array
    {
        $user = $this->users->findActiveOwnerByEmail($email);

        if ($user === null || !password_verify($password, (string) $user['password_hash'])) {
            return null;
        }

        $csrfToken = $this->session->login((int) $user['id']);
        $this->users->updateLastLogin((int) $user['id']);

        return [
            'user' => $this->users->publicUser($user),
            'csrfToken' => $csrfToken,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    public function currentSession(): ?array
    {
        $ownerId = $this->session->ownerId();
        if ($ownerId === null) {
            return null;
        }

        $user = $this->users->findOwnerById($ownerId);
        if ($user === null) {
            return null;
        }

        return [
            'user' => $user,
            'csrfToken' => $this->session->csrfToken(),
        ];
    }
}
