<?php

declare(strict_types=1);

namespace LoupSauvage\Middleware;

use LoupSauvage\Auth\Csrf;
use LoupSauvage\Auth\SessionManager;
use LoupSauvage\Repositories\UserRepository;
use LoupSauvage\Support\ApiException;

final class RequireOwner
{
    public function __construct(
        private readonly SessionManager $session,
        private readonly UserRepository $users,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function authorize(bool $requireCsrf = false): array
    {
        $ownerId = $this->session->ownerId();

        if ($ownerId === null) {
            throw new ApiException('UNAUTHENTICATED', 'Authentication required.', 401);
        }

        $owner = $this->users->findOwnerById($ownerId);

        if ($owner === null) {
            throw new ApiException('UNAUTHENTICATED', 'Authentication required.', 401);
        }

        if ($requireCsrf && !(new Csrf($this->session))->isValid()) {
            throw new ApiException('CSRF_INVALID', 'Invalid CSRF token.', 403);
        }

        return [
            'owner' => $owner,
            'csrfToken' => $this->session->csrfToken(),
        ];
    }
}
