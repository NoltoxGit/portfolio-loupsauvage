<?php

declare(strict_types=1);

namespace LoupSauvage\Repositories;

use PDO;

final class BlockbenchApiTokenRepository
{
    public function __construct(private readonly PDO $db)
    {
    }

    public function create(string $name, string $tokenPrefix, string $tokenHash): int
    {
        $statement = $this->db->prepare('
            INSERT INTO blockbench_api_tokens (name, token_prefix, token_hash)
            VALUES (:name, :token_prefix, :token_hash)
        ');
        $statement->execute([
            'name' => $name,
            'token_prefix' => $tokenPrefix,
            'token_hash' => $tokenHash,
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findUsableByPrefix(string $tokenPrefix): ?array
    {
        $statement = $this->db->prepare('
            SELECT id, name, token_prefix, token_hash, created_by_user_id
            FROM blockbench_api_tokens
            WHERE token_prefix = :token_prefix
              AND revoked_at IS NULL
            LIMIT 1
        ');
        $statement->execute(['token_prefix' => $tokenPrefix]);

        $token = $statement->fetch();

        return is_array($token) ? $token : null;
    }

    public function markUsed(int $id): void
    {
        $statement = $this->db->prepare('
            UPDATE blockbench_api_tokens
            SET last_used_at = CURRENT_TIMESTAMP
            WHERE id = :id
        ');
        $statement->execute(['id' => $id]);
    }
}
