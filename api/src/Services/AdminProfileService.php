<?php

declare(strict_types=1);

namespace LoupSauvage\Services;

use LoupSauvage\Repositories\UserRepository;
use LoupSauvage\Support\ApiException;

final class AdminProfileService
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly BlockbenchApiTokenService $blockbenchTokens,
    ) {
    }

    /**
     * @param array<string, mixed> $owner
     * @return array<string, mixed>
     */
    public function profile(array $owner): array
    {
        return [
            'user' => [
                'id' => (int) $owner['id'],
                'username' => (string) $owner['username'],
                'email' => (string) $owner['email'],
            ],
            'blockbenchTokens' => $this->blockbenchTokens->list(),
        ];
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, bool>
     */
    public function changePassword(int $ownerId, array $payload): array
    {
        $currentPassword = (string) ($payload['currentPassword'] ?? '');
        $newPassword = (string) ($payload['newPassword'] ?? '');
        $confirmPassword = (string) ($payload['confirmPassword'] ?? '');
        $fields = [];

        if ($currentPassword === '') {
            $fields['currentPassword'] = 'Le mot de passe actuel est obligatoire.';
        }

        if (strlen($newPassword) < 12) {
            $fields['newPassword'] = 'Le nouveau mot de passe doit contenir au moins 12 caractères.';
        }

        if ($newPassword !== $confirmPassword) {
            $fields['confirmPassword'] = 'La confirmation ne correspond pas au nouveau mot de passe.';
        }

        if ($fields !== []) {
            throw new ApiException('VALIDATION_ERROR', 'Invalid password payload.', 422, $fields);
        }

        $owner = $this->users->findOwnerCredentialsById($ownerId);

        if ($owner === null || !password_verify($currentPassword, (string) $owner['password_hash'])) {
            throw new ApiException('PASSWORD_INVALID', 'Invalid current password.', 403, [
                'currentPassword' => 'Le mot de passe actuel est incorrect.',
            ]);
        }

        $this->users->updatePasswordHash($ownerId, password_hash($newPassword, PASSWORD_DEFAULT));

        return ['changed' => true];
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function createBlockbenchToken(int $ownerId, array $payload): array
    {
        $name = (string) ($payload['name'] ?? '');

        return $this->blockbenchTokens->create($name, $ownerId);
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, bool>
     */
    public function revokeBlockbenchToken(array $payload): array
    {
        $id = $payload['id'] ?? null;

        if (!is_numeric($id)) {
            throw new ApiException('VALIDATION_ERROR', 'Invalid token id.', 422, [
                'id' => 'Une clé valide est requise.',
            ]);
        }

        $this->blockbenchTokens->revoke((int) $id);

        return ['revoked' => true];
    }
}
