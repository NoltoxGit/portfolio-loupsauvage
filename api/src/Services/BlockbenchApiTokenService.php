<?php

declare(strict_types=1);

namespace LoupSauvage\Services;

use LoupSauvage\Repositories\BlockbenchApiTokenRepository;
use LoupSauvage\Support\ApiException;
use PDOException;

final class BlockbenchApiTokenService
{
    public function __construct(private readonly BlockbenchApiTokenRepository $tokens)
    {
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function list(): array
    {
        return array_map(
            static fn (array $token): array => [
                'id' => (int) $token['id'],
                'name' => (string) $token['name'],
                'tokenPrefix' => (string) $token['token_prefix'],
                'lastUsedAt' => $token['last_used_at'] !== null ? (string) $token['last_used_at'] : null,
                'revokedAt' => $token['revoked_at'] !== null ? (string) $token['revoked_at'] : null,
                'createdByUserId' => $token['created_by_user_id'] !== null ? (int) $token['created_by_user_id'] : null,
                'createdAt' => (string) $token['created_at'],
                'updatedAt' => (string) $token['updated_at'],
            ],
            $this->tokens->listAll(),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function create(string $name, ?int $createdByUserId = null): array
    {
        $name = trim($name);

        if ($name === '' || strlen($name) > 120) {
            throw new ApiException('VALIDATION_ERROR', 'Invalid token name.', 422, [
                'name' => 'Le nom est obligatoire et doit contenir 120 caractères maximum.',
            ]);
        }

        for ($attempt = 0; $attempt < 5; ++$attempt) {
            $token = $this->generateToken();
            $prefix = $this->prefix($token);

            try {
                $id = $this->tokens->create($name, $prefix, $this->hash($token), $createdByUserId);

                return [
                    'token' => $token,
                    'item' => [
                        'id' => $id,
                        'name' => $name,
                        'tokenPrefix' => $prefix,
                        'lastUsedAt' => null,
                        'revokedAt' => null,
                        'createdByUserId' => $createdByUserId,
                    ],
                ];
            } catch (PDOException $error) {
                if ($error->getCode() !== '23000') {
                    throw $error;
                }
            }
        }

        throw new ApiException('TOKEN_GENERATION_FAILED', 'Unable to create a unique token.', 500);
    }

    public function revoke(int $id): void
    {
        if ($id <= 0) {
            throw new ApiException('VALIDATION_ERROR', 'Invalid token id.', 422, [
                'id' => 'Une clé valide est requise.',
            ]);
        }

        if (!$this->tokens->revoke($id)) {
            throw new ApiException('NOT_FOUND', 'Token not found.', 404);
        }
    }

    public function generateToken(): string
    {
        return 'lsbb_' . bin2hex(random_bytes(32));
    }

    public function prefix(string $token): string
    {
        return substr($token, 0, 12);
    }

    public function hash(string $token): string
    {
        return hash('sha256', $token);
    }
}
